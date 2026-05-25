import type { backendInterface, Student } from "../backend";

export const mockBackend: backendInterface = {
  get_student_by_prn: async (prn: string) => {
    const students: Record<string, Student> = {
      "2024BTECS00001": { id: "1", prn: "2024BTECS00001", name: "Bhosale Pradnya Sanjay", section: "btech", isActive: true, rollNo: BigInt(1) },
      "2024BTECS00022": { id: "2", prn: "2024BTECS00022", name: "Malusare Madhura Sagar", section: "btech", isActive: true, rollNo: BigInt(2) },
      "2024BTECS00501": { id: "3", prn: "2024BTECS00501", name: "Giri Harshda Hanmant", section: "btech", isActive: true, rollNo: BigInt(3) },
    };
    const student = students[prn];
    if (!student) return null;
    return student;
  },
  mark_attendance: async (_req) => {
    return { __kind__: "ok", ok: "Attendance marked successfully" };
  },
  get_all_attendance: async () => [],
  get_all_students: async () => [],
  get_attendance_by_date: async (_date_text) => [],
  get_attendance_by_student: async (_prn) => [],
  get_attendance_stats: async () => ({
    unique_students: BigInt(0),
    today_count: BigInt(0),
    total_records: BigInt(0),
    total_students: BigInt(0),
  }),
  get_live_checkins: async (_limit) => [],
  get_student_list: async () => [],
  add_manual_attendance: async (_req) => ({ __kind__: "ok", ok: "Attendance marked" }),
  delete_attendance: async (_id) => true,
  get_faculty_credentials: async () => ({
    name: "Prof. Attendix",
    email: "faculty@attendix.edu",
    password: "faculty123",
  }),
  update_faculty_credentials: async (_name, _email, _password) => true,
  get_location_config: async () => ({
    lat: 17.690861470820273,
    lng: 74.01526450231378,
    radiusMeters: 200,
    locationLabel: "Electronics & Telecommunication Dept",
  }),
  update_location_config: async (_config) => ({ __kind__: "ok", ok: null }),
  get_all_semester_templates: async () => [],
  get_semester_template: async (_semester) => [],
  update_semester_template: async (_semester, _slots) => ({ __kind__: "ok", ok: null }),
  get_students_by_section: async (_section) => [],
  get_student_sections_count: async () => ({
    first_year: BigInt(0),
    second_year: BigInt(0),
    third_year: BigInt(0),
    btech: BigInt(0),
  }),
  add_student: async (_req) => ({ __kind__: "ok", ok: { id: "1", prn: "", name: "", section: "", isActive: true, rollNo: BigInt(0) } }),
  update_student: async (_id, _upd) => ({ __kind__: "ok", ok: { id: "1", prn: "", name: "", section: "", isActive: true, rollNo: BigInt(0) } }),
  delete_student: async (_id) => ({ __kind__: "ok", ok: null }),
  get_hotspot_ip: async () => "",
  update_hotspot_ip: async (_ip: string) => true,
};
