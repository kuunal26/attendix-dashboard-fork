import type { StudentWithSection, UpdateStudentRequest } from "@/backend";

type StudentRow = StudentWithSection & { reference_photo_url?: string };
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Topbar from "../../components/layout/Topbar";
import {
  useAddStudent,
  useDeleteStudent,
  useStudentSectionCounts,
  useStudentsBySection,
  useUpdateStudent,
  useUpdateStudentPhoto,
} from "../../hooks/useQueries";

type SectionKey = "first_year" | "second_year" | "third_year" | "btech";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "first_year", label: "First Year" },
  { key: "second_year", label: "Second Year" },
  { key: "third_year", label: "Third Year" },
  { key: "btech", label: "B.Tech" },
];

const SECTION_GRADIENTS: Record<SectionKey, string> = {
  first_year: "linear-gradient(135deg, #3B82F6, #06B6D4)",
  second_year: "linear-gradient(135deg, #8B5CF6, #EC4899)",
  third_year: "linear-gradient(135deg, #F59E0B, #EF4444)",
  btech: "linear-gradient(135deg, #10B981, #3B82F6)",
};

type SortField = "name" | "prn";
type SortDir = "asc" | "desc";

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase();
}

function sectionKeyFromLabel(label: string): SectionKey {
  switch (label) {
    case "First Year":
      return "first_year";
    case "Second Year":
      return "second_year";
    case "Third Year":
      return "third_year";
    default:
      return "btech";
  }
}

const safePhotoUrl = (val: unknown): string | undefined => {
  if (typeof val === "string") return val || undefined;
  if (Array.isArray(val))
    return (val as string[]).length > 0 ? (val as string[])[0] : undefined;
  return undefined;
};

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState<SectionKey>("btech");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Reset search + sort when tab changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeTab change is the intended trigger; setters are stable
  useEffect(() => {
    setQuery("");
    setSortField("name");
    setSortDir("asc");
  }, [activeTab]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] =
    useState<StudentWithSection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentWithSection | null>(
    null,
  );
  const [faceModalStudent, setFaceModalStudent] = useState<StudentRow | null>(
    null,
  );

  const { data: counts, isLoading: countsLoading } = useStudentSectionCounts();
  const { data: rawStudents = [], isLoading: studentsLoading } =
    useStudentsBySection(activeTab);
  // Normalise reference_photo_url: backend may send [] | [string] (Motoko ?Text)
  const students: StudentRow[] = rawStudents.map((s) => ({
    ...s,
    reference_photo_url: safePhotoUrl(s.reference_photo_url),
  }));

  const _addStudent = useAddStudent();
  const _updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const countMap: Record<SectionKey, number> = {
    first_year: Number(counts?.first_year ?? 0),
    second_year: Number(counts?.second_year ?? 0),
    third_year: Number(counts?.third_year ?? 0),
    btech: Number(counts?.btech ?? 0),
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = students;
    if (q) {
      list = students.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.prn.toLowerCase().includes(q),
      );
    }
    const v = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (sortField === "name") return a.name.localeCompare(b.name) * v;
      return a.prn.localeCompare(b.prn, undefined, { numeric: true }) * v;
    });
    return list;
  }, [students, query, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleAddClick = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (student: StudentWithSection) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (student: StudentWithSection) => {
    setDeleteTarget(student);
  };

  const handleRegisterFace = (student: StudentRow) => {
    setFaceModalStudent(student);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteStudent.mutateAsync(deleteTarget.id);
      toast.success("Student deleted successfully");
    } catch (_e) {
      toast.error("Failed to delete student");
    } finally {
      setDeleteTarget(null);
    }
  };

  const isLoading = countsLoading || studentsLoading;

  return (
    <div>
      <Topbar
        title="Students"
        subtitle="Manage and view all enrolled students"
      />
      <div className="p-6 space-y-6">
        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as SectionKey);
            setQuery("");
          }}
          className="w-full"
        >
          <TabsList
            className="w-full justify-start gap-2 rounded-xl p-1.5"
            style={{ background: "var(--surface)" }}
          >
            {SECTIONS.map((sec) => (
              <TabsTrigger
                key={sec.key}
                value={sec.key}
                data-ocid={`students.tab.${sec.key}`}
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all data-[state=active]:text-white"
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                <span>{sec.label}</span>
                <Badge
                  variant="secondary"
                  className="text-xs px-1.5 py-0 h-5"
                  style={{
                    background:
                      activeTab === sec.key
                        ? "rgba(255,255,255,0.2)"
                        : "var(--surface-2)",
                    color:
                      activeTab === sec.key ? "#fff" : "var(--text-secondary)",
                  }}
                >
                  {countsLoading ? "…" : countMap[sec.key]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Toolbar */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border p-5"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div>
            <h2
              className="font-semibold text-base"
              style={{ color: "var(--text-primary)" }}
            >
              {SECTIONS.find((s) => s.key === activeTab)?.label} Students
              <span
                className="ml-2 text-sm font-normal"
                style={{ color: "var(--text-secondary)" }}
              >
                {isLoading
                  ? ""
                  : query
                    ? `(${filtered.length} of ${students.length})`
                    : `(${students.length})`}
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 sm:flex-none"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
              }}
            >
              <Search
                className="w-4 h-4 flex-shrink-0"
                style={{ color: "var(--text-secondary)" }}
              />
              <input
                data-ocid="students.search_input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or PRN..."
                className="bg-transparent text-sm outline-none w-full sm:w-56"
                style={{ color: "var(--text-primary)" }}
              />
            </div>
            <Button
              data-ocid="students.add_button"
              onClick={handleAddClick}
              className="gap-2"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Button>
          </div>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {[
                    { label: "Sr No", field: null },
                    { label: "Name", field: "name" as SortField },
                    { label: "Full PRN", field: "prn" as SortField },
                    { label: "Status", field: null },
                    { label: "Photo", field: null },
                    { label: "Actions", field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold cursor-pointer select-none whitespace-nowrap"
                      style={{ color: "var(--text-secondary)" }}
                      onClick={() => field && toggleSort(field)}
                      onKeyUp={(e) =>
                        e.key === "Enter" && field && toggleSort(field)
                      }
                      tabIndex={field ? 0 : undefined}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {field &&
                          sortField === field &&
                          (sortDir === "asc" ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ))}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
                      key={`skeleton-${i}`}
                      className="border-t"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9 rounded-full" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <Skeleton className="w-8 h-8 rounded-lg" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div
                        className="flex flex-col items-center gap-2"
                        data-ocid="students.empty_state"
                      >
                        <Users
                          className="w-10 h-10 opacity-30"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {query
                            ? "No students match your search."
                            : "No students in this section yet."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <tr
                      key={s.id}
                      data-ocid={`students.item.${i + 1}`}
                      className="border-t hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <td
                        className="px-4 py-3 text-xs font-mono"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{
                              background: SECTION_GRADIENTS[activeTab],
                            }}
                          >
                            {getInitials(s.name)}
                          </div>
                          <p
                            className="font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {s.name}
                          </p>
                        </div>
                      </td>
                      <td
                        className="px-4 py-3 font-mono text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {s.prn}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={s.isActive ? "default" : "secondary"}
                          className="text-xs"
                          style={{
                            background: s.isActive
                              ? "var(--success-bg)"
                              : "var(--danger-bg)",
                            color: s.isActive
                              ? "var(--success)"
                              : "var(--danger)",
                            border: "none",
                          }}
                        >
                          {s.isActive ? "Active" : "Ex-Student"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {(() => {
                          const photoUrl = safePhotoUrl(s.reference_photo_url);
                          return photoUrl ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={photoUrl}
                                alt={`${s.name} reference`}
                                className="w-8 h-8 rounded-full object-cover border"
                                style={{ borderColor: "var(--border-color)" }}
                                data-ocid={`students.photo_thumb.${i + 1}`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <span
                                data-ocid={`students.photo_badge.${i + 1}`}
                                className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{
                                  background: "var(--success-bg)",
                                  color: "var(--success)",
                                }}
                              >
                                <Camera className="w-3 h-3" />
                                Photo
                              </span>
                            </div>
                          ) : (
                            <span
                              data-ocid={`students.photo_badge.${i + 1}`}
                              className="inline-flex items-center text-xs px-2 py-0.5 rounded-full"
                              style={{
                                border: "1.5px dashed var(--border-color)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              None
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-ocid={`students.register_face_button.${i + 1}`}
                            onClick={() => handleRegisterFace(s)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--blue)",
                            }}
                            aria-label="Register face photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            data-ocid={`students.edit_button.${i + 1}`}
                            onClick={() => handleEditClick(s)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              background: "var(--surface-2)",
                              color: "var(--text-secondary)",
                            }}
                            aria-label="Edit student"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            data-ocid={`students.delete_button.${i + 1}`}
                            onClick={() => handleDeleteClick(s)}
                            className="p-2 rounded-lg transition-colors"
                            style={{
                              background: "var(--danger-bg)",
                              color: "var(--danger)",
                            }}
                            aria-label="Delete student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Register Face Modal */}
      <RegisterFaceModal
        student={faceModalStudent}
        onClose={() => setFaceModalStudent(null)}
      />

      {/* Add/Edit Dialog */}
      <StudentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingStudent={editingStudent}
        activeSection={activeTab}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingStudent(null);
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-color)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
              Delete Student
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-secondary)" }}>
              Are you sure you want to delete{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                {deleteTarget?.name}
              </strong>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="students.cancel_button"
              className="border"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="students.confirm_button"
              onClick={confirmDelete}
              className="text-white"
              style={{ background: "var(--danger)" }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Register Face Modal ─── */

interface RegisterFaceModalProps {
  student: StudentRow | null;
  onClose: () => void;
}

type CameraState =
  | "idle"
  | "starting"
  | "live"
  | "captured"
  | "saving"
  | "error";

function RegisterFaceModal({ student, onClose }: RegisterFaceModalProps) {
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updatePhoto = useUpdateStudentPhoto();

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraState("starting");
    setErrorMsg("");
    setCapturedDataUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("live");
    } catch (err) {
      stopStream();
      const e = err as Error;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setErrorMsg(
          "Camera permission denied. Please allow camera access in your browser settings and try again.",
        );
      } else if (e.name === "NotFoundError") {
        setErrorMsg("No camera found on this device.");
      } else {
        setErrorMsg(`Camera error: ${e.message || e.name}`);
      }
      setCameraState("error");
    }
  }, [stopStream]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
    setCapturedDataUrl(dataUrl);
    stopStream();
    setCameraState("captured");
  }, [stopStream]);

  const handleRetake = useCallback(() => {
    setCapturedDataUrl(null);
    startCamera();
  }, [startCamera]);

  const handleSave = useCallback(async () => {
    if (!capturedDataUrl || !student) return;
    setCameraState("saving");
    try {
      await updatePhoto.mutateAsync({ prn: student.prn, url: capturedDataUrl });
      toast.success(`Reference photo saved for ${student.name}`);
      onClose();
    } catch (_err) {
      toast.error("Failed to save photo. Please try again.");
      setCameraState("captured");
    }
  }, [capturedDataUrl, student, updatePhoto, onClose]);

  const handleClose = useCallback(() => {
    stopStream();
    setCameraState("idle");
    setCapturedDataUrl(null);
    setErrorMsg("");
    onClose();
  }, [stopStream, onClose]);

  // Start camera when modal opens
  useEffect(() => {
    if (student) {
      startCamera();
    } else {
      stopStream();
      setCameraState("idle");
      setCapturedDataUrl(null);
      setErrorMsg("");
    }
    return () => {
      stopStream();
    };
  }, [student, startCamera, stopStream]);

  const isOpen = !!student;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-lg p-0 overflow-hidden"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-color)",
        }}
        data-ocid="students.register_face.dialog"
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle
                className="flex items-center gap-2"
                style={{ color: "var(--text-primary)" }}
              >
                <Camera className="w-5 h-5" style={{ color: "var(--blue)" }} />
                Register Face Photo
              </DialogTitle>
              <DialogDescription
                className="mt-1 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                {student?.name} &middot;{" "}
                <span className="font-mono text-xs">{student?.prn}</span>
              </DialogDescription>
            </div>
            <button
              type="button"
              data-ocid="students.register_face.close_button"
              onClick={handleClose}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: "var(--text-secondary)",
                background: "var(--surface-2)",
              }}
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Camera / Preview area */}
        <div
          className="mx-6 mb-4 rounded-xl overflow-hidden relative"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-color)",
            minHeight: 300,
          }}
        >
          {/* Live video */}
          <video
            ref={videoRef}
            className="w-full object-cover"
            style={{
              display: cameraState === "live" ? "block" : "none",
              maxHeight: 360,
            }}
            playsInline
            muted
            aria-label="Camera preview"
          />

          {/* Captured preview */}
          {cameraState === "captured" || cameraState === "saving"
            ? capturedDataUrl && (
                <img
                  src={capturedDataUrl}
                  alt="Captured preview"
                  className="w-full object-cover"
                  style={{ maxHeight: 360 }}
                />
              )
            : null}

          {/* Starting / idle overlay */}
          {(cameraState === "starting" || cameraState === "idle") && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ color: "var(--text-secondary)" }}
              data-ocid="students.register_face.loading_state"
            >
              <Camera className="w-10 h-10 opacity-30" />
              <p className="text-sm">
                {cameraState === "starting"
                  ? "Starting camera…"
                  : "Initialising…"}
              </p>
            </div>
          )}

          {/* Error overlay */}
          {cameraState === "error" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center"
              data-ocid="students.register_face.error_state"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "var(--danger-bg)" }}
              >
                <Camera
                  className="w-6 h-6"
                  style={{ color: "var(--danger)" }}
                />
              </div>
              <p className="text-sm" style={{ color: "var(--danger)" }}>
                {errorMsg}
              </p>
              <button
                type="button"
                data-ocid="students.register_face.retry_button"
                onClick={startCamera}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--blue)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* Saving overlay */}
          {cameraState === "saving" && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.45)" }}
              data-ocid="students.register_face.saving_state"
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                  style={{ borderColor: "var(--blue)" }}
                />
                <p className="text-sm font-medium text-white">Saving…</p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 pb-5 gap-3">
          <button
            type="button"
            data-ocid="students.register_face.cancel_button"
            onClick={handleClose}
            disabled={cameraState === "saving"}
            className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors border"
            style={{
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              borderColor: "var(--border-color)",
            }}
          >
            Cancel
          </button>

          {cameraState === "live" && (
            <button
              type="button"
              data-ocid="students.register_face.capture_button"
              onClick={handleCapture}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-white transition-colors"
              style={{ background: "var(--blue)" }}
            >
              <Camera className="w-4 h-4" />
              Capture
            </button>
          )}

          {cameraState === "captured" && (
            <>
              <button
                type="button"
                data-ocid="students.register_face.retake_button"
                onClick={handleRetake}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors border"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-color)",
                }}
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                data-ocid="students.register_face.save_button"
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-white transition-colors"
                style={{ background: "var(--blue)" }}
              >
                Save Photo
              </button>
            </>
          )}

          {cameraState === "error" && (
            <button
              type="button"
              data-ocid="students.register_face.retry_button"
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-colors"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              <RefreshCw className="w-4 h-4" />
              Retry Camera
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Student Form Dialog ─── */

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editingStudent: StudentWithSection | null;
  activeSection: SectionKey;
  onSuccess: () => void;
}

function StudentFormDialog({
  open,
  onOpenChange,
  editingStudent,
  activeSection,
  onSuccess,
}: StudentFormDialogProps) {
  const [name, setName] = useState("");
  const [prn, setPrn] = useState("");
  const [section, setSection] = useState<SectionKey>(activeSection);
  const [rollNo, setRollNo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addStudent = useAddStudent();
  const updateStudent = useUpdateStudent();

  // Reset form when dialog opens
  const resetForm = useCallback(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setPrn(editingStudent.prn);
      setSection(sectionKeyFromLabel(editingStudent.section));
      setRollNo(String(editingStudent.rollNo));
    } else {
      setName("");
      setPrn("");
      setSection(activeSection);
      setRollNo("");
    }
    setErrors({});
  }, [editingStudent, activeSection]);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Full name is required";
    if (!prn.trim()) errs.prn = "PRN is required";
    if (!rollNo.trim()) errs.rollNo = "Roll number is required";
    else if (!/^\d+$/.test(rollNo)) errs.rollNo = "Roll number must be numeric";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editingStudent) {
        const upd: UpdateStudentRequest = {
          name: name.trim(),
          prn: prn.trim(),
          section,
          rollNo: BigInt(rollNo),
          isActive: true,
        };
        await updateStudent.mutateAsync({ id: editingStudent.id, upd });
        toast.success("Student updated successfully");
      } else {
        await addStudent.mutateAsync({
          name: name.trim(),
          prn: prn.trim(),
          section,
          rollNo: BigInt(rollNo),
          isActive: true,
        });
        toast.success("Student added successfully");
      }
      onSuccess();
    } catch (_err) {
      toast.error(
        editingStudent ? "Failed to update student" : "Failed to add student",
      );
    }
  };

  const isSubmitting = addStudent.isPending || updateStudent.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border-color)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            {editingStudent ? "Edit Student" : "Add Student"}
          </DialogTitle>
          <DialogDescription style={{ color: "var(--text-secondary)" }}>
            {editingStudent
              ? "Update the student details below."
              : "Fill in the details to add a new student."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="student-name"
              style={{ color: "var(--text-primary)" }}
            >
              Full Name
            </Label>
            <Input
              id="student-name"
              data-ocid="students.form.name_input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="border"
              style={{
                background: "var(--surface-2)",
                borderColor: errors.name
                  ? "var(--danger)"
                  : "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
            {errors.name && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="student-prn"
              style={{ color: "var(--text-primary)" }}
            >
              Full PRN
            </Label>
            <Input
              id="student-prn"
              data-ocid="students.form.prn_input"
              value={prn}
              onChange={(e) => setPrn(e.target.value)}
              placeholder="e.g. 2024BTECS00001"
              className="border"
              style={{
                background: "var(--surface-2)",
                borderColor: errors.prn
                  ? "var(--danger)"
                  : "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
            {errors.prn && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.prn}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="student-section"
              style={{ color: "var(--text-primary)" }}
            >
              Section
            </Label>
            <Select
              value={section}
              onValueChange={(v) => setSection(v as SectionKey)}
            >
              <SelectTrigger
                id="student-section"
                data-ocid="students.form.section_select"
                className="border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <SelectValue placeholder="Select section" />
              </SelectTrigger>
              <SelectContent
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-color)",
                }}
              >
                {SECTIONS.map((sec) => (
                  <SelectItem
                    key={sec.key}
                    value={sec.key}
                    className="text-sm"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {sec.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="student-roll"
              style={{ color: "var(--text-primary)" }}
            >
              Roll Number
            </Label>
            <Input
              id="student-roll"
              data-ocid="students.form.roll_input"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="e.g. 42"
              className="border"
              style={{
                background: "var(--surface-2)",
                borderColor: errors.rollNo
                  ? "var(--danger)"
                  : "var(--border-color)",
                color: "var(--text-primary)",
              }}
            />
            {errors.rollNo && (
              <p className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.rollNo}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="students.form.cancel_button"
              onClick={() => onOpenChange(false)}
              className="border"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="students.form.submit_button"
              disabled={isSubmitting}
              className="text-white"
              style={{ background: "var(--blue)" }}
            >
              {isSubmitting
                ? "Saving..."
                : editingStudent
                  ? "Update Student"
                  : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
