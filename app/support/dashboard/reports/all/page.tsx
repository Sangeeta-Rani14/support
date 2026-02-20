import ReportTable from "../ReportTable";
import { MOCK_REPORTS } from "../shared";

export default function AllReportsPage() {
    return (
        <ReportTable
            reports={MOCK_REPORTS}
            title="All Reports"
            subtitle={`Complete log of all ${MOCK_REPORTS.length} emergency submissions`}
        />
    );
}
