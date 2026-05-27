
module {
  // Valid section values: "first_year", "second_year", "third_year", "btech"
  public type Student = {
    id : Text;
    name : Text;
    prn : Text;
    section : Text;
    rollNo : Nat;
    isActive : Bool;
    reference_photo_url : ?Text;
  };

  public type AddStudentRequest = {
    name : Text;
    prn : Text;
    section : Text;
    rollNo : Nat;
    isActive : Bool;
  };

  public type UpdateStudentRequest = {
    name : ?Text;
    prn : ?Text;
    section : ?Text;
    rollNo : ?Nat;
    isActive : ?Bool;
  };

  public type StudentWithSection = {
    id : Text;
    name : Text;
    prn : Text;
    section : Text;
    rollNo : Nat;
    isActive : Bool;
    reference_photo_url : ?Text;
  };

  public type SectionCounts = {
    first_year : Nat;
    second_year : Nat;
    third_year : Nat;
    btech : Nat;
  };

  public type AttendanceRecord = {
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
    face_mismatch : Bool;
  };

  public type ManualAttendanceRequest = {
    prn : Text;
    subject : Text;
    timestamp_override : ?Int;
    notes : Text;
  };

  public type FacultyCredentials = {
    name : Text;
    email : Text;
    password : Text;
  };

  public type MarkAttendanceRequest = {
    prn : Text;
    latitude : Float;
    longitude : Float;
    image_url : Text;
    device_info : Text;
    token : Nat;
  };

  public type AttendanceStats = {
    total_records : Nat;
    unique_students : Nat;
    today_count : Nat;
    total_students : Nat;
  };

  // Kept for backward compatibility — frontend may still use this
  public type StudentWithId = {
    student_id : Text;
    name : Text;
    prn_last2 : Text;
  };

  public type MarkAttendanceResponse = {
    #ok : Text;
    #alreadyMarked : Text;
    #invalidPRN : Text;
    #error : Text;
  };

  public type WeeklySlot = {
    day : Text;
    subject : Text;
    startTime : Text;
    endTime : Text;
    room : Text;
  };

  public type SemesterTemplate = {
    semester : Nat;
    slots : [WeeklySlot];
  };

  public type LocationConfig = {
    lat : Float;
    lng : Float;
    radiusMeters : Float;
    locationLabel : Text;
  };
};
