// ── Base URL ───────────────────────────────────────────────────────────────────
// Change this one constant if the backend moves (staging / production).
const BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.jansetu.org";

// ── Generic fetch helper ───────────────────────────────────────────────────────
// Wraps native fetch with JSON serialisation, error normalisation, and a
// configurable timeout. Throws an ApiError on non-2xx responses so TanStack
// Query can surface them in mutation.error / query.error.

import { getToken, getRefreshToken, setTokens, clearTokens } from "./auth";

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        public readonly message: string,
        public readonly data?: unknown
    ) {
        super(message);
        this.name = "ApiError";
    }
}

interface FetchOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    timeoutMs?: number;
}

async function apiFetch<T>(
    path: string,
    { body, timeoutMs = 15_000, ...init }: FetchOptions = {}
): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const token = getToken();
        const res = await fetch(`${BASE_URL}${path}`, {
            ...init,
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(init.headers ?? {}),
            },
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        // Try to parse a JSON body regardless of status
        let responseData: any;
        try {
            responseData = await res.json();
        } catch {
            responseData = null;
        }

        if (!res.ok) {
            // Handle 401 Unauthorized - try to refresh token
            if (res.status === 401 && !path.includes("/auth/refresh") && !path.includes("/auth/login")) {
                try {
                    const refreshRes = await refreshToken();
                    if (refreshRes.success) {
                        // Retry the original request with new token
                        const newToken = refreshRes.data.token;
                        return apiFetch<T>(path, {
                            ...init,
                            headers: {
                                ...init.headers,
                                "Authorization": `Bearer ${newToken}`,
                            },
                        });
                    }
                } catch (refreshErr) {
                    // Refresh failed, clear tokens and redirect to login
                    clearTokens();
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                    throw new ApiError(401, "Session expired. Please login again.");
                }
            }

            const message = responseData?.message ?? `Request failed with status ${res.status}`;
            throw new ApiError(res.status, message, responseData);
        }

        return responseData as T;
    } catch (err) {
        if (err instanceof ApiError) throw err;

        // AbortController fired → treat as network timeout
        if ((err as Error).name === "AbortError") {
            throw new ApiError(0, "Request timed out. Please try again.");
        }

        // Other network errors (offline, DNS failure, etc.)
        throw new ApiError(0, "Could not reach the server. Please try again.");
    } finally {
        clearTimeout(timer);
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Converts a File or Blob to a base64 data URL string.
 * Returns an empty string if no file is provided.
 * Used to embed evidence inline in the single JSON submission payload.
 */
export function blobToDataUrl(blob: Blob | File | null | undefined): Promise<string> {
    if (!blob) return Promise.resolve("");

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(blob);
    });
}

// ── EMR Submission ─────────────────────────────────────────────────────────────

export interface EmrSubmissionPayload {
    source: string;
    userId: string;
    patientId: string;
    evidenceCapture: {
        photoUrl: string;
        videoUrl: string;
    };
    victimCondition: {
        currentCondition: string;
        additionalNotes: string;
    };
    reporterInfo: {
        fullName: string;
        mobile: string;
    };
    location?: {
        latitude: number;
        longitude: number;
        address: string;
    };
}

export interface EmrSubmissionResponse {
    success: boolean;
    submissionId?: string;
    caseId?: string;       // returned by API — used as Jitsi room name
    message?: string;
}

export interface EmrVideoUploadResponse {
    success: boolean;
    videoUrl?: string;
    fileId?: string;
    message?: string;
}

/**
 * POST /api/v1/emr-submissions/upload-video  (multipart/form-data)
 * Uploads the evidence video as a file. The backend expects the file under the
 * field name "video" (and some backends also accept "file" in the same request).
 * Returns a URL or file ID that can be referenced in the main submission.
 */
export async function uploadEmrVideo(
    videoBlob: Blob,
    filename = "recording.webm"
): Promise<EmrVideoUploadResponse> {
    const fd = new FormData();
    fd.append("video", videoBlob, filename);
    fd.append("file", videoBlob, filename);

    const controller = new AbortController();
    const timeoutMs = 60_000; // video upload can take longer
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const token = getToken();
        const res = await fetch(`${BASE_URL}/api/v1/emr-submissions/upload-video`, {
            method: "POST",
            body: fd,
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let responseData: unknown;
        try {
            responseData = await res.json();
        } catch {
            responseData = null;
        }

        if (!res.ok) {
            const message =
                (responseData as { message?: string })?.message ??
                `Video upload failed with status ${res.status}`;
            throw new ApiError(res.status, message, responseData);
        }

        return responseData as EmrVideoUploadResponse;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if ((err as Error).name === "AbortError") {
            throw new ApiError(0, "Video upload timed out. Please try again.");
        }
        throw new ApiError(0, "Could not reach the server. Please try again.");
    } finally {
        clearTimeout(timer);
    }
}

/**
 * POST /api/v1/emr-submissions  (application/json)
 * Sends the complete EMR payload including evidence as a single JSON body.
 * photoUrl / videoUrl are base64 data URLs generated client-side via blobToDataUrl().
 * Currently unused by the EMR form, which posts multipart/form-data instead, but
 * kept for potential server-side or future usage.
 */
export async function submitEmrForm(
    payload: EmrSubmissionPayload
): Promise<EmrSubmissionResponse> {
    return apiFetch<EmrSubmissionResponse>("/api/v1/emr-submissions", {
        method: "POST",
        body: payload,
    });
}

/**
 * POST /api/v1/emr-submissions  (multipart/form-data)
 * Used by the EMR form to stream real photo files using a FormData payload.
 * The browser will set the correct Content-Type including the multipart boundary.
 *
 * Expected fields:
 *   photo          — File  (photo evidence)
 *   victimCondition — JSON string  { currentCondition, additionalNotes }
 *   reporterInfo   — JSON string  { fullName, mobile }
 *   location       — JSON string  { latitude, longitude, address }
 *   source         — string  (e.g. "webapp")
 */
export async function submitEmrFormMultipart(
    formData: FormData
): Promise<EmrSubmissionResponse> {
    const controller = new AbortController();
    const timeoutMs = 30_000;
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const token = getToken();
        const res = await fetch(`${BASE_URL}/api/v1/emr-submissions`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        let responseData: unknown;
        try {
            responseData = await res.json();
        } catch {
            responseData = null;
        }

        if (!res.ok) {
            const message =
                (responseData as { message?: string })?.message ??
                `Request failed with status ${res.status}`;
            throw new ApiError(res.status, message, responseData);
        }

        return responseData as EmrSubmissionResponse;
    } catch (err) {
        if (err instanceof ApiError) throw err;
        if ((err as Error).name === "AbortError") {
            throw new ApiError(0, "Request timed out. Please try again.");
        }
        throw new ApiError(0, "Could not reach the server. Please try again.");
    } finally {
        clearTimeout(timer);
    }
}

// ── Authentication ─────────────────────────────────────────────────────────────

export interface LoginPayload {
    email?: string;
    mobile?: string;
    password?: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        token: string;
        refreshToken: string;
        user: {
            id: string;
            fullName: string;
            email: string;
            role: string;
            [key: string]: any;
        };
    };
}

/**
 * POST /api/v1/auth/login
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
    return apiFetch<LoginResponse>("/api/v1/auth/login", {
        method: "POST",
        body: payload,
    });
}

/**
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(): Promise<LoginResponse> {
    const rfToken = getRefreshToken();
    if (!rfToken) throw new Error("No refresh token available");

    const response = await apiFetch<LoginResponse>("/api/v1/auth/refresh", {
        method: "POST",
        body: { refreshToken: rfToken },
    });

    if (response.success && response.data) {
        setTokens(response.data.token, response.data.refreshToken);
    }

    return response;
}

// ── EMR Submissions List ───────────────────────────────────────────────────────

export interface EmrSubmissionItem {
    _id: string;
    source?: string;
    userId?: string;
    patientId?: string;
    evidenceCapture?: {
        photoUrl?: string | null;
        videoUrl?: string | null;
    };
    victimCondition?: {
        currentCondition?: string;
        additionalNotes?: string;
    };
    reporterInfo?: {
        fullName?: string;
        mobile?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface EmrSubmissionsListResponse {
    total: number;
    limit: number;
    skip: number;
    items: EmrSubmissionItem[];
}

/**
 * GET /api/v1/emr-submissions?limit=&skip=
 * Returns paginated EMR submissions sorted newest-first.
 */
export async function getEmrSubmissions(
    limit = 20,
    skip = 0
): Promise<EmrSubmissionsListResponse> {
    return apiFetch<EmrSubmissionsListResponse>(
        `/api/v1/emr-submissions?limit=${limit}&skip=${skip}`
    );
}
