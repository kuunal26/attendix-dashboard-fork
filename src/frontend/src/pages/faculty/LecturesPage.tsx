import type { WeeklySlot } from "@/backend";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Topbar from "../../components/layout/Topbar";
import {
  useSemesterTemplate,
  useUpdateSemesterTemplate,
} from "../../hooks/useQueries";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const SEMESTERS = [1, 2, 3, 4, 5, 6];

interface SlotForm {
  id: string;
  subject: string;
  startTime: string;
  endTime: string;
  room: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function slotsToForm(slots: WeeklySlot[]): SlotForm[] {
  return slots.map((s) => ({
    id: generateId(),
    subject: s.subject,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
  }));
}

function formToSlots(day: string, forms: SlotForm[]): WeeklySlot[] {
  return forms
    .filter(
      (f) => f.subject.trim() || f.startTime || f.endTime || f.room.trim(),
    )
    .map((f) => ({
      day,
      subject: f.subject.trim() || "Untitled",
      startTime: f.startTime || "09:00",
      endTime: f.endTime || "10:00",
      room: f.room.trim() || "TBD",
    }));
}

function sortByTime(a: SlotForm, b: SlotForm) {
  return a.startTime.localeCompare(b.startTime);
}

export default function LecturesPage() {
  const [activeSemester, setActiveSemester] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editSlots, setEditSlots] = useState<Record<string, SlotForm[]>>({});

  const {
    data: templateSlots = [],
    isLoading,
    isError,
  } = useSemesterTemplate(activeSemester);

  const updateMutation = useUpdateSemesterTemplate();

  const grouped = useCallback(() => {
    const map: Record<string, WeeklySlot[]> = {};
    for (const day of DAYS) map[day] = [];
    for (const slot of templateSlots) {
      const d = slot.day;
      if (map[d]) map[d].push(slot);
    }
    for (const day of DAYS) {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [templateSlots]);

  useEffect(() => {
    if (!isEditing) {
      const map = grouped();
      const init: Record<string, SlotForm[]> = {};
      for (const day of DAYS) {
        init[day] = slotsToForm(map[day]);
      }
      setEditSlots(init);
    }
  }, [isEditing, grouped]);

  const handleAddSlot = (day: string) => {
    setEditSlots((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] || []),
        { id: generateId(), subject: "", startTime: "", endTime: "", room: "" },
      ],
    }));
  };

  const handleRemoveSlot = (day: string, id: string) => {
    setEditSlots((prev) => ({
      ...prev,
      [day]: (prev[day] || []).filter((s) => s.id !== id),
    }));
  };

  const handleSlotChange = (
    day: string,
    id: string,
    field: keyof SlotForm,
    value: string,
  ) => {
    setEditSlots((prev) => ({
      ...prev,
      [day]: (prev[day] || []).map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const handleSave = async () => {
    const allSlots: WeeklySlot[] = [];
    for (const day of DAYS) {
      const dayForms = (editSlots[day] || []).filter(
        (f) => f.subject.trim() || f.startTime || f.endTime || f.room.trim(),
      );
      if (dayForms.length === 0) continue;
      allSlots.push(...formToSlots(day, dayForms));
    }

    try {
      const result = await updateMutation.mutateAsync({
        semester: activeSemester,
        slots: allSlots,
      });
      if (result.__kind__ === "ok") {
        toast.success(`Semester ${activeSemester} template saved successfully`);
        setIsEditing(false);
      } else {
        toast.error(result.err || "Failed to save template");
      }
    } catch {
      toast.error("Network error while saving template");
    }
  };

  const handleCancel = () => {
    const map = grouped();
    const init: Record<string, SlotForm[]> = {};
    for (const day of DAYS) {
      init[day] = slotsToForm(map[day]);
    }
    setEditSlots(init);
    setIsEditing(false);
  };

  const handleTabChange = (sem: number) => {
    setActiveSemester(sem);
    setIsEditing(false);
  };

  const readModeMap = grouped();

  return (
    <div className="min-h-full">
      <Topbar
        title="Timetable"
        subtitle="Weekly lecture templates per semester"
      />

      <div className="p-6 space-y-6">
        {/* Semester Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {SEMESTERS.map((sem) => (
            <button
              key={sem}
              type="button"
              data-ocid={`lectures.semester.tab.${sem}`}
              onClick={() => handleTabChange(sem)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                activeSemester === sem
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              Sem {sem}
            </button>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Semester {activeSemester} — Weekly Template
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {isEditing
                ? "Edit lecture slots for each day"
                : "View the current weekly schedule"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  data-ocid="lectures.cancel_button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-muted"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-color)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="lectures.save_button"
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground transition-all duration-200 hover:opacity-90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Template
                </button>
              </>
            ) : (
              <button
                type="button"
                data-ocid="lectures.edit_button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 hover:bg-muted"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)",
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit Template
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div
            className="flex items-center justify-center py-20 rounded-2xl border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
            data-ocid="lectures.loading_state"
          >
            <Loader2
              className="w-8 h-8 animate-spin"
              style={{ color: "var(--blue)" }}
            />
            <span
              className="ml-3 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              Loading timetable...
            </span>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded-2xl border gap-3"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
            data-ocid="lectures.error_state"
          >
            <p className="text-sm" style={{ color: "var(--danger)" }}>
              Failed to load timetable. Please try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {DAYS.map((day) => {
              const daySlots = isEditing
                ? (editSlots[day] || []).sort(sortByTime)
                : readModeMap[day];

              const hasSlots = daySlots.length > 0;

              return (
                <div
                  key={day}
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border-color)",
                  }}
                  data-ocid={`lectures.day.${day.toLowerCase()}`}
                >
                  {/* Day Header */}
                  <div
                    className="flex items-center justify-between px-5 py-3 border-b"
                    style={{
                      background: "var(--surface-2)",
                      borderColor: "var(--border-color)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays
                        className="w-4 h-4"
                        style={{ color: "var(--blue)" }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {day}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--info-bg)",
                          color: "var(--blue)",
                        }}
                      >
                        {daySlots.length} slot{daySlots.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        type="button"
                        data-ocid={`lectures.add_slot_button.${day.toLowerCase()}`}
                        onClick={() => handleAddSlot(day)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
                        style={{
                          background: "var(--info-bg)",
                          color: "var(--blue)",
                        }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Slot
                      </button>
                    )}
                  </div>

                  {/* Slots */}
                  <div className="p-4">
                    {!hasSlots ? (
                      <div
                        className="flex flex-col items-center justify-center py-8 rounded-xl border border-dashed gap-2"
                        style={{
                          background: "var(--surface-2)",
                          borderColor: "var(--border-color)",
                        }}
                        data-ocid={`lectures.empty_state.${day.toLowerCase()}`}
                      >
                        <BookOpen
                          className="w-6 h-6"
                          style={{ color: "var(--text-secondary)" }}
                        />
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          No lectures scheduled
                        </p>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => handleAddSlot(day)}
                            className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:opacity-90"
                            style={{
                              background: "var(--info-bg)",
                              color: "var(--blue)",
                            }}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add First Slot
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {daySlots.map((slot, idx) =>
                          isEditing && "id" in slot ? (
                            <EditSlotRow
                              key={(slot as SlotForm).id}
                              slot={slot as SlotForm}
                              index={idx}
                              onChange={(field, value) =>
                                handleSlotChange(
                                  day,
                                  (slot as SlotForm).id,
                                  field,
                                  value,
                                )
                              }
                              onRemove={() =>
                                handleRemoveSlot(day, (slot as SlotForm).id)
                              }
                            />
                          ) : (
                            <ReadSlotRow
                              key={`${day}-slot-${(slot as WeeklySlot).startTime}-${(slot as WeeklySlot).subject}`}
                              slot={slot as WeeklySlot}
                              index={idx}
                            />
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Read Mode Slot Row ─── */
function ReadSlotRow({ slot, index }: { slot: WeeklySlot; index: number }) {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl border"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border-color)",
      }}
      data-ocid={`lectures.slot.item.${index + 1}`}
    >
      <div
        className="flex items-center gap-1.5 text-sm min-w-[110px]"
        style={{ color: "var(--text-secondary)" }}
      >
        <Clock className="w-4 h-4" style={{ color: "var(--blue)" }} />
        <span>
          {slot.startTime} – {slot.endTime}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {slot.subject}
        </p>
      </div>
      <div
        className="flex items-center gap-1.5 text-sm"
        style={{ color: "var(--text-secondary)" }}
      >
        <MapPin className="w-4 h-4" style={{ color: "var(--purple)" }} />
        <span>{slot.room}</span>
      </div>
    </div>
  );
}

/* ─── Edit Mode Slot Row ─── */
function EditSlotRow({
  slot,
  index,
  onChange,
  onRemove,
}: {
  slot: SlotForm;
  index: number;
  onChange: (field: keyof SlotForm, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border"
      style={{
        background: "var(--surface-2)",
        borderColor: "var(--border-color)",
      }}
      data-ocid={`lectures.edit_slot.item.${index + 1}`}
    >
      <div className="flex items-center gap-2 min-w-[200px]">
        <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--blue)" }} />
        <input
          type="time"
          value={slot.startTime}
          onChange={(e) => onChange("startTime", e.target.value)}
          className="w-[90px] px-2 py-1.5 rounded-lg text-sm border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: "var(--border-color)" }}
          data-ocid={`lectures.slot.start_time.${index + 1}`}
        />
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          –
        </span>
        <input
          type="time"
          value={slot.endTime}
          onChange={(e) => onChange("endTime", e.target.value)}
          className="w-[90px] px-2 py-1.5 rounded-lg text-sm border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: "var(--border-color)" }}
          data-ocid={`lectures.slot.end_time.${index + 1}`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Subject name"
          value={slot.subject}
          onChange={(e) => onChange("subject", e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-sm border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: "var(--border-color)" }}
          data-ocid={`lectures.slot.subject.${index + 1}`}
        />
      </div>

      <div className="flex items-center gap-2 min-w-[140px]">
        <MapPin
          className="w-4 h-4 shrink-0"
          style={{ color: "var(--purple)" }}
        />
        <input
          type="text"
          placeholder="Room"
          value={slot.room}
          onChange={(e) => onChange("room", e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-sm border bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ borderColor: "var(--border-color)" }}
          data-ocid={`lectures.slot.room.${index + 1}`}
        />
      </div>

      <button
        type="button"
        data-ocid={`lectures.slot.delete_button.${index + 1}`}
        onClick={onRemove}
        className="p-2 rounded-lg transition-colors hover:bg-destructive/10"
        style={{ color: "var(--danger)" }}
        aria-label="Remove slot"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
