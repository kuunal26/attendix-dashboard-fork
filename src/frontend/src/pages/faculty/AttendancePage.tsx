import {
  AlertTriangle,
  Camera,
  Clock,
  MapPin,
  PlusCircle,
  Trash2,
  Wifi,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AttendanceRecord, Student } from "../../backend";
import Topbar from "../../components/layout/Topbar";
import {
  useAddManualAttendance,
  useAllAttendance,
  useAllStudents,
  useDeleteAttendance,
  useFlagFaceMismatch,
} from "../../hooks/useQueries";

function formatNanoTs(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function tsToDateStr(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

// Safe helper — handles both legacy string and Motoko [] | [string] array form
function safePhotoUrl(val: unknown): string | null {
  if (typeof val === "string") return val || null;
  if (Array.isArray(val)) return val.length > 0 ? (val as string[])[0] : null;
  return null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// ─── Comparison Modal ────────────────────────────────────────────────────────
function ComparisonModal({
  record,
  student,
  onClose,
  onFlagToggle,
}: {
  record: AttendanceRecord;
  student: Student | null;
  onClose: () => void;
  onFlagToggle: (recordId: string, newFlagged: boolean) => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const flagMutation = useFlagFaceMismatch();

  // Reference photo comes from the pre-fetched student map — no extra query
  // safePhotoUrl handles both string and [] | [string] Motoko optional forms
  const referenceUrl = safePhotoUrl(student?.reference_photo_url ?? null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleToggleMismatch() {
    const newFlagged = !record.face_mismatch;
    try {
      await flagMutation.mutateAsync({
        record_id: BigInt(record.id),
        flagged: newFlagged,
      });
      // Propagate to parent so allRecords + lightboxRecord update immediately
      onFlagToggle(record.id, newFlagged);
      toast.success(
        record.face_mismatch
          ? "Mismatch flag removed"
          : "Record flagged as mismatch",
      );
    } catch {
      toast.error("Failed to update flag");
    }
  }

  const panelStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border-color)",
    borderRadius: 12,
    overflow: "hidden" as const,
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)" }}
      role="presentation"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        data-ocid="attendance.comparison.dialog"
        className="relative rounded-2xl shadow-2xl w-full"
        style={{
          background: "var(--surface)",
          maxWidth: 760,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div>
            <h3
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              Identity Verification — {record.student_name}
            </h3>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              PRN: {record.prn}
            </p>
          </div>
          <button
            type="button"
            data-ocid="attendance.comparison.close_button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
            }}
            aria-label="Close comparison"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side photos */}
        <div className="p-5 grid grid-cols-2 gap-4">
          {/* Left — Reference Photo */}
          <div style={panelStyle}>
            <div
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                background: "var(--surface)",
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              Reference Photo
            </div>
            {referenceUrl ? (
              <img
                src={referenceUrl}
                alt={`Reference for ${record.student_name}`}
                className="w-full object-cover"
                style={{ height: 240 }}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2"
                style={{
                  height: 240,
                  color: "var(--text-secondary)",
                }}
              >
                <Camera className="w-8 h-8 opacity-30" />
                <p className="text-xs text-center px-4 opacity-60">
                  No reference photo registered
                </p>
              </div>
            )}
          </div>

          {/* Right — Check-In Photo */}
          <div style={panelStyle}>
            <div
              className="px-3 py-2 text-xs font-semibold uppercase tracking-wide"
              style={{
                background: "var(--surface)",
                color: "var(--text-secondary)",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              Check-In Photo
            </div>
            {record.image_url ? (
              <img
                src={record.image_url}
                alt={`Check-in selfie of ${record.student_name}`}
                className="w-full object-cover"
                style={{ height: 240 }}
              />
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2"
                style={{
                  height: 240,
                  color: "var(--text-secondary)",
                }}
              >
                <Camera className="w-8 h-8 opacity-30" />
                <p className="text-xs opacity-60">No photo captured</p>
              </div>
            )}
            <div
              className="px-3 py-2 text-xs"
              style={{
                color: "var(--text-secondary)",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {formatNanoTs(record.timestamp)}
            </div>
          </div>
        </div>

        {/* Footer — Flag toggle */}
        <div className="px-5 pb-5 flex items-center justify-between">
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Manually review and flag if faces do not match.
          </p>
          <button
            type="button"
            data-ocid="attendance.comparison.flag_toggle"
            onClick={handleToggleMismatch}
            disabled={flagMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: record.face_mismatch ? "#F97316" : "#F974161A",
              color: record.face_mismatch ? "#fff" : "#F97316",
              border: record.face_mismatch ? "none" : "1px solid #F9731640",
              opacity: flagMutation.isPending ? 0.65 : 1,
              cursor: flagMutation.isPending ? "wait" : "pointer",
              transition: "opacity 0.15s",
            }}
          >
            <AlertTriangle className="w-4 h-4" />
            {flagMutation.isPending
              ? "Updating…"
              : record.face_mismatch
                ? "Unflag Mismatch"
                : "Flag as Mismatch"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline Delete Confirmation ──────────────────────────────────────────────
function DeleteConfirm({
  onConfirm,
  onCancel,
  isPending,
}: { onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Delete?
      </span>
      <button
        type="button"
        data-ocid="attendance.delete.confirm_button"
        disabled={isPending}
        onClick={onConfirm}
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{ background: "var(--danger-bg)", color: "var(--danger)" }}
      >
        {isPending ? "…" : "Yes"}
      </button>
      <button
        type="button"
        data-ocid="attendance.delete.cancel_button"
        onClick={onCancel}
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          background: "var(--surface-2)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        No
      </button>
    </span>
  );
}

// ─── Manual Add Panel ────────────────────────────────────────────────────────
function ManualAddPanel({ onClose }: { onClose: () => void }) {
  const { data: students = [] } = useAllStudents();
  const addMutation = useAddManualAttendance();
  const [prn, setPrn] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<{ prn?: string; subject?: string }>({});

  const validate = () => {
    const e: { prn?: string; subject?: string } = {};
    if (!prn) e.prn = "Please select a student";
    if (!subject.trim()) e.subject = "Subject is required";
    return e;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    // Build timestamp from date + time
    const dt = new Date(`${date}T${time}:00`);
    const tsNs = BigInt(dt.getTime()) * BigInt(1_000_000);

    const result = await addMutation.mutateAsync({
      prn: prn,
      subject: subject.trim(),
      timestamp_override: tsNs,
      notes: notes.trim(),
    });

    if (result.__kind__ === "ok" || result.__kind__ === "alreadyMarked") {
      toast.success(
        result.__kind__ === "ok"
          ? "Attendance added"
          : "Attendance already recorded for this student",
      );
      onClose();
    } else {
      toast.error("Failed to add attendance");
    }
  }

  const inputStyle = {
    background: "var(--surface-2)",
    border: "1px solid var(--border-color)",
    color: "var(--text-primary)",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };
  const labelStyle = {
    color: "var(--text-secondary)",
    fontSize: 12,
    fontWeight: 500,
    display: "block" as const,
    marginBottom: 4,
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="presentation"
      onClick={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl"
        style={{
          background: "var(--surface)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--border-color)" }}
        >
          <h3
            className="font-semibold text-base"
            style={{ color: "var(--text-primary)" }}
          >
            Add Manual Entry
          </h3>
          <button
            type="button"
            data-ocid="attendance.manual_add.close_button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
            }}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Student */}
          <div>
            <label htmlFor="manual-student" style={labelStyle}>
              Student *
            </label>
            <select
              id="manual-student"
              data-ocid="attendance.manual_add.select"
              value={prn}
              onChange={(e) => {
                setPrn(e.target.value);
                setErrors((p) => ({ ...p, prn: undefined }));
              }}
              style={inputStyle}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.prn} value={s.prn}>
                  {s.name} ({s.prn})
                </option>
              ))}
            </select>
            {errors.prn && (
              <p
                data-ocid="attendance.manual_add.prn.field_error"
                className="text-xs mt-1"
                style={{ color: "var(--danger)" }}
              >
                {errors.prn}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="manual-subject" style={labelStyle}>
              Subject *
            </label>
            <input
              id="manual-subject"
              data-ocid="attendance.manual_add.subject.input"
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setErrors((p) => ({ ...p, subject: undefined }));
              }}
              placeholder="e.g. Digital Signal Processing"
              style={inputStyle}
            />
            {errors.subject && (
              <p
                data-ocid="attendance.manual_add.subject.field_error"
                className="text-xs mt-1"
                style={{ color: "var(--danger)" }}
              >
                {errors.subject}
              </p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="manual-date" style={labelStyle}>
                Date
              </label>
              <input
                id="manual-date"
                data-ocid="attendance.manual_add.date.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="manual-time" style={labelStyle}>
                Time
              </label>
              <input
                id="manual-time"
                data-ocid="attendance.manual_add.time.input"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="manual-notes" style={labelStyle}>
              Notes (optional)
            </label>
            <input
              id="manual-notes"
              data-ocid="attendance.manual_add.notes.input"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for manual entry…"
              style={inputStyle}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              data-ocid="attendance.manual_add.cancel_button"
              className="flex-1 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-ocid="attendance.manual_add.submit_button"
              disabled={addMutation.isPending}
              className="flex-1 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "var(--blue)",
                color: "#fff",
                opacity: addMutation.isPending ? 0.7 : 1,
              }}
            >
              {addMutation.isPending ? "Adding…" : "Add Attendance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [lightboxRecord, setLightboxRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const deleteMutation = useDeleteAttendance();

  // Single batch fetch — no per-record queries
  const { data: allRecords = [], isLoading: loading } = useAllAttendance();
  const { data: allStudents = [] } = useAllStudents();

  // Build a PRN → Student lookup map (O(1) access per row)
  const studentMap = new Map<string, Student>(
    allStudents.map((s) => [s.prn, s]),
  );

  // Optimistic update after flag mutation succeeds — update lightbox in-place
  // (React Query will sync the full list on its next background refetch)
  function handleFlagToggle(recordId: string, newFlagged: boolean) {
    setLightboxRecord((prev) =>
      prev && prev.id === recordId
        ? { ...prev, face_mismatch: newFlagged }
        : prev,
    );
  }

  const filtered = allRecords.filter((c) => {
    const matchDate = selectedDate
      ? tsToDateStr(c.timestamp) === selectedDate
      : true;
    const q = search.toLowerCase();
    const matchSearch =
      !q || c.student_name.toLowerCase().includes(q) || c.prn.includes(q);
    return matchDate && matchSearch;
  });

  async function handleDeleteConfirm(record: AttendanceRecord) {
    try {
      await deleteMutation.mutateAsync(BigInt(record.id));
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setConfirmDeleteId(null);
    }
  }

  const methodBadge = (method: string) => {
    const isManual = method?.toLowerCase() === "manual";
    return (
      <span
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium w-fit"
        style={{
          background: isManual ? "var(--warning-bg)" : "var(--info-bg)",
          color: isManual ? "var(--warning)" : "var(--blue)",
        }}
      >
        {isManual ? (
          <PlusCircle className="w-3 h-3" />
        ) : (
          <Wifi className="w-3 h-3" />
        )}
        {isManual ? "Manual" : "NFC"}
      </span>
    );
  };

  return (
    <div>
      <Topbar title="Attendance" subtitle="Real-time attendance monitoring" />
      <div className="p-6 space-y-6">
        {/* Filters + Add button */}
        <div
          className="rounded-2xl p-5 border flex flex-wrap gap-4 items-end"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div>
            <label
              htmlFor="att-search"
              className="text-xs font-medium block mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Search Student / PRN
            </label>
            <input
              id="att-search"
              data-ocid="attendance.search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name or PRN…"
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                minWidth: 180,
              }}
            />
          </div>
          <div>
            <label
              htmlFor="date-input"
              className="text-xs font-medium block mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Date
            </label>
            <input
              id="date-input"
              data-ocid="attendance.date.input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="px-3 py-2 rounded-xl text-xs"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
              }}
            >
              Clear date
            </button>
          )}
          <div className="flex items-center gap-3 ml-auto flex-wrap">
            <span className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#22C55E" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--success)" }}
              >
                Live Monitoring Active
              </span>
            </span>
            <button
              type="button"
              data-ocid="attendance.manual_add.open_modal_button"
              onClick={() => setShowManualAdd(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              <PlusCircle className="w-4 h-4" />
              Add Manual Entry
            </button>
          </div>
        </div>

        {/* Live check-ins table */}
        <div
          className="rounded-2xl border"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border-color)" }}
          >
            <h2
              className="font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Live Check-ins
              {!loading && (
                <span
                  className="ml-2 text-sm font-normal"
                  style={{ color: "var(--text-secondary)" }}
                >
                  — {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4, 5].map((k) => (
                <div
                  key={k}
                  className="h-12 rounded-xl animate-pulse"
                  style={{ background: "var(--surface-2)" }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="attendance.empty_state"
              className="text-center py-16"
              style={{ color: "var(--text-secondary)" }}
            >
              <Wifi className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-base font-medium">No check-ins yet</p>
              <p className="text-sm mt-1 opacity-60">
                {search || selectedDate
                  ? "No records match your filters."
                  : "Waiting for students to tap the NFC tag…"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--surface-2)" }}>
                    {[
                      "Photo",
                      "Student",
                      "PRN",
                      "Time",
                      "Location",
                      "Method",
                      "Status",
                      "Geo",
                      "",
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
                  {filtered.map((c, i) => (
                    <tr
                      key={c.id}
                      data-ocid={`attendance.item.${i + 1}`}
                      className="border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      {/* Photo */}
                      <td className="px-4 py-3">
                        {c.image_url ? (
                          <button
                            type="button"
                            data-ocid={`attendance.photo.${i + 1}`}
                            onClick={() => setLightboxRecord(c)}
                            className="relative group cursor-pointer"
                            aria-label={`View selfie for ${c.student_name}`}
                          >
                            <img
                              src={c.image_url}
                              alt={c.student_name}
                              className="w-10 h-10 rounded-full object-cover"
                              style={{
                                border: "2px solid var(--border-color)",
                              }}
                            />
                            <span
                              className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ background: "rgba(0,0,0,0.5)" }}
                            >
                              <ZoomIn className="w-4 h-4 text-white" />
                            </span>
                          </button>
                        ) : (
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{
                              background: "var(--surface-2)",
                              border: "1px dashed var(--border-color)",
                            }}
                            title="No photo"
                          >
                            <Camera
                              className="w-4 h-4"
                              style={{
                                color: "var(--text-secondary)",
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        )}
                      </td>
                      {/* Student — with reference photo thumbnail */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const refUrl = safePhotoUrl(
                              studentMap.get(c.prn)?.reference_photo_url ??
                                null,
                            );
                            return refUrl ? (
                              <img
                                src={refUrl}
                                alt={`Ref: ${c.student_name}`}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                style={{
                                  border: "2px solid var(--border-color)",
                                }}
                              />
                            ) : (
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                style={{
                                  background: "rgba(59,130,246,0.2)",
                                  color: "#3B82F6",
                                }}
                              >
                                {getInitials(c.student_name)}
                              </div>
                            );
                          })()}
                          <span style={{ color: "var(--text-primary)" }}>
                            {c.student_name}
                          </span>
                        </div>
                      </td>
                      {/* PRN */}
                      <td
                        className="px-4 py-3 font-mono text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {c.prn}
                      </td>
                      {/* Time */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {formatNanoTs(c.timestamp)}
                        </div>
                      </td>
                      {/* Location */}
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-1 text-xs"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          <MapPin className="w-3 h-3" />
                          {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                        </div>
                      </td>
                      {/* Method */}
                      <td className="px-4 py-3">{methodBadge(c.method)}</td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: "var(--success-bg)",
                            color: "var(--success)",
                          }}
                        >
                          Verified
                        </span>
                      </td>
                      {/* Geo Fail + Face Mismatch Badges */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {c.geo_fail && (
                            <span
                              data-ocid={`attendance.geo_fail_badge.${i + 1}`}
                              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide w-fit"
                              style={{
                                background: "#EF44441A",
                                color: "#EF4444",
                                border: "1px solid #EF444466",
                              }}
                            >
                              GEO_FAIL
                            </span>
                          )}
                          {c.face_mismatch && (
                            <span
                              data-ocid={`attendance.face_mismatch_badge.${i + 1}`}
                              className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide w-fit"
                              style={{
                                background: "#EF4444",
                                color: "#FFFFFF",
                                border: "1px solid #EF4444",
                              }}
                            >
                              FACE_MISMATCH
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Delete */}
                      <td className="px-4 py-3">
                        {confirmDeleteId === c.id ? (
                          <DeleteConfirm
                            onConfirm={() => handleDeleteConfirm(c)}
                            onCancel={() => setConfirmDeleteId(null)}
                            isPending={deleteMutation.isPending}
                          />
                        ) : (
                          <button
                            type="button"
                            data-ocid={`attendance.delete_button.${i + 1}`}
                            onClick={() => setConfirmDeleteId(c.id)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                            style={{
                              color: "var(--danger)",
                              background: "transparent",
                            }}
                            onMouseEnter={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "var(--danger-bg)";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLButtonElement
                              ).style.background = "transparent";
                            }}
                            aria-label="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Comparison modal — student looked up from cached map, no extra query */}
      {lightboxRecord && (
        <ComparisonModal
          record={lightboxRecord}
          student={studentMap.get(lightboxRecord.prn) ?? null}
          onClose={() => setLightboxRecord(null)}
          onFlagToggle={handleFlagToggle}
        />
      )}

      {/* Manual add panel */}
      {showManualAdd && (
        <ManualAddPanel onClose={() => setShowManualAdd(false)} />
      )}
    </div>
  );
}
