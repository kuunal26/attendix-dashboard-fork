import { CheckCircle, Download, FileText } from "lucide-react";
import { useState } from "react";
import Topbar from "../../components/layout/Topbar";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const generateCSV = () => {
    setDownloading(true);
    const rows: string[] = [];
    rows.push(
      [
        "Student ID",
        "Student Name",
        "PRN",
        "Date",
        "Time",
        "Method",
        "Status",
      ].join(","),
    );
    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendix-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    }, 800);
  };

  return (
    <div>
      <Topbar title="Reports" subtitle="Export attendance data for analysis" />
      <div className="p-6 space-y-6">
        <div
          className="rounded-2xl p-8 border max-w-2xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "var(--info-bg)" }}
          >
            <FileText className="w-7 h-7" style={{ color: "var(--blue)" }} />
          </div>
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Full Attendance Report
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            Downloads a CSV file with all student attendance records.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "Students", value: 0 },
              { label: "Subjects", value: 0 },
              { label: "Records", value: 0 },
              { label: "Format", value: "CSV" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3 text-center border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-color)",
                }}
              >
                <p
                  className="text-xl font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {stat.value}
                </p>
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            data-ocid="reports.primary_button"
            onClick={generateCSV}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{
              background: downloaded
                ? "#22C55E"
                : "linear-gradient(135deg, #3B82F6, #8B5CF6)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
              opacity: downloading ? 0.7 : 1,
            }}
          >
            {downloaded ? (
              <>
                <CheckCircle className="w-4 h-4" /> Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />{" "}
                {downloading ? "Generating..." : "Export as CSV"}
              </>
            )}
          </button>
        </div>

        <div
          className="rounded-2xl border overflow-hidden max-w-4xl"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="px-5 py-4 border-b"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Data Preview
            </h3>
          </div>
          <div
            data-ocid="reports.empty_state"
            className="flex flex-col items-center justify-center gap-3 py-16"
          >
            <FileText
              className="w-10 h-10"
              style={{ color: "var(--text-secondary)", opacity: 0.5 }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              No records to preview
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Attendance data will appear here once recorded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
