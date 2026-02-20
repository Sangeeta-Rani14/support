import ReportTable from "../ReportTable";
import { MOCK_REPORTS, filterByCategory } from "../shared";

export default function AmbulanceReportsPage() {
    const reports = filterByCategory(MOCK_REPORTS, "ambulance");
    return (
        <ReportTable
            reports={reports}
            title="Ambulance Reports"
            subtitle={`${reports.length} incidents where ambulance was dispatched`}
        />
    );
}
