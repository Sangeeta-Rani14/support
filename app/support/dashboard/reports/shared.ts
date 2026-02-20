// Shared types & data for all reports sub-routes

export type ReportStatus = "confirmed" | "dispatched" | "resolved" | "dismissed";
export type Condition = "critical" | "injured" | "stable";
export type UnitCategory = "ambulance" | "police" | "dispatch" | "all";

export interface IncidentReport {
    id: string;
    reporter: string;
    phone: string;
    location: string;
    condition: Condition;
    type: string;
    status: ReportStatus;
    createdAt: string;
    resolvedAt?: string;
    dispatchedUnits: string[];
    notes: string;
}

export const MOCK_REPORTS: IncidentReport[] = [
    {
        id: "EMR-2024-0192",
        reporter: "Rahul Sharma",
        phone: "+91 98765 43210",
        location: "Connaught Place, New Delhi",
        condition: "critical",
        type: "Medical Emergency",
        status: "resolved",
        createdAt: "2026-02-19T08:14:00Z",
        resolvedAt: "2026-02-19T08:47:00Z",
        dispatchedUnits: ["Ambulance", "Police"],
        notes: "Cardiac arrest. CPR administered on site. Transported to AIIMS.",
    },
    {
        id: "EMR-2024-0191",
        reporter: "Priya Mehta",
        phone: "+91 87654 32109",
        location: "Karol Bagh Metro Station",
        condition: "injured",
        type: "Accident",
        status: "dispatched",
        createdAt: "2026-02-19T09:30:00Z",
        dispatchedUnits: ["Ambulance", "Traffic Police"],
        notes: "Two-wheeler collision. Minor head injury. Conscious and breathing.",
    },
    {
        id: "EMR-2024-0190",
        reporter: "Amit Verma",
        phone: "+91 76543 21098",
        location: "Lajpat Nagar Market",
        condition: "stable",
        type: "Fire Incident",
        status: "confirmed",
        createdAt: "2026-02-19T10:05:00Z",
        dispatchedUnits: [],
        notes: "Small fire in market stall. Self-contained but assistance requested.",
    },
    {
        id: "EMR-2024-0189",
        reporter: "Sunita Rao",
        phone: "+91 65432 10987",
        location: "Dwarka Sector 12",
        condition: "critical",
        type: "Medical Emergency",
        status: "resolved",
        createdAt: "2026-02-18T15:20:00Z",
        resolvedAt: "2026-02-18T16:10:00Z",
        dispatchedUnits: ["Ambulance", "Family"],
        notes: "Stroke suspected. Immediate transport arranged.",
    },
    {
        id: "EMR-2024-0188",
        reporter: "Vikram Singh",
        phone: "+91 54321 09876",
        location: "India Gate, New Delhi",
        condition: "stable",
        type: "Missing Person",
        status: "dismissed",
        createdAt: "2026-02-18T12:00:00Z",
        dispatchedUnits: [],
        notes: "Person found after 20 min. False alarm.",
    },
    {
        id: "EMR-2024-0187",
        reporter: "Deepika Jain",
        phone: "+91 43210 98765",
        location: "Rohini Sector 3",
        condition: "injured",
        type: "Domestic Violence",
        status: "resolved",
        createdAt: "2026-02-18T09:45:00Z",
        resolvedAt: "2026-02-18T11:30:00Z",
        dispatchedUnits: ["Police", "Family"],
        notes: "Police responded. Victim taken to shelter.",
    },
    {
        id: "EMR-2024-0186",
        reporter: "Arjun Nair",
        phone: "+91 90123 45678",
        location: "CP Inner Circle, New Delhi",
        condition: "injured",
        type: "Accident",
        status: "dispatched",
        createdAt: "2026-02-19T11:15:00Z",
        dispatchedUnits: ["Ambulance"],
        notes: "Pedestrian hit by vehicle. Conscious. Ambulance en route.",
    },
    {
        id: "EMR-2024-0185",
        reporter: "Meena Gupta",
        phone: "+91 89012 34567",
        location: "Saket District Centre",
        condition: "critical",
        type: "Medical Emergency",
        status: "dispatched",
        createdAt: "2026-02-19T12:00:00Z",
        dispatchedUnits: ["Ambulance", "Police", "Family"],
        notes: "Chest pain. History of cardiac issues. All units dispatched.",
    },
];

export function filterByCategory(reports: IncidentReport[], category: UnitCategory): IncidentReport[] {
    if (category === "all") return reports;
    if (category === "ambulance") return reports.filter((r) => r.dispatchedUnits.some((u) => u.toLowerCase().includes("ambulance")));
    if (category === "police") return reports.filter((r) => r.dispatchedUnits.some((u) => u.toLowerCase().includes("police")));
    if (category === "dispatch") return reports.filter((r) => r.status === "dispatched" || r.dispatchedUnits.length > 0);
    return reports;
}
