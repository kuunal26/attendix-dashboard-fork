import Types "types/attendance";
import AttendanceLib "lib/attendance";
import AttendanceMixin "mixins/attendance-api";
import Migration "migration";
import Map "mo:core/Map";
import List "mo:core/List";



(with migration = Migration.run)
actor {
  let students : Map.Map<Text, Types.Student> = AttendanceLib.initStudents();
  let records : List.List<Types.AttendanceRecord> = List.empty<Types.AttendanceRecord>();
  let state = { var nextId : Nat = 0 };
  let facultyCreds = {
    var name : Text = "Prof. Attendix";
    var email : Text = "faculty@attendix.edu";
    var password : Text = "faculty123";
  };
  // Semester timetable templates (semesters 1–6)
  let semesterTemplates : Map.Map<Nat, [Types.WeeklySlot]> = Map.empty<Nat, [Types.WeeklySlot]>();
  // Classroom location gate (default: exact classroom coordinates, 20m radius)
  let locationCfg = {
    var lat : Float = 17.6901107;
    var lng : Float = 74.0150357;
    var radiusMeters : Float = 20.0;
    var locationLabel : Text = "Classroom";
  };
  // Faculty Hotspot Gateway IP (empty by default; configure via settings)
  let hotspotCfg = { var ip : Text = "" };

  include AttendanceMixin(students, records, state, facultyCreds, semesterTemplates, locationCfg, hotspotCfg);
};
