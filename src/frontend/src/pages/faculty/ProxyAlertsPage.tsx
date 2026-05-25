import { AlertTriangle, MapPin, ShieldCheck } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import { formatTimestamp, useAllAttendance } from "../../hooks/useQueries";

export default function ProxyAlertsPage() {
  const { data: allRecords = [], isLoading } = useAllAttendance();
  const flagged = allRecords.filter((r) => r.geo_fail);

  return (
    <div>
      <Topbar
        title="Proxy Alerts"
        subtitle="Geo-flagged attendance records for manual review"
      />
      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Alerts",
              value: flagged.length,
              color: "var(--danger)",
              bg: "var(--danger-bg)",
            },
            {
              label: "Today",
              value: flagged.filter((r) => {
                const d = new Date(Number(r.timestamp) / 1_000_000);
                const today = new Date();
                return d.toDateString() === today.toDateString();
              }).length,
              color: "var(--warning)",
              bg: "var(--warning-bg)",
            },
            {
              label: "This Week",
              value: flagged.filter((r) => {
                const d = new Date(Number(r.timestamp) / 1_000_000);
                const now = new Date();
                const diff =
                  (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
              }).length,
              color: "var(--blue)",
              bg: "var(--info-bg)",
            },
            {
              label: "Pending Review",
              value: flagged.length,
              color: "var(--purple)",
              bg: "rgba(139,92,246,0.12)",
            },
          ].map((c, i) => (
            <div
              key={c.label}
              data-ocid={`proxy_summary.item.${i + 1}`}
              className="rounded-2xl p-4 border text-center"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border-color)",
              }}
            >
              <p className="text-3xl font-bold" style={{ color: c.color }}>
                {c.value}
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {c.label}
              </p>
            </div>
          ))}
        </div>

        {/* Flagged records table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center gap-3"
            style={{ borderColor: "var(--border-color)" }}
          >
            <AlertTriangle
              className="w-4 h-4"
              style={{ color: "var(--danger)" }}
            />
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              GEO_FAIL Records
              {!isLoading && (
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: "var(--text-secondary)" }}
                >
                  — {flagged.length} flagged
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((k) => (
                <div
                  key={k}
                  className="h-12 rounded-xl animate-pulse"
                  style={{ background: "var(--surface-2)" }}
                />
              ))}
            </div>
          ) : flagged.length === 0 ? (
            <div
              data-ocid="proxy_alerts.empty_state"
              className="flex flex-col items-center justify-center gap-4 py-16"
            >
              <ShieldCheck
                className="w-10 h-10"
                style={{ color: "var(--success)" }}
              />
              <p
                className="text-base font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                No proxy alerts
              </p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                All clear — no suspicious activity detected.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    {[
                      "Student",
                      "PRN",
                      "Timestamp",
                      "Coordinates",
                      "Status",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {flagged.map((r, i) => (
                    <tr
                      key={r.id}
                      data-ocid={`proxy_alerts.item.${i + 1}`}
                      className="border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <td className="px-4 py-3">
                        <span style={{ color: "var(--text-primary)" }}>
                          {r.student_name}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {r.prn}
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatTimestamp(r.timestamp).full}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <MapPin className="w-3 h-3 shrink-0" />
                          {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          data-ocid={`proxy_alerts.geo_fail_badge.${i + 1}`}
                          className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide"
                          style={{
                            background: "#EF44441A",
                            color: "#EF4444",
                            border: "1px solid #EF444466",
                          }}
                        >
                          GEO_FAIL
                        </span>
                      </td>
                    </tr>
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
