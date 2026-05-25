import NewTypes "types/attendance";
import List "mo:core/List";
import Map "mo:core/Map";

module {
  // ── Old types (as deployed in the previous canister version) ─────
  // The previous version already had geo_fail on AttendanceRecord and
  // hotspotCfg on the actor — so this migration is a structural pass-through
  // needed only to satisfy the stable-compatibility checker.

  type OldAttendanceRecord = {
    id : Text;
    student_name : Text;
    prn : Text;
    timestamp : Int;
    latitude : Float;
    longitude : Float;
    image_url : Text;
    device_info : Text;
    method : Text;
    geo_fail : Bool;
  };

  type OldStudent = {
    id : Text;
    name : Text;
    prn : Text;
    section : Text;
    rollNo : Nat;
    isActive : Bool;
  };

  type OldWeeklySlot = {
    day : Text;
    subject : Text;
    startTime : Text;
    endTime : Text;
    room : Text;
  };

  type OldActor = {
    students : Map.Map<Text, OldStudent>;
    records : List.List<OldAttendanceRecord>;
    state : { var nextId : Nat };
    facultyCreds : { var name : Text; var email : Text; var password : Text };
    semesterTemplates : Map.Map<Nat, [OldWeeklySlot]>;
    locationCfg : {
      var lat : Float;
      var lng : Float;
      var radiusMeters : Float;
      var locationLabel : Text;
    };
    hotspotCfg : { var ip : Text };
  };

  type NewActor = {
    students : Map.Map<Text, NewTypes.Student>;
    records : List.List<NewTypes.AttendanceRecord>;
    state : { var nextId : Nat };
    facultyCreds : { var name : Text; var email : Text; var password : Text };
    semesterTemplates : Map.Map<Nat, [NewTypes.WeeklySlot]>;
    locationCfg : {
      var lat : Float;
      var lng : Float;
      var radiusMeters : Float;
      var locationLabel : Text;
    };
    hotspotCfg : { var ip : Text };
  };

  public func run(old : OldActor) : NewActor {
    // Pass through all fields unchanged — the state shape is identical.
    // The students map is re-seeded at actor init; the migration preserves
    // live runtime state (records, creds, templates, locationCfg, hotspotCfg).
    let newRecords = List.empty<NewTypes.AttendanceRecord>();
    for (r in old.records.values()) {
      newRecords.add({
        id = r.id;
        student_name = r.student_name;
        prn = r.prn;
        timestamp = r.timestamp;
        latitude = r.latitude;
        longitude = r.longitude;
        image_url = r.image_url;
        device_info = r.device_info;
        method = r.method;
        geo_fail = r.geo_fail;
      });
    };
    {
      students = old.students;
      records = newRecords;
      state = old.state;
      facultyCreds = old.facultyCreds;
      semesterTemplates = old.semesterTemplates;
      locationCfg = old.locationCfg;
      hotspotCfg = old.hotspotCfg;
    };
  };
};
