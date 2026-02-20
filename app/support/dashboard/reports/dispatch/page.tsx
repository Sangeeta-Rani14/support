import ReportTable from "../ReportTable";
import { MOCK_REPORTS, filterByCategory } from "../shared";

export default function DispatchReportsPage() {
    const reports = filterByCategory(MOCK_REPORTS, "dispatch");
    return (
        <ReportTable
            reports={reports}
            title="Dispatch Control Reports"
            subtitle={`${reports.length} incidents with active or completed dispatches`}
        />
    );
}
