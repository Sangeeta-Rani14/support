'use client';

import { memo, useEffect, useMemo, useState, useCallback } from "react";
import { Activity, MoreHorizontal, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EmergencyNotification } from "@/lib/emergency-channel";

interface ReportsTableWithPaginationProps {
  reports: EmergencyNotification[];
  onSelectReport: (report: EmergencyNotification) => void;
}

function ReportsTableWithPaginationComponent({
  reports,
  onSelectReport,
}: ReportsTableWithPaginationProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(
      (r) =>
        r.reporter.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.condition.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [reports, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const handlePrev = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  const handleNext = useCallback(() => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Recent Reports</h2>
          <p className="text-xs text-muted-foreground">
            Live emergency reports from the field
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 h-8 text-xs w-48"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
          />
        </div>
      </div>

      <div className="border border-border/60 rounded-xl overflow-hidden bg-white">
        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Activity className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              No reports found
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Adjust your search or wait for new reports
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Reporter</TableHead>
                <TableHead className="text-xs">Condition</TableHead>
                <TableHead className="text-xs hidden md:table-cell">
                  Location
                </TableHead>
                <TableHead className="text-xs hidden sm:table-cell">
                  Time
                </TableHead>
                <TableHead className="text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((report) => (
                <TableRow
                  key={report.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => onSelectReport(report)}
                >
                  <TableCell className="font-medium text-sm">
                    {report.reporter}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        report.condition === "critical"
                          ? "destructive"
                          : report.condition === "injured"
                          ? "secondary"
                          : "outline"
                      }
                      className={`text-[10px] ${
                        report.condition === "injured"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : ""
                      }`}
                    >
                      {report.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                    {report.location}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">
                    {new Date(report.timestamp).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      type="button"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-semibold">{paginated.length}</span> of{" "}
          <span className="font-semibold">{filtered.length}</span> reports
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={handlePrev}
            disabled={page === 1}
            type="button"
          >
            Prev
          </Button>
          <span>
            Page <span className="font-semibold">{page}</span> of{" "}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px]"
            onClick={handleNext}
            disabled={page === totalPages}
            type="button"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

const ReportsTableWithPagination = memo(ReportsTableWithPaginationComponent);

export default ReportsTableWithPagination;

