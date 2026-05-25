import Types "../types/attendance";
import AttendanceLib "../lib/attendance";
import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";

mixin (
  students : Map.Map<Text, Types.Student>,
  records : List.List<Types.AttendanceRecord>,
  state : { var nextId : Nat },
  facultyCreds : { var name : Text; var email : Text; var password : Text },
  semesterTemplates : Map.Map<Nat, [Types.WeeklySlot]>,
  locationCfg : { var lat : Float; var lng : Float; var radiusMeters : Float; var locationLabel : Text },
  hotspotCfg : { var ip : Text },
) {
  /// Marks attendance for the student identified by full PRN.
  /// Validates TOTP token, geo-flags if outside radius, prevents duplicate within the same calendar day.
  public func mark_attendance(
    req : Types.MarkAttendanceRequest
  ) : async Types.MarkAttendanceResponse {
    AttendanceLib.markAttendance(students, records, state, locationCfg, req);
  };

  /// Returns the student record for the given full PRN, or null if not found.
  public query func get_student_by_prn(prn : Text) : async ?Types.Student {
    AttendanceLib.findByPRN(students, prn);
  };

  /// Returns all stored attendance records, newest first.
  public query func get_all_attendance() : async [Types.AttendanceRecord] {
    AttendanceLib.sortedRecords(records);
  };

  /// Returns all records for a specific student full PRN, newest first.
  public query func get_attendance_by_student(prn : Text) : async [Types.AttendanceRecord] {
    AttendanceLib.recordsByPRN(records, prn);
  };

  /// Returns records whose timestamp falls within the given date (YYYY-MM-DD UTC).
  public query func get_attendance_by_date(date_text : Text) : async [Types.AttendanceRecord] {
    AttendanceLib.recordsByDate(records, date_text);
  };

  /// Returns the most recent `limit` records for the live monitoring widget.
  public query func get_live_checkins(limit : Nat) : async [Types.AttendanceRecord] {
    AttendanceLib.liveCheckins(records, limit);
  };

  /// Returns aggregate stats: total records, unique students, and today's count.
  public query func get_attendance_stats() : async Types.AttendanceStats {
    AttendanceLib.attendanceStats(students, records);
  };

  /// Returns the full student list (all sections).
  public query func get_all_students() : async [Types.Student] {
    AttendanceLib.allStudents(students);
  };

  /// Returns all students with their IDs (legacy compat).
  public query func get_student_list() : async [Types.StudentWithId] {
    AttendanceLib.studentList(students);
  };

  /// Returns students filtered by section.
  public query func get_students_by_section(section : Text) : async [Types.StudentWithSection] {
    AttendanceLib.studentsBySection(students, section);
  };

  /// Returns student counts per section.
  public query func get_student_sections_count() : async Types.SectionCounts {
    AttendanceLib.sectionCounts(students);
  };

  /// Deletes the attendance record with the given numeric id.
  public func delete_attendance(record_id : Nat) : async Bool {
    AttendanceLib.deleteRecord(records, record_id);
  };

  /// Adds a manual attendance entry on behalf of a student (faculty override).
  public func add_manual_attendance(
    req : Types.ManualAttendanceRequest
  ) : async Types.MarkAttendanceResponse {
    AttendanceLib.addManualAttendance(students, records, state, req);
  };

  /// Adds a new student.
  public func add_student(req : Types.AddStudentRequest) : async { #ok : Types.Student; #err : Text } {
    AttendanceLib.addStudent(students, req);
  };

  /// Updates an existing student by id.
  public func update_student(id : Text, upd : Types.UpdateStudentRequest) : async { #ok : Types.Student; #err : Text } {
    AttendanceLib.updateStudent(students, id, upd);
  };

  /// Deletes a student by id.
  public func delete_student(id : Text) : async { #ok : (); #err : Text } {
    AttendanceLib.deleteStudent(students, id);
  };

  /// Returns the current faculty credentials.
  public query func get_faculty_credentials() : async Types.FacultyCredentials {
    { name = facultyCreds.name; email = facultyCreds.email; password = facultyCreds.password };
  };

  /// Updates the faculty credentials.
  public func update_faculty_credentials(name : Text, email : Text, password : Text) : async Bool {
    facultyCreds.name := name;
    facultyCreds.email := email;
    facultyCreds.password := password;
    true;
  };

  // ── Timetable API ───────────────────────────────────────────────

  /// Returns the weekly slots for the given semester (1–6).
  public query func get_semester_template(semester : Nat) : async [Types.WeeklySlot] {
    AttendanceLib.getSemesterTemplate(semesterTemplates, semester);
  };

  /// Replaces the weekly template for the given semester.
  public func update_semester_template(semester : Nat, slots : [Types.WeeklySlot]) : async { #ok : (); #err : Text } {
    AttendanceLib.updateSemesterTemplate(semesterTemplates, semester, slots);
  };

  /// Returns all semester templates.
  public query func get_all_semester_templates() : async [(Nat, [Types.WeeklySlot])] {
    AttendanceLib.getAllSemesterTemplates(semesterTemplates);
  };

  // ── Location API ───────────────────────────────────────────────

  /// Returns the current classroom location configuration.
  public query func get_location_config() : async Types.LocationConfig {
    { lat = locationCfg.lat; lng = locationCfg.lng; radiusMeters = locationCfg.radiusMeters; locationLabel = locationCfg.locationLabel };
  };

  /// Updates the classroom location configuration.
  public func update_location_config(config : Types.LocationConfig) : async { #ok : (); #err : Text } {
    locationCfg.lat := config.lat;
    locationCfg.lng := config.lng;
    locationCfg.radiusMeters := config.radiusMeters;
    locationCfg.locationLabel := config.locationLabel;
    #ok(());
  };

  // ── Hotspot IP API ─────────────────────────────────────────────

  /// Returns the configured Faculty Hotspot Gateway IP.
  public query func get_hotspot_ip() : async Text {
    hotspotCfg.ip;
  };

  /// Updates the Faculty Hotspot Gateway IP.
  public func update_hotspot_ip(ip : Text) : async Bool {
    hotspotCfg.ip := ip;
    true;
  };
};
