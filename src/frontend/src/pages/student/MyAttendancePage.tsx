import type { AttendanceRecord } from "@/backend";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Search, SmartphoneNfc, User } from "lucide-react";
import { useMemo, useState } from "react";
import Topbar from "../../components/layout/Topbar";
import { formatTimestamp, useAllAttendance } from "../../hooks/useQueries";

// ─── empty state ─────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      data-ocid="my_attendance.empty_state"
      className="flex flex-col items-center justify-center gap-4 py-16"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(59,130,246,0.1)" }}
      >
        <SmartphoneNfc className="w-8 h-8" style={{ color: "#3B82F6" }} />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
          No attendance records found
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Records will appear here after students tap the NFC tag
        </p>
      </div>
    </div>
  );
}

// ─── skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-14 rounded-xl" />
      ))}
    </div>
  );
}

// ─── record row ──────────────────────────────────────────────────────────────
function RecordRow({ rec, index }: { rec: AttendanceRecord; index: number }) {
  const { date, time } = formatTimestamp(rec.timestamp);
  const lat = rec.latitude.toFixed(4);
  const lon = rec.longitude.toFixed(4);

  return (
    <tr
      data-ocid={`attendance.item.${index + 1}`}
      className="border-t"
      style={{ borderColor: "var(--border-color)" }}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(59,130,246,0.12)" }}
          >
            <User className="w-4 h-4" style={{ color: "#3B82F6" }} />
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {rec.student_name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              PRN: {rec.prn}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Calendar
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "var(--text-secondary)" }}
          />
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>
              {date}
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {time}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <MapPin
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ color: "#22C55E" }}
          />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {lat}, {lon}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: "var(--success-bg)",
            color: "var(--success)",
          }}
        >
          Present
        </span>
      </td>
    </tr>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function MyAttendancePage() {
  const [search, setSearch] = useState("");
  const { data: allRecords = [], isLoading } = useAllAttendance();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...allRecords].sort(
      (a, b) => Number(b.timestamp) - Number(a.timestamp),
    );
    if (!q) return sorted;
    return sorted.filter(
      (r) =>
        r.student_name.toLowerCase().includes(q) ||
        r.prn.toLowerCase().includes(q),
    );
  }, [allRecords, search]);

  return (
    <div>
      <Topbar
        title="Attendance Records"
        subtitle="All NFC check-ins — chronological view"
      />
      <div className="p-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-secondary)" }}
          />
          <Input
            data-ocid="my_attendance.search_input"
            className="pl-9"
            placeholder="Search by name or PRN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Summary pill */}
        {!isLoading && allRecords.length > 0 && (
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Showing{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {filtered.length}
            </strong>{" "}
            of {allRecords.length} records
          </p>
        )}

        {/* Table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Check-in History
            </h2>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    {["Student", "Date & Time", "Location", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, i) => (
                    <RecordRow key={rec.id} rec={rec} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
