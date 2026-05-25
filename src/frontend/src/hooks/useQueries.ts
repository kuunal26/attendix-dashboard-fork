import { createActor } from "@/backend";
import type {
  AddStudentRequest,
  AttendanceRecord,
  AttendanceStats,
  LocationConfig,
  ManualAttendanceRequest,
  MarkAttendanceRequest,
  MarkAttendanceResponse,
  SectionCounts,
  Student,
  StudentWithSection,
  UpdateStudentRequest,
  WeeklySlot,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useAllAttendance() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_all_attendance();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useAttendanceByStudent(prn: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "student", prn],
    queryFn: async () => {
      if (!actor || !prn) return [];
      return actor.get_attendance_by_student(prn);
    },
    enabled: !!actor && !isFetching && !!prn,
    refetchInterval: 15_000,
  });
}

export function useAttendanceStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttendanceStats>({
    queryKey: ["attendance", "stats"],
    queryFn: async () => {
      if (!actor)
        return {
          unique_students: BigInt(0),
          today_count: BigInt(0),
          total_records: BigInt(0),
          total_students: BigInt(0),
        };
      return actor.get_attendance_stats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useLiveCheckins(limit = BigInt(20)) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "live", limit.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_live_checkins(limit);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useAllStudents() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Student[]>({
    queryKey: ["students", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_all_students();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAttendanceByDate(date: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "date", date],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_attendance_by_date(date);
    },
    enabled: !!actor && !isFetching && !!date,
  });
}
export function useDeleteAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, bigint>({
    mutationFn: async (recordId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.delete_attendance(recordId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useAddManualAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: ManualAttendanceRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.add_manual_attendance(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useSemesterTemplates() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<[bigint, Array<WeeklySlot>]>>({
    queryKey: ["semester-templates", "all"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_all_semester_templates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSemesterTemplate(semester: number) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Array<WeeklySlot>>({
    queryKey: ["semester-templates", semester],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_semester_template(BigInt(semester));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateSemesterTemplate() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string },
    Error,
    { semester: number; slots: Array<WeeklySlot> }
  >({
    mutationFn: async ({ semester, slots }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.update_semester_template(BigInt(semester), slots);
    },
    onSuccess: (_, { semester }) => {
      queryClient.invalidateQueries({
        queryKey: ["semester-templates", "all"],
      });
      queryClient.invalidateQueries({
        queryKey: ["semester-templates", semester],
      });
    },
  });
}

export function useStudentsBySection(section: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<StudentWithSection[]>({
    queryKey: ["students", "section", section],
    queryFn: async () => {
      if (!actor) return [];
      return actor.get_students_by_section(section);
    },
    enabled: !!actor && !isFetching && !!section,
  });
}

export function useStudentSectionCounts() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<SectionCounts>({
    queryKey: ["students", "sections", "count"],
    queryFn: async () => {
      if (!actor)
        return {
          first_year: BigInt(0),
          second_year: BigInt(0),
          third_year: BigInt(0),
          btech: BigInt(0),
        };
      return actor.get_student_sections_count();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (req: AddStudentRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.add_student(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useUpdateStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      upd,
    }: { id: string; upd: UpdateStudentRequest }) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.update_student(id, upd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useDeleteStudent() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.delete_student(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useMarkAttendance() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<MarkAttendanceResponse, Error, MarkAttendanceRequest>({
    mutationFn: async (req: MarkAttendanceRequest) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.mark_attendance(req);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useHotspotIp() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<string>({
    queryKey: ["hotspot", "ip"],
    queryFn: async () => {
      if (!actor) return "";
      return actor.get_hotspot_ip();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateHotspotIp() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string>({
    mutationFn: async (ip: string) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.update_hotspot_ip(ip);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotspot", "ip"] });
    },
  });
}

export function useLocationConfig() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<LocationConfig>({
    queryKey: ["location", "config"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return actor.get_location_config();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateLocationConfig() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation<
    { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string },
    Error,
    LocationConfig
  >({
    mutationFn: async (config: LocationConfig) => {
      if (!actor) throw new Error("Actor not ready");
      return actor.update_location_config(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["location", "config"] });
    },
  });
}

export function useStudentByPrn(prn: string | undefined) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery<Student | null>({
    queryKey: ["student", "prn", prn],
    queryFn: async () => {
      if (!actor || !prn) return null;
      return actor.get_student_by_prn(prn);
    },
    enabled: !!actor && !isFetching && !!prn && prn.length >= 3,
  });
}

export function formatTimestamp(ts: bigint): {
  date: string;
  time: string;
  full: string;
} {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const full = `${date}, ${time}`;
  return { date, time, full };
}
