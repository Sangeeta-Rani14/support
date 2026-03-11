

export interface UserProfile {
    id: string;
    name: string;
    mobile: string;
    bloodGroup: string;
    photoUrl: string;
    scannerNumber: string;
    address?: string;
    familyContact?: string;
    familyName?: string;
}

export interface EmergencyNotification {
    id: string;
    reporter: string;
    phone: string;
    location: string;
    condition: string;
    notes: string;
    timestamp: string;
    type: "new_report";
    photo?: File | null;
    video?: Blob | null;
    bloodGroup?: string;
    scannerNumber?: string;
    photoUrl?: string;
    familyContact?: string;
    familyName?: string;
    accidentType?: string;
    caseId?: string;        // Room name (from API response caseId)
}

const CHANNEL_NAME = "jan-setu-emergency";


export interface CallStartedNotification {
    type: "call_started";
    reportId: string;
}

export interface SupportReadyNotification {
    type: "support_ready";
    reportId: string;
    supportPeerId: string;
}

//  Send an emergency notification to all listening tabs (dashboard)

export function broadcastEmergency(data: Omit<EmergencyNotification, "id" | "timestamp" | "type">) {
    if (typeof window === "undefined") return null;

    const channel = new BroadcastChannel(CHANNEL_NAME);
    const id = crypto.randomUUID();
    const notification: EmergencyNotification = {
        ...data,
        id,
        timestamp: new Date().toISOString(),
        type: "new_report",
    };

    channel.postMessage(notification);
    return notification;
}

export function broadcastCallStart(reportId: string) {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const notification: CallStartedNotification = {
        type: "call_started",
        reportId,
    };
    channel.postMessage(notification);
}

export function broadcastSupportReady(reportId: string, supportPeerId: string) {
    if (typeof window === "undefined") return;
    const channel = new BroadcastChannel(CHANNEL_NAME);
    const notification: SupportReadyNotification = {
        type: "support_ready",
        reportId,
        supportPeerId,
    };
    channel.postMessage(notification);
}

/**
 * Subscribe to emergency notifications (used on dashboard)
 * Returns a cleanup function
 */
export function onEmergencyNotification(
    callback: (notification: EmergencyNotification | CallStartedNotification | SupportReadyNotification) => void
): () => void {
    if (typeof window === "undefined") return () => { };

    const channel = new BroadcastChannel(CHANNEL_NAME);
    const handler = (event: MessageEvent) => callback(event.data);

    channel.addEventListener("message", handler);
    return () => {
        channel.removeEventListener("message", handler);
        channel.close();
    };
}

/**
 * Simulated user database for QR scan lookup
 * In production this would be an API call
 */
export const MOCK_USER_DB: Record<string, UserProfile> = {
    "user-001": {
        id: "user-001",
        name: "Rajesh Kumar",
        mobile: "+91 98765 43210",
        bloodGroup: "B+",
        photoUrl: "/placeholder-user.png",
        scannerNumber: "JS-2024-001",
        address: "123 MG Road, Bengaluru, Karnataka",
        familyContact: "+91 91234 56789",
        familyName: "Sunita Kumar (Wife)",
    },
    "user-002": {
        id: "user-002",
        name: "Priya Sharma",
        mobile: "+91 87654 32109",
        bloodGroup: "O+",
        photoUrl: "/placeholder-user.png",
        scannerNumber: "JS-2024-002",
        address: "45 Park Street, Mumbai, Maharashtra",
        familyContact: "+91 90123 45678",
        familyName: "Arun Sharma (Husband)",
    },
    "user-003": {
        id: "user-003",
        name: "Amit Patel",
        mobile: "+91 76543 21098",
        bloodGroup: "A+",
        photoUrl: "/placeholder-user.png",
        scannerNumber: "JS-2024-003",
        address: "78 Civil Lines, Ahmedabad, Gujarat",
        familyContact: "+91 89012 34567",
        familyName: "Meera Patel (Mother)",
    },
};

/**
 * Fetch user details by userId (simulates API call)
 * Returns a promise that resolves with user profile or null
 */
export async function fetchUserDetails(userId: string): Promise<UserProfile | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    const user = MOCK_USER_DB[userId];
    if (user) {
        return user;
    }

    // Return a generic user if not found in mock DB (for demo)
    return null;
}
