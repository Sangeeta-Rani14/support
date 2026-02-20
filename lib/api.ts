import axios from "axios";

// ── Base client ───────────────────────────────────────────────────────────────
// Change this one URL if the backend moves (e.g., staging / production)
export const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
    headers: { "Content-Type": "application/json" },
    timeout: 15_000, // 15 s — give uploads time to complete
});

// ── EMR Submission ─────────────────────────────────────────────────────────────
export interface EmrSubmissionPayload {
    source: string;
    userId: string | null;
    patientId: string | null;
    evidenceCapture: {
        photoUrl: string | null;
        videoUrl: string | null;
    };
    victimCondition: {
        currentCondition: string;
        additionalNotes: string;
    };
    reporterInfo: {
        fullName: string;
        mobile: string;
    };
}

export interface EmrSubmissionResponse {
    success: boolean;
    submissionId?: string;
    message?: string;
}

export async function submitEmrForm(payload: EmrSubmissionPayload): Promise<EmrSubmissionResponse> {
    const { data } = await apiClient.post<EmrSubmissionResponse>(
        "/api/v1/emr-submissions",
        payload
    );
    return data;
}
