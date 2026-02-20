import ReportTable from "../ReportTable";
import { MOCK_REPORTS, filterByCategory } from "../shared";

export default function PoliceReportsPage() {
    const reports = filterByCategory(MOCK_REPORTS, "police");
    return (
        <ReportTable
            reports={reports}
            title="Police Reports"
            subtitle={`${reports.length} incidents where police were notified`}
        />
    );
}
