import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface AddStudentRequest {
    prn: string;
    name: string;
    section: string;
    isActive: boolean;
    rollNo: bigint;
}
export interface StudentWithId {
    prn_last2: string;
    name: string;
    student_id: string;
}
export interface WeeklySlot {
    day: string;
    startTime: string;
    subject: string;
    endTime: string;
    room: string;
}
export type MarkAttendanceResponse = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "alreadyMarked";
    alreadyMarked: string;
} | {
    __kind__: "error";
    error: string;
} | {
    __kind__: "invalidPRN";
    invalidPRN: string;
};
export interface AttendanceStats {
    unique_students: bigint;
    total_students: bigint;
    today_count: bigint;
    total_records: bigint;
}
export interface FacultyCredentials {
    password: string;
    name: string;
    email: string;
}
export interface StudentWithSection {
    id: string;
    prn: string;
    name: string;
    section: string;
    isActive: boolean;
    rollNo: bigint;
}
export interface SectionCounts {
    first_year: bigint;
    btech: bigint;
    third_year: bigint;
    second_year: bigint;
}
export interface ManualAttendanceRequest {
    prn: string;
    subject: string;
    timestamp_override?: bigint;
    notes: string;
}
export interface UpdateStudentRequest {
    prn?: string;
    name?: string;
    section?: string;
    isActive?: boolean;
    rollNo?: bigint;
}
export interface AttendanceRecord {
    id: string;
    prn: string;
    student_name: string;
    latitude: number;
    method: string;
    image_url: string;
    device_info: string;
    longitude: number;
    timestamp: bigint;
    geo_fail: boolean;
}
export interface LocationConfig {
    lat: number;
    lng: number;
    locationLabel: string;
    radiusMeters: number;
}
export interface MarkAttendanceRequest {
    prn: string;
    latitude: number;
    token: bigint;
    image_url: string;
    device_info: string;
    longitude: number;
}
export interface Student {
    id: string;
    prn: string;
    name: string;
    section: string;
    isActive: boolean;
    rollNo: bigint;
}
export interface backendInterface {
    add_manual_attendance(req: ManualAttendanceRequest): Promise<MarkAttendanceResponse>;
    add_student(req: AddStudentRequest): Promise<{
        __kind__: "ok";
        ok: Student;
    } | {
        __kind__: "err";
        err: string;
    }>;
    delete_attendance(record_id: bigint): Promise<boolean>;
    delete_student(id: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    get_all_attendance(): Promise<Array<AttendanceRecord>>;
    get_all_semester_templates(): Promise<Array<[bigint, Array<WeeklySlot>]>>;
    get_all_students(): Promise<Array<Student>>;
    get_attendance_by_date(date_text: string): Promise<Array<AttendanceRecord>>;
    get_attendance_by_student(prn: string): Promise<Array<AttendanceRecord>>;
    get_attendance_stats(): Promise<AttendanceStats>;
    get_faculty_credentials(): Promise<FacultyCredentials>;
    get_hotspot_ip(): Promise<string>;
    get_live_checkins(limit: bigint): Promise<Array<AttendanceRecord>>;
    get_location_config(): Promise<LocationConfig>;
    get_semester_template(semester: bigint): Promise<Array<WeeklySlot>>;
    get_student_by_prn(prn: string): Promise<Student | null>;
    get_student_list(): Promise<Array<StudentWithId>>;
    get_student_sections_count(): Promise<SectionCounts>;
    get_students_by_section(section: string): Promise<Array<StudentWithSection>>;
    mark_attendance(req: MarkAttendanceRequest): Promise<MarkAttendanceResponse>;
    update_faculty_credentials(name: string, email: string, password: string): Promise<boolean>;
    update_hotspot_ip(ip: string): Promise<boolean>;
    update_location_config(config: LocationConfig): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    update_semester_template(semester: bigint, slots: Array<WeeklySlot>): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    update_student(id: string, upd: UpdateStudentRequest): Promise<{
        __kind__: "ok";
        ok: Student;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
