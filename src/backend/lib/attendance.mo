import Types "../types/attendance";
import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Set "mo:core/Set";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Float "mo:core/Float";

module {
  public type Student = Types.Student;
  public type AttendanceRecord = Types.AttendanceRecord;
  public type MarkAttendanceRequest = Types.MarkAttendanceRequest;
  public type MarkAttendanceResponse = Types.MarkAttendanceResponse;
  public type ManualAttendanceRequest = Types.ManualAttendanceRequest;
  public type FacultyCredentials = Types.FacultyCredentials;
  public type AttendanceStats = Types.AttendanceStats;
  public type WeeklySlot = Types.WeeklySlot;
  public type LocationConfig = Types.LocationConfig;

  /// Converts the records List to an array sorted by timestamp descending (newest first).
  public func sortedRecords(records : List.List<AttendanceRecord>) : [AttendanceRecord] {
    let arr = records.toArray();
    arr.sort(func(a : AttendanceRecord, b : AttendanceRecord) : { #less; #equal; #greater } {
      Int.compare(b.timestamp, a.timestamp);
    });
  };

  // ── TOTP Validation ─────────────────────────────────────────────

  /// Validates a TOTP token using: abs(floor(epoch_secs / 2) * 987654321) % 1000000
  /// Accepts current window and immediately previous window.
  public func validateTotp(token : Nat, nowNs : Int) : Bool {
    let epochSecs : Int = nowNs / 1_000_000_000;
    let currentBlock : Int = epochSecs / 2;
    let prevBlock : Int = currentBlock - 1;
    let currentToken : Nat = Int.abs(currentBlock * 987654321) % 1000000;
    let prevToken : Nat = Int.abs(prevBlock * 987654321) % 1000000;
    token == currentToken or token == prevToken;
  };

  // ── Haversine Distance ──────────────────────────────────────────

  /// Returns the great-circle distance in metres between two WGS-84 coordinates.
  public func haversineMetres(lat1 : Float, lon1 : Float, lat2 : Float, lon2 : Float) : Float {
    let r : Float = 6371000.0;
    let pi : Float = Float.pi;
    let dLat : Float = (lat2 - lat1) * pi / 180.0;
    let dLon : Float = (lon2 - lon1) * pi / 180.0;
    let sinDLat : Float = Float.sin(dLat / 2.0);
    let sinDLon : Float = Float.sin(dLon / 2.0);
    let a : Float = sinDLat * sinDLat +
      Float.cos(lat1 * pi / 180.0) * Float.cos(lat2 * pi / 180.0) * sinDLon * sinDLon;
    let c : Float = 2.0 * Float.arctan2(Float.sqrt(a), Float.sqrt(1.0 - a));
    r * c;
  };

  /// Returns all records for a specific full PRN, newest first.
  public func recordsByPRN(
    records : List.List<AttendanceRecord>,
    prn : Text,
  ) : [AttendanceRecord] {
    let arr = sortedRecords(records);
    arr.filter(func(r : AttendanceRecord) : Bool { r.prn == prn });
  };

  /// Zero-pads an Int to at least `width` digits.
  func padInt(n : Int, width : Nat) : Text {
    let s = n.toText();
    let len = s.size();
    if (len >= width) { s } else {
      var pad = "";
      var i = 0;
      while (i + len < width) { pad := pad # "0"; i += 1 };
      pad # s;
    };
  };

  /// Converts a nanosecond IC timestamp to a YYYY-MM-DD UTC string.
  public func timestampToDateText(ts : Int) : Text {
    let secs : Int = ts / 1_000_000_000;
    let days : Int = secs / 86_400;
    let z : Int = days + 719_468;
    let era : Int = (if (z >= 0) z else z - 146_096) / 146_097;
    let doe : Int = z - era * 146_097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = mp + (if (mp < 10) 3 else -9);
    let year : Int = y + (if (m <= 2) 1 else 0);
    padInt(year, 4) # "-" # padInt(m, 2) # "-" # padInt(d, 2);
  };

  /// Returns records whose timestamp falls within the given date (YYYY-MM-DD UTC).
  public func recordsByDate(
    records : List.List<AttendanceRecord>,
    date_text : Text,
  ) : [AttendanceRecord] {
    let arr = sortedRecords(records);
    arr.filter(func(r : AttendanceRecord) : Bool {
      timestampToDateText(r.timestamp) == date_text;
    });
  };

  /// Returns up to `limit` most recent records.
  public func liveCheckins(
    records : List.List<AttendanceRecord>,
    limit : Nat,
  ) : [AttendanceRecord] {
    let arr = sortedRecords(records);
    let total = arr.size();
    let take = if (limit < total) limit else total;
    arr.sliceToArray(0, take.toInt());
  };

  /// Returns aggregate stats for dashboard KPI cards.
  public func attendanceStats(
    students : Map.Map<Text, Student>,
    records : List.List<AttendanceRecord>,
  ) : AttendanceStats {
    let arr = records.toArray();
    let total = arr.size();
    let uniqueSet = Set.empty<Text>();
    var todayCount : Nat = 0;
    let now = Time.now();
    let todayStart : Int = (now / 1_000_000_000 / 86_400) * 86_400 * 1_000_000_000;
    for (r in arr.values()) {
      uniqueSet.add(r.prn);
      if (r.timestamp >= todayStart) { todayCount += 1 };
    };
    {
      total_records = total;
      unique_students = uniqueSet.size();
      today_count = todayCount;
      total_students = students.size();
    };
  };

  /// Returns all students as an array.
  public func allStudents(students : Map.Map<Text, Student>) : [Student] {
    students.values().toArray();
  };

  /// Returns all students with their full details (alias for public API).
  public func studentList(students : Map.Map<Text, Student>) : [Types.StudentWithId] {
    students.entries().toArray().map<(Text, Student), Types.StudentWithId>(
      func((prn, s)) {
        { student_id = s.id; name = s.name; prn_last2 = prn };
      }
    );
  };

  /// Returns students filtered by section.
  public func studentsBySection(
    students : Map.Map<Text, Student>,
    section : Text,
  ) : [Types.StudentWithSection] {
    students.values().toArray().filter(
      func(s : Student) : Bool { s.section == section }
    ).map<Student, Types.StudentWithSection>(
      func(s) {
        { id = s.id; name = s.name; prn = s.prn; section = s.section; rollNo = s.rollNo; isActive = s.isActive };
      }
    );
  };

  /// Returns student counts per section.
  public func sectionCounts(students : Map.Map<Text, Student>) : Types.SectionCounts {
    var fy : Nat = 0;
    var sy : Nat = 0;
    var ty : Nat = 0;
    var bt : Nat = 0;
    for (s in students.values()) {
      if (s.section == "first_year") { fy += 1 }
      else if (s.section == "second_year") { sy += 1 }
      else if (s.section == "third_year") { ty += 1 }
      else if (s.section == "btech") { bt += 1 };
    };
    { first_year = fy; second_year = sy; third_year = ty; btech = bt };
  };

  /// Returns the pre-loaded student roster.
  public func initStudents() : Map.Map<Text, Student> {
    let m = Map.empty<Text, Student>();

    // ── Second Year students (78 students) ──
    m.add("24062701372001", { id = "24062701372001"; prn = "24062701372001"; name = "AWARE PRATIK SANDIP"; section = "second_year"; rollNo = 1; isActive = true });
    m.add("24062701372002", { id = "24062701372002"; prn = "24062701372002"; name = "BALLAL PRATIDNYA VINOD"; section = "second_year"; rollNo = 2; isActive = true });
    m.add("24062701372003", { id = "24062701372003"; prn = "24062701372003"; name = "BENDRE SHRADDHA KIRAN"; section = "second_year"; rollNo = 3; isActive = true });
    m.add("24062701372004", { id = "24062701372004"; prn = "24062701372004"; name = "BODAKE PRANITA KIRAN"; section = "second_year"; rollNo = 4; isActive = true });
    m.add("24062701372005", { id = "24062701372005"; prn = "24062701372005"; name = "BOTE VISHRANTI VIJAYKUMAR"; section = "second_year"; rollNo = 5; isActive = true });
    m.add("24062701372006", { id = "24062701372006"; prn = "24062701372006"; name = "CHORAGE SHREYAS DEEPAK"; section = "second_year"; rollNo = 6; isActive = true });
    m.add("24062701372007", { id = "24062701372007"; prn = "24062701372007"; name = "CHORAMALE GAURI BAJIRAO"; section = "second_year"; rollNo = 7; isActive = true });
    m.add("24062701372008", { id = "24062701372008"; prn = "24062701372008"; name = "DAHOTRE SARTHAK SHEKHAR"; section = "second_year"; rollNo = 8; isActive = true });
    m.add("24062701372009", { id = "24062701372009"; prn = "24062701372009"; name = "DEOKAR RUTUJA MAHADEV"; section = "second_year"; rollNo = 9; isActive = true });
    m.add("24062701372010", { id = "24062701372010"; prn = "24062701372010"; name = "DESAI VAISHNAVI DATTATRAY"; section = "second_year"; rollNo = 10; isActive = true });
    m.add("24062701372011", { id = "24062701372011"; prn = "24062701372011"; name = "DHAKAL BISHAL KALAMBHADUR"; section = "second_year"; rollNo = 11; isActive = true });
    m.add("24062701372012", { id = "24062701372012"; prn = "24062701372012"; name = "DHAMALE TEJAS SHIVAJI"; section = "second_year"; rollNo = 12; isActive = true });
    m.add("24062701372013", { id = "24062701372013"; prn = "24062701372013"; name = "GADEKAR PRITI NITIN"; section = "second_year"; rollNo = 13; isActive = true });
    m.add("24062701372014", { id = "24062701372014"; prn = "24062701372014"; name = "GHANWAT NEHA SURESH"; section = "second_year"; rollNo = 14; isActive = true });
    m.add("24062701372016", { id = "24062701372016"; prn = "24062701372016"; name = "JADHAV AKSHAY VILAS"; section = "second_year"; rollNo = 15; isActive = true });
    m.add("24062701372017", { id = "24062701372017"; prn = "24062701372017"; name = "JADHAV AVISHKA MANOHAR"; section = "second_year"; rollNo = 16; isActive = true });
    m.add("24062701372018", { id = "24062701372018"; prn = "24062701372018"; name = "JADHAV SAKSHI DHANAJI"; section = "second_year"; rollNo = 17; isActive = true });
    m.add("24062701372019", { id = "24062701372019"; prn = "24062701372019"; name = "JADHAV VEDANTIKA VINOD"; section = "second_year"; rollNo = 18; isActive = true });
    m.add("24062701372020", { id = "24062701372020"; prn = "24062701372020"; name = "JAGTAP DIKSHA RAJENDRA"; section = "second_year"; rollNo = 19; isActive = true });
    m.add("24062701372021", { id = "24062701372021"; prn = "24062701372021"; name = "KADAM ADITI BIRAJ"; section = "second_year"; rollNo = 20; isActive = true });
    m.add("24062701372022", { id = "24062701372022"; prn = "24062701372022"; name = "KAMBLE PRERNA SHARAD"; section = "second_year"; rollNo = 21; isActive = true });
    m.add("24062701372023", { id = "24062701372023"; prn = "24062701372023"; name = "KANKNUDI VAISHNAVI MALLAPPA"; section = "second_year"; rollNo = 22; isActive = true });
    m.add("24062701372024", { id = "24062701372024"; prn = "24062701372024"; name = "KHADE ANUJA SHANKAR"; section = "second_year"; rollNo = 23; isActive = true });
    m.add("24062701372025", { id = "24062701372025"; prn = "24062701372025"; name = "KHADE ASHWINI PINTU"; section = "second_year"; rollNo = 24; isActive = true });
    m.add("24062701372026", { id = "24062701372026"; prn = "24062701372026"; name = "KHARADE ARYAN SANTOSH"; section = "second_year"; rollNo = 25; isActive = true });
    m.add("24062701372027", { id = "24062701372027"; prn = "24062701372027"; name = "KUMBHAR NIMESH YUVRAJ"; section = "second_year"; rollNo = 26; isActive = true });
    m.add("24062701372028", { id = "24062701372028"; prn = "24062701372028"; name = "KUMBHAR PREETAM CHANDRAKANT"; section = "second_year"; rollNo = 27; isActive = true });
    m.add("24062701372029", { id = "24062701372029"; prn = "24062701372029"; name = "LOHAR ISHWARI MAHESH"; section = "second_year"; rollNo = 28; isActive = true });
    m.add("24062701372030", { id = "24062701372030"; prn = "24062701372030"; name = "MAGAR ADITYA RAMESH"; section = "second_year"; rollNo = 29; isActive = true });
    m.add("24062701372031", { id = "24062701372031"; prn = "24062701372031"; name = "MAHADIK JANHAVI JAHAGIRRAO"; section = "second_year"; rollNo = 30; isActive = true });
    m.add("24062701372033", { id = "24062701372033"; prn = "24062701372033"; name = "MANE SOHAM RAVINDRA"; section = "second_year"; rollNo = 31; isActive = true });
    m.add("24062701372034", { id = "24062701372034"; prn = "24062701372034"; name = "MANE SOHAM SANDIP"; section = "second_year"; rollNo = 32; isActive = true });
    m.add("24062701372035", { id = "24062701372035"; prn = "24062701372035"; name = "MASANE AYUSH NANDAKUMAR"; section = "second_year"; rollNo = 33; isActive = true });
    m.add("24062701372036", { id = "24062701372036"; prn = "24062701372036"; name = "MESTRY BHARGAVI ANAND"; section = "second_year"; rollNo = 34; isActive = true });
    m.add("24062701372037", { id = "24062701372037"; prn = "24062701372037"; name = "MOHITE SAYEE SURESH"; section = "second_year"; rollNo = 35; isActive = true });
    m.add("24062701372038", { id = "24062701372038"; prn = "24062701372038"; name = "MORE ANUSHKA SACHIN"; section = "second_year"; rollNo = 36; isActive = true });
    m.add("24062701372039", { id = "24062701372039"; prn = "24062701372039"; name = "MULANI AYAN SADIQ"; section = "second_year"; rollNo = 37; isActive = true });
    m.add("24062701372040", { id = "24062701372040"; prn = "24062701372040"; name = "NALAWADE SIDDHI SUNIL"; section = "second_year"; rollNo = 38; isActive = true });
    m.add("24062701372041", { id = "24062701372041"; prn = "24062701372041"; name = "NANAWARE PRITAM PRAKASH"; section = "second_year"; rollNo = 39; isActive = true });
    m.add("24062701372042", { id = "24062701372042"; prn = "24062701372042"; name = "NANAWARE SAMRUDDHI RAJENDRA"; section = "second_year"; rollNo = 40; isActive = true });
    m.add("24062701372043", { id = "24062701372043"; prn = "24062701372043"; name = "NIKAM PRAJAKTA MANSING"; section = "second_year"; rollNo = 41; isActive = true });
    m.add("24062701372044", { id = "24062701372044"; prn = "24062701372044"; name = "NIKAM SIDDHI MANOJKUMAR"; section = "second_year"; rollNo = 42; isActive = true });
    m.add("24062701372045", { id = "24062701372045"; prn = "24062701372045"; name = "PACHANGANE AKANKSHA GORAKHNATH"; section = "second_year"; rollNo = 43; isActive = true });
    m.add("24062701372046", { id = "24062701372046"; prn = "24062701372046"; name = "PADALKAR OM AJIT"; section = "second_year"; rollNo = 44; isActive = true });
    m.add("24062701372047", { id = "24062701372047"; prn = "24062701372047"; name = "PATHAN SAAD SHAHANAWAZ"; section = "second_year"; rollNo = 45; isActive = true });
    m.add("24062701372048", { id = "24062701372048"; prn = "24062701372048"; name = "PATIL SHARVARI HANMANT"; section = "second_year"; rollNo = 46; isActive = true });
    m.add("24062701372049", { id = "24062701372049"; prn = "24062701372049"; name = "PAWAR ABHISHEK SUSHANT"; section = "second_year"; rollNo = 47; isActive = true });
    m.add("24062701372050", { id = "24062701372050"; prn = "24062701372050"; name = "PAWAR CHARAN MUKUND"; section = "second_year"; rollNo = 48; isActive = true });
    m.add("24062701372051", { id = "24062701372051"; prn = "24062701372051"; name = "PAWAR SHANTANU UMESH"; section = "second_year"; rollNo = 49; isActive = true });
    m.add("24062701372052", { id = "24062701372052"; prn = "24062701372052"; name = "PISAL CHAITANYA MALOJIRAO"; section = "second_year"; rollNo = 50; isActive = true });
    m.add("24062701372053", { id = "24062701372053"; prn = "24062701372053"; name = "POTE DIGAMBAR SHASHIKANT"; section = "second_year"; rollNo = 51; isActive = true });
    m.add("24062701372054", { id = "24062701372054"; prn = "24062701372054"; name = "RANBAGLE SHANTANU VIJAY"; section = "second_year"; rollNo = 52; isActive = true });
    m.add("24062701372055", { id = "24062701372055"; prn = "24062701372055"; name = "RAWATE SAMRUDDHI SANDEEP"; section = "second_year"; rollNo = 53; isActive = true });
    m.add("24062701372056", { id = "24062701372056"; prn = "24062701372056"; name = "SABLE SUHANI SURESH"; section = "second_year"; rollNo = 54; isActive = true });
    m.add("24062701372058", { id = "24062701372058"; prn = "24062701372058"; name = "SHAIKH FAYAJ MOHAMMADPAIGAMBAR"; section = "second_year"; rollNo = 55; isActive = true });
    m.add("24062701372059", { id = "24062701372059"; prn = "24062701372059"; name = "SHAIKH MOHAMADANIS JAMAL"; section = "second_year"; rollNo = 56; isActive = true });
    m.add("24062701372060", { id = "24062701372060"; prn = "24062701372060"; name = "SHETE NIRANJAN MURLIDHAR"; section = "second_year"; rollNo = 57; isActive = true });
    m.add("24062701372061", { id = "24062701372061"; prn = "24062701372061"; name = "SHINDE SHIVANI SURESH"; section = "second_year"; rollNo = 58; isActive = true });
    m.add("24062701372062", { id = "24062701372062"; prn = "24062701372062"; name = "SHINDE SHRUTI SANTOSH"; section = "second_year"; rollNo = 59; isActive = true });
    m.add("24062701372063", { id = "24062701372063"; prn = "24062701372063"; name = "SHINGATE SRUSHTI SANTOSH"; section = "second_year"; rollNo = 60; isActive = true });
    m.add("24062701372064", { id = "24062701372064"; prn = "24062701372064"; name = "SHIRKE AMOGH AJAY"; section = "second_year"; rollNo = 61; isActive = true });
    m.add("24062701372065", { id = "24062701372065"; prn = "24062701372065"; name = "THORAT VAISHNAVI DADASAHEB"; section = "second_year"; rollNo = 62; isActive = true });
    m.add("24062701372066", { id = "24062701372066"; prn = "24062701372066"; name = "UMBARKAR PURVA JITENDRA"; section = "second_year"; rollNo = 63; isActive = true });
    m.add("24062701372067", { id = "24062701372067"; prn = "24062701372067"; name = "VANARASE SAHIL VIJAY"; section = "second_year"; rollNo = 64; isActive = true });
    m.add("24062701372068", { id = "24062701372068"; prn = "24062701372068"; name = "YADAV DHIRAJ MUGUTRAV"; section = "second_year"; rollNo = 65; isActive = true });
    m.add("24062701372069", { id = "24062701372069"; prn = "24062701372069"; name = "YADAV PRASANN ANIL"; section = "second_year"; rollNo = 66; isActive = true });
    m.add("23062701372064", { id = "23062701372064"; prn = "23062701372064"; name = "ATTAR AFZA ANSAR"; section = "second_year"; rollNo = 67; isActive = true });
    m.add("PENDING_67", { id = "PENDING_67"; prn = ""; name = "DALVI SOHAM SHRIKRISHNA"; section = "second_year"; rollNo = 68; isActive = true });
    m.add("PENDING_68", { id = "PENDING_68"; prn = ""; name = "KADAM VISHRANTI DHONDIRAM"; section = "second_year"; rollNo = 69; isActive = true });
    m.add("PENDING_69", { id = "PENDING_69"; prn = ""; name = "KALE ASMITA GANPAT"; section = "second_year"; rollNo = 70; isActive = true });
    m.add("PENDING_70", { id = "PENDING_70"; prn = ""; name = "KHARAT ASHLESHA SURYAKANT"; section = "second_year"; rollNo = 71; isActive = true });
    m.add("PENDING_71", { id = "PENDING_71"; prn = ""; name = "KULKARNI SUBODH PANKAJ"; section = "second_year"; rollNo = 72; isActive = true });
    m.add("PENDING_72", { id = "PENDING_72"; prn = ""; name = "MAHAMUNI SAI RAJARAM"; section = "second_year"; rollNo = 73; isActive = true });
    m.add("PENDING_73", { id = "PENDING_73"; prn = ""; name = "PATIL KIRAN KHANDERAV"; section = "second_year"; rollNo = 74; isActive = true });
    m.add("PENDING_74", { id = "PENDING_74"; prn = ""; name = "PAWAR SHRAVANI MOHAN"; section = "second_year"; rollNo = 75; isActive = true });
    m.add("PENDING_75", { id = "PENDING_75"; prn = ""; name = "PAWAR VAISHNAVI DNYANESHWAR"; section = "second_year"; rollNo = 76; isActive = true });
    m.add("PENDING_76", { id = "PENDING_76"; prn = ""; name = "PAWAR VINIT MARUTI"; section = "second_year"; rollNo = 77; isActive = true });
    m.add("PENDING_77", { id = "PENDING_77"; prn = ""; name = "SAVALE SHRADDHA SANJAY"; section = "second_year"; rollNo = 78; isActive = true });
    m.add("PENDING_78", { id = "PENDING_78"; prn = ""; name = "UTALE SWATI PRATAP"; section = "second_year"; rollNo = 79; isActive = true });

    // ── B.Tech students (69 students) ──
    m.add("2262701372001", { id = "2262701372001"; prn = "2262701372001"; name = "BHOSALE PRADNYA SANJAY"; section = "btech"; rollNo = 1; isActive = true });
    m.add("2262701372002", { id = "2262701372002"; prn = "2262701372002"; name = "JADHAV VAISHNAVI SHANKAR"; section = "btech"; rollNo = 2; isActive = true });
    m.add("2262701372003", { id = "2262701372003"; prn = "2262701372003"; name = "GHERADE PRAMOD MARUTI"; section = "btech"; rollNo = 3; isActive = true });
    m.add("2262701372004", { id = "2262701372004"; prn = "2262701372004"; name = "YADAV SHRADDHA SANDIP"; section = "btech"; rollNo = 4; isActive = true });
    m.add("2262701372006", { id = "2262701372006"; prn = "2262701372006"; name = "SHETPHALKAR SNEHA ASHWINKUMAR"; section = "btech"; rollNo = 5; isActive = true });
    m.add("2262701372007", { id = "2262701372007"; prn = "2262701372007"; name = "BHOSALE VARUN VINOD"; section = "btech"; rollNo = 6; isActive = true });
    m.add("2262701372008", { id = "2262701372008"; prn = "2262701372008"; name = "ZODGE SHIVAM SHRIRAM"; section = "btech"; rollNo = 7; isActive = true });
    m.add("2262701372009", { id = "2262701372009"; prn = "2262701372009"; name = "JADHAV PRATIK GORAKH"; section = "btech"; rollNo = 8; isActive = true });
    m.add("2262701372011", { id = "2262701372011"; prn = "2262701372011"; name = "AWALE REVANSIDDHI DHANANJAY"; section = "btech"; rollNo = 9; isActive = true });
    m.add("2262701372012", { id = "2262701372012"; prn = "2262701372012"; name = "SHELATKAR SANKALP SANJAY"; section = "btech"; rollNo = 10; isActive = true });
    m.add("2262701372013", { id = "2262701372013"; prn = "2262701372013"; name = "SHINDE PRACHI SACHIN"; section = "btech"; rollNo = 11; isActive = true });
    m.add("2262701372014", { id = "2262701372014"; prn = "2262701372014"; name = "SHELAR PRATHAMESH DHANANJAY"; section = "btech"; rollNo = 12; isActive = true });
    m.add("2262701372015", { id = "2262701372015"; prn = "2262701372015"; name = "DALVI SUNNY SANJU"; section = "btech"; rollNo = 13; isActive = true });
    m.add("2262701372016", { id = "2262701372016"; prn = "2262701372016"; name = "KADAM CHAITANYA PAVAN"; section = "btech"; rollNo = 14; isActive = true });
    m.add("2262701372017", { id = "2262701372017"; prn = "2262701372017"; name = "BHOSLAE OM SOMNATH"; section = "btech"; rollNo = 15; isActive = true });
    m.add("2262701372018", { id = "2262701372018"; prn = "2262701372018"; name = "GHUGARE KIRAN YASHWANT"; section = "btech"; rollNo = 16; isActive = true });
    m.add("2262701372019", { id = "2262701372019"; prn = "2262701372019"; name = "KHARAT ANUJA AJAY"; section = "btech"; rollNo = 17; isActive = true });
    m.add("2262701372020", { id = "2262701372020"; prn = "2262701372020"; name = "UPPALGE ROHIT RANGNATH"; section = "btech"; rollNo = 18; isActive = true });
    m.add("2262701372021", { id = "2262701372021"; prn = "2262701372021"; name = "GHADGE ATHARV DATTATRAY"; section = "btech"; rollNo = 19; isActive = true });
    m.add("2262701372022", { id = "2262701372022"; prn = "2262701372022"; name = "MALUSARE MADHURA SAGAR"; section = "btech"; rollNo = 20; isActive = true });
    m.add("2262701372023", { id = "2262701372023"; prn = "2262701372023"; name = "PAWAR PRATIKSHA MANOJ"; section = "btech"; rollNo = 21; isActive = true });
    m.add("2262701372024", { id = "2262701372024"; prn = "2262701372024"; name = "SALUNKHE SHRUTI SAMBHAJI"; section = "btech"; rollNo = 22; isActive = true });
    m.add("2262701372025", { id = "2262701372025"; prn = "2262701372025"; name = "MANE SAMRUDDHI KISAN"; section = "btech"; rollNo = 23; isActive = true });
    m.add("2262701372026", { id = "2262701372026"; prn = "2262701372026"; name = "SALUNKHE SANJANA NARAYAN"; section = "btech"; rollNo = 24; isActive = true });
    m.add("2262701372027", { id = "2262701372027"; prn = "2262701372027"; name = "KUMBHAR DIKSHA MANOHAR"; section = "btech"; rollNo = 25; isActive = true });
    m.add("2262701372028", { id = "2262701372028"; prn = "2262701372028"; name = "JANGAM CHINMAY YOGESH"; section = "btech"; rollNo = 26; isActive = true });
    m.add("2262701372029", { id = "2262701372029"; prn = "2262701372029"; name = "SAWANT SHREYA KRISHNAT"; section = "btech"; rollNo = 27; isActive = true });
    m.add("2262701372030", { id = "2262701372030"; prn = "2262701372030"; name = "JADHAV JANHAVI MADHUKAR"; section = "btech"; rollNo = 28; isActive = true });
    m.add("2262701372032", { id = "2262701372032"; prn = "2262701372032"; name = "SOLANKI VIVEK RAVI"; section = "btech"; rollNo = 29; isActive = true });
    m.add("2262701372033", { id = "2262701372033"; prn = "2262701372033"; name = "VEER GAYATRI JANGLIMAHARAJ"; section = "btech"; rollNo = 30; isActive = true });
    m.add("2262701372034", { id = "2262701372034"; prn = "2262701372034"; name = "PHADTARE NIKHIL SHANKAR"; section = "btech"; rollNo = 31; isActive = true });
    m.add("2262701372035", { id = "2262701372035"; prn = "2262701372035"; name = "PANDIT SHRAVANI PRAVIN"; section = "btech"; rollNo = 32; isActive = true });
    m.add("2262701372036", { id = "2262701372036"; prn = "2262701372036"; name = "DHANE SUJAL SANDIP"; section = "btech"; rollNo = 33; isActive = true });
    m.add("2262701372037", { id = "2262701372037"; prn = "2262701372037"; name = "JADHAV OM SANJAY"; section = "btech"; rollNo = 34; isActive = true });
    m.add("2262701372039", { id = "2262701372039"; prn = "2262701372039"; name = "SHINTRE BHAGYASHRI SOMESHWAR"; section = "btech"; rollNo = 35; isActive = true });
    m.add("2262701372040", { id = "2262701372040"; prn = "2262701372040"; name = "THORVE ANUJA AVINASH"; section = "btech"; rollNo = 36; isActive = true });
    m.add("2262701372041", { id = "2262701372041"; prn = "2262701372041"; name = "JADHAV PRANALI RAVINDRA"; section = "btech"; rollNo = 37; isActive = true });
    m.add("2262701372042", { id = "2262701372042"; prn = "2262701372042"; name = "NAIM NAJIR BEG"; section = "btech"; rollNo = 38; isActive = true });
    m.add("2262701372043", { id = "2262701372043"; prn = "2262701372043"; name = "DHAVALE PINAK MANDAR"; section = "btech"; rollNo = 39; isActive = true });
    m.add("2262701372044", { id = "2262701372044"; prn = "2262701372044"; name = "SHRADDHA NARAYAN BANKAR"; section = "btech"; rollNo = 40; isActive = true });
    m.add("2262701372045", { id = "2262701372045"; prn = "2262701372045"; name = "SURYAWANSHI PRERANA ABHIJEET"; section = "btech"; rollNo = 41; isActive = true });
    m.add("2262701372046", { id = "2262701372046"; prn = "2262701372046"; name = "VARMA YASH DEEPAK"; section = "btech"; rollNo = 42; isActive = true });
    m.add("2262701372047", { id = "2262701372047"; prn = "2262701372047"; name = "SANAS PURVA BALIRAM"; section = "btech"; rollNo = 43; isActive = true });
    m.add("2262701372048", { id = "2262701372048"; prn = "2262701372048"; name = "JAMBHALE VEDANT ANIL"; section = "btech"; rollNo = 44; isActive = true });
    m.add("2262701372049", { id = "2262701372049"; prn = "2262701372049"; name = "JAGADALE RAJLAXMI SAMBHAJI"; section = "btech"; rollNo = 45; isActive = true });
    m.add("2262701372050", { id = "2262701372050"; prn = "2262701372050"; name = "MAHADIK YOGESH SHANKAR"; section = "btech"; rollNo = 46; isActive = true });
    m.add("2262701372051", { id = "2262701372051"; prn = "2262701372051"; name = "KURLEKAR SHRAVANI SUNIL"; section = "btech"; rollNo = 47; isActive = true });
    m.add("2262701372052", { id = "2262701372052"; prn = "2262701372052"; name = "KARANDE SHRUTI NITIN"; section = "btech"; rollNo = 48; isActive = true });
    m.add("2262701372053", { id = "2262701372053"; prn = "2262701372053"; name = "SAKUNDE DIVYA VITTHAL"; section = "btech"; rollNo = 49; isActive = true });
    m.add("2262701372054", { id = "2262701372054"; prn = "2262701372054"; name = "SHINDE ATHARVA NITIN"; section = "btech"; rollNo = 50; isActive = true });
    m.add("2262701372055", { id = "2262701372055"; prn = "2262701372055"; name = "UDANDE ANUSHRI VISHAL"; section = "btech"; rollNo = 51; isActive = true });
    m.add("2262701372056", { id = "2262701372056"; prn = "2262701372056"; name = "KSHIRSAGAR SHREYA SANTOSH"; section = "btech"; rollNo = 52; isActive = true });
    m.add("2262701372057", { id = "2262701372057"; prn = "2262701372057"; name = "KHUTALE PARTH RAJENDRA"; section = "btech"; rollNo = 53; isActive = true });
    m.add("2262701372058", { id = "2262701372058"; prn = "2262701372058"; name = "SHINDE JAYWANT SOMNATH"; section = "btech"; rollNo = 54; isActive = true });
    m.add("2262701372059", { id = "2262701372059"; prn = "2262701372059"; name = "JADHAV SHRADDHA SATISH"; section = "btech"; rollNo = 55; isActive = true });
    m.add("2262701372060", { id = "2262701372060"; prn = "2262701372060"; name = "MALUSARE SRUSHTI UMESH"; section = "btech"; rollNo = 56; isActive = true });
    m.add("2262701372061", { id = "2262701372061"; prn = "2262701372061"; name = "JADHAV NISHANT VIJAY"; section = "btech"; rollNo = 57; isActive = true });
    m.add("2262701372062", { id = "2262701372062"; prn = "2262701372062"; name = "SHINGATE SAMRUDDHI JITENDRA"; section = "btech"; rollNo = 58; isActive = true });
    m.add("2262701372063", { id = "2262701372063"; prn = "2262701372063"; name = "GHORPADE SANSKRUTI MAHENDRA"; section = "btech"; rollNo = 59; isActive = true });
    m.add("2262701372064", { id = "2262701372064"; prn = "2262701372064"; name = "GONDHALI PRATHAMESH VINAYAK"; section = "btech"; rollNo = 60; isActive = true });
    m.add("2262701372066", { id = "2262701372066"; prn = "2262701372066"; name = "PAWAR SHRADDHA AVINASH"; section = "btech"; rollNo = 61; isActive = true });
    m.add("2262701372068", { id = "2262701372068"; prn = "2262701372068"; name = "DHANAWADE KUNAL KUBER"; section = "btech"; rollNo = 62; isActive = true });
    m.add("23062701372501", { id = "23062701372501"; prn = "23062701372501"; name = "GIRI HARSHDA HANMANT"; section = "btech"; rollNo = 63; isActive = true });
    m.add("23062701372502", { id = "23062701372502"; prn = "23062701372502"; name = "SALUNKHE SHRAVANI SURESH"; section = "btech"; rollNo = 64; isActive = true });
    m.add("23062701372503", { id = "23062701372503"; prn = "23062701372503"; name = "CHAVAN SAYALI MANSING"; section = "btech"; rollNo = 65; isActive = true });
    m.add("23062701372504", { id = "23062701372504"; prn = "23062701372504"; name = "GURAV PRUTHVIRAJ NAGANNATH"; section = "btech"; rollNo = 66; isActive = true });
    m.add("23062701372505", { id = "23062701372505"; prn = "23062701372505"; name = "JADHAV ANUJA JOTIBA"; section = "btech"; rollNo = 67; isActive = true });
    m.add("23062701372506", { id = "23062701372506"; prn = "23062701372506"; name = "SALUNKHE SAKSHI DIPAK"; section = "btech"; rollNo = 68; isActive = true });
    m.add("23062701372507", { id = "23062701372507"; prn = "23062701372507"; name = "DHANE SHRAVANI BHARAT"; section = "btech"; rollNo = 69; isActive = true });
    m.add("23062701372509", { id = "23062701372509"; prn = "23062701372509"; name = "PANDU YASIN RAJASAB"; section = "btech"; rollNo = 70; isActive = true });

    m;
  };

  /// Looks up a student by their full PRN.
  public func findByPRN(
    students : Map.Map<Text, Student>,
    prn : Text,
  ) : ?Student {
    students.get(prn);
  };

  /// Returns true if the student already marked attendance today (same calendar day UTC).
  public func isDuplicateToday(
    records : List.List<AttendanceRecord>,
    prn : Text,
    now : Int,
  ) : Bool {
    let todayStart : Int = (now / 1_000_000_000 / 86_400) * 86_400 * 1_000_000_000;
    let todayEnd : Int = todayStart + 86_400_000_000_000;
    switch (records.find(func(r : AttendanceRecord) : Bool {
      r.prn == prn and r.timestamp >= todayStart and r.timestamp < todayEnd
    })) {
      case (?_) true;
      case null false;
    };
  };

  /// Builds a new AttendanceRecord from a validated request.
  /// Builds a new AttendanceRecord from a validated request, flagging geo failures.
  public func buildRecord(
    req : MarkAttendanceRequest,
    student : Student,
    now : Int,
    nextId : Nat,
    geoFail : Bool,
  ) : AttendanceRecord {
    {
      id = nextId.toText();
      student_name = student.name;
      prn = req.prn;
      timestamp = now;
      latitude = req.latitude;
      longitude = req.longitude;
      image_url = req.image_url;
      device_info = req.device_info;
      method = "QR";
      geo_fail = geoFail;
    };
  };

  /// Builds a manual AttendanceRecord (no geo/image, faculty-entered).
  public func buildManualRecord(
    req : ManualAttendanceRequest,
    student : Student,
    now : Int,
    nextId : Nat,
  ) : AttendanceRecord {
    let ts = switch (req.timestamp_override) {
      case (?t) t;
      case null now;
    };
    {
      id = nextId.toText();
      student_name = student.name;
      prn = req.prn;
      timestamp = ts;
      latitude = 0.0;
      longitude = 0.0;
      image_url = "";
      device_info = "Manual Entry by Faculty";
      method = "Manual";
      geo_fail = false;
    };
  };

  /// Removes the attendance record with the given id. Returns true if deleted.
  public func deleteRecord(
    records : List.List<AttendanceRecord>,
    record_id : Nat,
  ) : Bool {
    let idText = record_id.toText();
    let before = records.size();
    let kept = records.filter(func(r : AttendanceRecord) : Bool { r.id != idText });
    records.clear();
    records.addAll(kept.values());
    records.size() < before;
  };

  /// Adds a manual attendance record for faculty overrides.
  public func addManualAttendance(
    students : Map.Map<Text, Student>,
    records : List.List<AttendanceRecord>,
    state : { var nextId : Nat },
    req : ManualAttendanceRequest,
  ) : MarkAttendanceResponse {
    switch (findByPRN(students, req.prn)) {
      case null {
        #invalidPRN("PRN not found: " # req.prn);
      };
      case (?student) {
        let now = Time.now();
        let record = buildManualRecord(req, student, now, state.nextId);
        records.add(record);
        state.nextId += 1;
        #ok("Manual attendance added for " # student.name # ".");
      };
    };
  };

  public func markAttendance(
    students : Map.Map<Text, Student>,
    records : List.List<AttendanceRecord>,
    state : { var nextId : Nat },
    locationCfg : { var lat : Float; var lng : Float; var radiusMeters : Float; var locationLabel : Text },
    req : MarkAttendanceRequest,
  ) : MarkAttendanceResponse {
    let now = Time.now();
    // TOTP validation — backend enforces exact formula
    if (not validateTotp(req.token, now)) {
      return #error("Invalid or expired QR token. Please scan the current QR code.");
    };
    switch (findByPRN(students, req.prn)) {
      case null {
        #invalidPRN("PRN not found: " # req.prn);
      };
      case (?student) {
        if (isDuplicateToday(records, req.prn, now)) {
          #alreadyMarked("Attendance already marked today for " # student.name # ".");
        } else {
          let dist = haversineMetres(req.latitude, req.longitude, locationCfg.lat, locationCfg.lng);
          let geoFail = dist > locationCfg.radiusMeters;
          let record = buildRecord(req, student, now, state.nextId, geoFail);
          records.add(record);
          state.nextId += 1;
          #ok("Attendance marked successfully for " # student.name # ".");
        };
      };
    };
  };

  /// Adds a new student. Returns #err if PRN already exists.
  public func addStudent(
    students : Map.Map<Text, Student>,
    req : Types.AddStudentRequest,
  ) : { #ok : Student; #err : Text } {
    if (students.get(req.prn) != null) {
      return #err("Student with PRN " # req.prn # " already exists.");
    };
    let student : Student = {
      id = req.prn;
      name = req.name;
      prn = req.prn;
      section = req.section;
      rollNo = req.rollNo;
      isActive = req.isActive;
    };
    students.add(req.prn, student);
    #ok(student);
  };

  /// Updates an existing student by id (PRN). Returns #err if not found.
  public func updateStudent(
    students : Map.Map<Text, Student>,
    id : Text,
    upd : Types.UpdateStudentRequest,
  ) : { #ok : Student; #err : Text } {
    switch (students.get(id)) {
      case null { #err("Student not found: " # id) };
      case (?s) {
        let updated : Student = {
          id = s.id;
          name = switch (upd.name) { case (?v) v; case null s.name };
          prn = switch (upd.prn) { case (?v) v; case null s.prn };
          section = switch (upd.section) { case (?v) v; case null s.section };
          rollNo = switch (upd.rollNo) { case (?v) v; case null s.rollNo };
          isActive = switch (upd.isActive) { case (?v) v; case null s.isActive };
        };
        students.add(updated.id, updated);
        #ok(updated);
      };
    };
  };

  /// Deletes a student by id. Returns #err if not found.
  public func deleteStudent(
    students : Map.Map<Text, Student>,
    id : Text,
  ) : { #ok : (); #err : Text } {
    switch (students.get(id)) {
      case null { #err("Student not found: " # id) };
      case (?_) {
        students.remove(id);
        #ok(());
      };
    };
  };

  // ── Timetable helpers ─────────────────────────────────────────────

  /// Returns the weekly slots for a given semester (1–6). Empty array if not set.
  public func getSemesterTemplate(
    templates : Map.Map<Nat, [WeeklySlot]>,
    semester : Nat,
  ) : [WeeklySlot] {
    switch (templates.get(semester)) {
      case (?slots) slots;
      case null [];
    };
  };

  /// Replaces (or inserts) the weekly template for a semester. Validates semester 1–6.
  public func updateSemesterTemplate(
    templates : Map.Map<Nat, [WeeklySlot]>,
    semester : Nat,
    slots : [WeeklySlot],
  ) : { #ok : (); #err : Text } {
    if (semester < 1 or semester > 6) {
      return #err("Semester must be between 1 and 6.");
    };
    templates.add(semester, slots);
    #ok(());
  };

  /// Returns all semester templates as an array of (semester, slots) pairs.
  public func getAllSemesterTemplates(
    templates : Map.Map<Nat, [WeeklySlot]>,
  ) : [(Nat, [WeeklySlot])] {
    templates.entries().toArray();
  };

  // ── Location helpers ──────────────────────────────────────────────

  public let defaultLocationConfig : Types.LocationConfig = {
    lat = 17.6901107;
    lng = 74.0150357;
    radiusMeters = 20.0;
    locationLabel = "Classroom";
  };
};
