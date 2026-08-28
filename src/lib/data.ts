import type {
  AuditEvent,
  AlertItem,
  Config,
  Driver,
  Employee,
  ExceptionItem,
  Incident,
  PickupPoint,
  Persona,
  RouteDef,
  Trip,
  TripPax,
  UberFact,
  UberRequest,
  ValidationFinding,
  Vehicle,
} from "./types";

/* ---------------- master data ---------------- */

export const SITE_A = { x: 750, y: 110, label: "SITE A · TECH PARK" };

export const POINTS: Record<string, PickupPoint> = Object.fromEntries(
  (
    [
      ["PP-01", "Marina Plaza", "Harbor", 30, 470, 120],
      ["PP-02", "Harbor View", "Harbor", 140, 430, 100],
      ["PP-03", "Central Station", "Midtown", 300, 330, 150],
      ["PP-04", "Garden District", "Midtown", 520, 250, 120],
      ["PP-05", "North Gate", "North", 680, 170, 100],
      ["PP-06", "University Sq", "Midtown", 230, 380, 120],
      ["PP-07", "Old Town", "Midtown", 430, 280, 100],
      ["PP-08", "Airport Rd", "East", 620, 300, 140],
      ["PP-09", "West Hills", "West", 200, 180, 120],
      ["PP-10", "East Market", "East", 480, 148, 100],
      ["PP-11", "South Depot", "South", 90, 510, 140],
      ["PP-12", "Stadium", "South", 340, 468, 120],
      ["PP-13", "Riverside", "South", 500, 372, 120],
      ["PP-14", "Tech Valley", "North", 150, 88, 120],
      ["PP-15", "Assembly Row", "North", 260, 116, 100],
      ["PP-16", "Fish Market", "Coastal", 240, 512, 120],
      ["PP-17", "Cliffside", "Coastal", 560, 430, 100],
      ["PP-18", "Cedar Park", "West", 320, 248, 120],
      ["PP-19", "Summit", "West", 540, 202, 100],
    ] as [string, string, string, number, number, number][]
  ).map(([id, name, area, x, y, geofenceM]) => [id, { id, name, area, x, y, geofenceM }])
);

export const ROUTES: RouteDef[] = [
  {
    id: "R07", name: "Harbor Line", site: "Site A", direction: "Inbound", shift: "B (08:00)", capacity: 33, color: "#45C8E0",
    stops: ["PP-01", "PP-02", "PP-06", "PP-03", "PP-07", "PP-04", "PP-05"],
    path: [[30, 470], [140, 430], [230, 380], [300, 330], [380, 300], [430, 280], [520, 250], [600, 210], [680, 170], [750, 110]],
  },
  {
    id: "R14", name: "South Gate Express", site: "Site A", direction: "Inbound", shift: "B (08:00)", capacity: 49, color: "#F5A524",
    stops: ["PP-11", "PP-12", "PP-13", "PP-08"],
    path: [[90, 510], [220, 498], [340, 468], [430, 420], [500, 372], [560, 322], [620, 300], [700, 258], [748, 180], [752, 114]],
  },
  {
    id: "R22", name: "North Corridor", site: "Site A", direction: "Inbound", shift: "B (08:00)", capacity: 49, color: "#43D98B",
    stops: ["PP-14", "PP-15", "PP-10"],
    path: [[40, 60], [150, 88], [260, 116], [370, 138], [480, 148], [580, 148], [660, 138], [750, 112]],
  },
  {
    id: "R31", name: "Coastal Loop", site: "Site A", direction: "Inbound", shift: "B (08:00)", capacity: 27, color: "#57E0C0",
    stops: ["PP-01", "PP-16", "PP-17"],
    path: [[30, 470], [120, 502], [240, 512], [360, 500], [470, 468], [560, 430], [640, 380], [700, 300], [744, 200], [752, 116]],
  },
  {
    id: "R45", name: "West Hills Shuttle", site: "Site A", direction: "Inbound", shift: "A/B", capacity: 18, color: "#7FA8FF",
    stops: ["PP-09", "PP-18", "PP-19"],
    path: [[60, 140], [140, 158], [200, 180], [260, 216], [320, 248], [390, 268], [470, 240], [540, 202], [620, 160], [700, 128], [750, 112]],
  },
];

export const DRIVERS: Driver[] = [
  { id: "DRV-01", name: "Ahmed Rashid", phone: "+971 50 221 4821", provider: "Metro Shuttle Co", license: "valid", vehicleId: "VH-12", active: true },
  { id: "DRV-02", name: "Bilal Haddad", phone: "+971 50 883 0147", provider: "Gulf Transit", license: "valid", vehicleId: "VH-08", active: true },
  { id: "DRV-03", name: "Carlos Mendes", phone: "+971 55 410 9932", provider: "Metro Shuttle Co", license: "valid", vehicleId: "VH-21", active: true },
  { id: "DRV-04", name: "Dmitri Volkov", phone: "+971 52 664 7719", provider: "Gulf Transit", license: "expiring", vehicleId: "VH-15", active: true },
  { id: "DRV-05", name: "Farhan Ali", phone: "+971 54 330 5128", provider: "CityLink", license: "valid", vehicleId: "VH-03", active: true },
  { id: "DRV-06", name: "George Okafor", phone: "+971 50 998 2246", provider: "CityLink", license: "valid", vehicleId: null, active: true },
];

export const VEHICLES: Vehicle[] = [
  { id: "VH-12", plate: "TRN-4821", type: "Coach · 33 seats", capacity: 33, provider: "Metro Shuttle Co", status: "active" },
  { id: "VH-08", plate: "TRN-2214", type: "Minibus · 18 seats", capacity: 18, provider: "Gulf Transit", status: "active" },
  { id: "VH-21", plate: "TRN-7743", type: "Coach · 49 seats", capacity: 49, provider: "Metro Shuttle Co", status: "active" },
  { id: "VH-15", plate: "TRN-5109", type: "Minibus · 14 seats", capacity: 14, provider: "Gulf Transit", status: "maintenance" },
  { id: "VH-03", plate: "TRN-9917", type: "Coach · 27 seats", capacity: 27, provider: "CityLink", status: "active" },
  { id: "VH-09", plate: "TRN-3302", type: "Minibus · 12 seats", capacity: 12, provider: "CityLink", status: "unassigned" },
];

const E: [string, string, string, string, string][] = [
  ["EMP-101", "Sara Mansour", "Finance", "PP-09", "B"],
  ["EMP-102", "Marco Ruiz", "Operations", "PP-13", "B"],
  ["EMP-103", "Priya Nair", "Engineering", "PP-16", "B"],
  ["EMP-104", "Tom Becker", "Sales", "PP-08", "B"],
  ["EMP-105", "Lena Kovacs", "HR", "PP-02", "B"],
  ["EMP-106", "Aisha Karim", "Engineering", "PP-10", "B"],
  ["EMP-107", "James Lee", "Finance", "PP-01", "B"],
  ["EMP-108", "Nadia Osei", "Legal", "PP-05", "B"],
  ["EMP-109", "Yuki Tanaka", "Engineering", "PP-06", "B"],
  ["EMP-110", "Omar Suleiman", "Operations", "PP-14", "B"],
  ["EMP-111", "Fatima Zahra", "QA", "PP-12", "B"],
  ["EMP-112", "Hana Petrova", "Design", "PP-07", "B"],
  ["EMP-113", "Diego Torres", "IT", "PP-15", "B"],
  ["EMP-114", "Mira Selim", "Marketing", "PP-17", "B"],
  ["EMP-115", "Chen Wei", "Engineering", "PP-18", "B"],
  ["EMP-116", "Amara Diallo", "Operations", "PP-19", "B"],
  ["EMP-117", "Ravi Menon", "IT", "PP-09", "A"],
  ["EMP-118", "Zofia Krol", "Design", "PP-18", "B"],
  ["EMP-119", "Sam Adeyemi", "Operations", "PP-19", "A"],
  ["EMP-120", "Ines Duarte", "QA", "PP-09", "A"],
  ["EMP-121", "Karim Bousaid", "Finance", "PP-18", "B"],
  ["EMP-122", "Elif Yilmaz", "HR", "PP-19", "A"],
  ["EMP-123", "Piotr Novak", "IT", "PP-09", "A"],
  ["EMP-124", "Grace Kim", "Marketing", "PP-18", "B"],
  ["EMP-125", "Luis Ortega", "Operations", "PP-11", "B"],
  ["EMP-126", "Maya Chen", "QA", "PP-12", "B"],
  ["EMP-127", "Andre Silva", "IT", "PP-13", "B"],
  ["EMP-128", "Sofia Rossi", "Design", "PP-08", "B"],
  ["EMP-129", "Tariq Aziz", "Operations", "PP-11", "B"],
  ["EMP-130", "Eva Lindqvist", "HR", "PP-12", "B"],
  ["EMP-131", "Nils Berg", "Engineering", "PP-14", "B"],
  ["EMP-132", "Rosa Vargas", "Finance", "PP-15", "B"],
  ["EMP-133", "Kenji Ito", "IT", "PP-10", "B"],
  ["EMP-134", "Huda Salem", "QA", "PP-16", "B"],
  ["EMP-135", "Viktor Malen", "IT", "PP-17", "B"],
  ["EMP-136", "Lina Farouk", "Design", "PP-01", "B"],
  ["EMP-137", "Oscar Reyes", "Operations", "PP-16", "B"],
  ["EMP-138", "Dana Whitfield", "HR", "PP-01", "B"],
  ["EMP-139", "Raul Costa", "Engineering", "PP-16", "B"],
  ["EMP-140", "Amal Hassan", "QA", "PP-17", "B"],
  ["EMP-141", "Jonas Weber", "IT", "PP-01", "B"],
  ["EMP-142", "Thabo Molefe", "Operations", "PP-16", "B"],
  ["EMP-143", "Mei Ling", "Finance", "PP-17", "B"],
  ["EMP-144", "Stefano Greco", "Design", "PP-01", "B"],
];

export const EMPLOYEES: Employee[] = E.map(([id, name, dept, pickupId, shift]) => ({
  id, name, dept, pickupId, shift, eligible: true,
}));

export const empById = (id: string) => EMPLOYEES.find((e) => e.id === id);
export const drvById = (id: string | null) => DRIVERS.find((d) => d.id === id) ?? null;
export const vehById = (id: string | null) => VEHICLES.find((v) => v.id === id) ?? null;
export const routeById = (id: string) => ROUTES.find((r) => r.id === id);

export const PERSONAS: Persona[] = [
  { id: "P-SARA", name: "Sara Mansour", role: "passenger", title: "Senior Accountant · EMP-101", refId: "EMP-101" },
  { id: "P-AHMED", name: "Ahmed Rashid", role: "driver", title: "Coach Driver · DRV-01 · Metro Shuttle Co", refId: "DRV-01" },
  { id: "P-LAYLA", name: "Layla Nasr", role: "ops", title: "Transportation Coordinator", refId: "OPS-02" },
  { id: "P-HASSAN", name: "Hassan Yassin", role: "manager", title: "Transportation Manager", refId: "MGR-01" },
  { id: "P-NOUR", name: "Nour Haddad", role: "finance", title: "Finance Controller", refId: "FIN-03" },
  { id: "P-RANIA", name: "Rania Fawzi", role: "admin", title: "System Administrator", refId: "ADM-01" },
];

/* ---------------- seed builder (times relative to load) ---------------- */

function paxOf(empIds: string[], status: TripPax["status"], at?: number): TripPax[] {
  return empIds.map((empId) => ({
    empId,
    pickupId: empById(empId)?.pickupId ?? "PP-01",
    status,
    at,
  }));
}

export interface Seed {
  trips: Trip[];
  incidents: Incident[];
  ubers: UberRequest[];
  audit: AuditEvent[];
  alerts: AlertItem[];
  exceptions: ExceptionItem[];
}

export function buildSeed(now: number): Seed {
  const m = (min: number) => now + min * 60000;

  const trips: Trip[] = [
    {
      id: "TR-8815", routeId: "R45", driverId: "DRV-05", vehicleId: "VH-03",
      plannedStart: m(-95), actualStart: m(-93), endedAt: m(-58), status: "completed",
      delayMin: 0, progress: 1, gps: { state: "offline", lastUpdate: m(-58), note: "Tracking ended with trip" },
      pax: paxOf(["EMP-117", "EMP-120", "EMP-123", "EMP-119", "EMP-122"], "boarded", m(-80)),
    },
    {
      id: "TR-8817", routeId: "R07", driverId: "DRV-02", vehicleId: "VH-08",
      plannedStart: m(-70), actualStart: m(-68), endedAt: m(-31), status: "completed",
      delayMin: 0, progress: 1, gps: { state: "offline", lastUpdate: m(-31), note: "Tracking ended with trip" },
      pax: [
        ...paxOf(["EMP-105", "EMP-109", "EMP-112", "EMP-108"], "boarded", m(-52)),
        ...paxOf(["EMP-107"], "no_show", m(-47)),
      ],
    },
    {
      id: "TR-8819", routeId: "R14", driverId: "DRV-01", vehicleId: "VH-12",
      plannedStart: m(-35), actualStart: m(-33), endedAt: null, status: "in_progress",
      delayMin: 27, progress: 0.52, gps: { state: "stale", lastUpdate: m(-6), note: "No fix since Harbor junction" },
      pax: [
        ...paxOf(["EMP-125", "EMP-129", "EMP-111", "EMP-126", "EMP-130", "EMP-127", "EMP-128"], "boarded", m(-20)),
        ...paxOf(["EMP-102"], "pending"),
        ...paxOf(["EMP-104"], "pending"),
      ],
    },
    {
      id: "TR-8821", routeId: "R22", driverId: "DRV-03", vehicleId: "VH-21",
      plannedStart: m(-15), actualStart: m(-14), endedAt: null, status: "in_progress",
      delayMin: 0, progress: 0.34, gps: { state: "live", lastUpdate: now - 8000 },
      pax: [
        ...paxOf(["EMP-110", "EMP-131"], "boarded", m(-11)),
        ...paxOf(["EMP-113", "EMP-132", "EMP-106", "EMP-133"], "pending"),
      ],
    },
    {
      id: "TR-8822", routeId: "R31", driverId: "DRV-04", vehicleId: "VH-15",
      plannedStart: m(-20), actualStart: null, endedAt: null, status: "incident",
      delayMin: 0, progress: 0, gps: { state: "unavailable", lastUpdate: m(-20), note: "Vehicle breakdown at depot — trip not started" },
      pax: paxOf(["EMP-103", "EMP-114", "EMP-134", "EMP-135", "EMP-136", "EMP-137"], "pending"),
    },
    {
      id: "TR-8824", routeId: "R45", driverId: "DRV-05", vehicleId: "VH-03",
      plannedStart: m(18), actualStart: null, endedAt: null, status: "scheduled",
      delayMin: 0, progress: 0, gps: { state: "offline", lastUpdate: m(-58), note: "Pre-trip — tracking starts at departure" },
      pax: paxOf(["EMP-101", "EMP-115", "EMP-116", "EMP-118", "EMP-121", "EMP-124"], "pending"),
    },
    {
      id: "TR-8831", routeId: "R31", driverId: "DRV-04", vehicleId: "VH-09",
      plannedStart: m(40), actualStart: null, endedAt: null, status: "scheduled",
      delayMin: 0, progress: 0, gps: { state: "offline", lastUpdate: m(-20), note: "Replacement service — pre-trip" },
      pax: paxOf(
        ["EMP-103", "EMP-114", "EMP-134", "EMP-135", "EMP-136", "EMP-137", "EMP-138", "EMP-139", "EMP-140", "EMP-141", "EMP-142", "EMP-143", "EMP-144"],
        "pending"
      ),
    },
    {
      id: "TR-8826", routeId: "R07", driverId: "DRV-01", vehicleId: "VH-12",
      plannedStart: m(85), actualStart: null, endedAt: null, status: "scheduled",
      delayMin: 0, progress: 0, gps: { state: "offline", lastUpdate: m(-6), note: "Pre-trip — tracking starts at departure" },
      pax: paxOf(["EMP-107", "EMP-105", "EMP-109", "EMP-112", "EMP-108"], "pending"),
    },
    {
      id: "TR-8830", routeId: "R22", driverId: null, vehicleId: "VH-21",
      plannedStart: m(100), actualStart: null, endedAt: null, status: "scheduled",
      delayMin: 0, progress: 0, gps: { state: "offline", lastUpdate: m(-14), note: "Pre-trip" },
      pax: paxOf(["EMP-110", "EMP-113", "EMP-131", "EMP-132"], "pending"),
    },
  ];

  const incidents: Incident[] = [
    {
      id: "INC-127", severity: "P4", category: "Vehicle problem", status: "closed", tripId: "TR-8817",
      reporter: "Bilal Haddad", reporterRole: "driver", desc: "AC not cooling in rear cabin of VH-08.",
      createdAt: m(-190), ackAt: m(-188), owner: "Layla Nasr", rootCause: "Vehicle", affected: 0, escalated: false,
    },
    {
      id: "INC-128", severity: "P1", category: "Accident", status: "closed", tripId: null,
      reporter: "System", reporterRole: "ops", desc: "Minor collision at North Gate roundabout (yesterday) — no injuries. P1 protocol executed, emergency contacts notified at +40s.",
      createdAt: now - 26 * 3600000, ackAt: now - 26 * 3600000 + 90000, owner: "Hassan Yassin", rootCause: "External event", affected: 2, escalated: true,
    },
    {
      id: "INC-129", severity: "P2", category: "Vehicle breakdown", status: "investigating", tripId: "TR-8822",
      reporter: "Dmitri Volkov", reporterRole: "driver", desc: "VH-15 engine fault at South Depot. TR-8822 cannot depart. Replacement VH-09 (12 seats) being prepared — capacity shortfall flagged.",
      createdAt: m(-18), ackAt: m(-16), owner: "Layla Nasr", rootCause: null, affected: 6, escalated: false,
    },
    {
      id: "INC-130", severity: "P3", category: "GPS / telemetry", status: "created", tripId: "TR-8819",
      reporter: "System", reporterRole: "ops", desc: "No GPS fix from TR-8819 for 6 minutes. Graduated alert level 2 — operator notified at 10-minute mark per policy.",
      createdAt: m(-4), ackAt: null, owner: null, rootCause: null, affected: 10, escalated: false,
    },
    {
      id: "INC-131", severity: "P3", category: "Missed pickup", status: "created", tripId: "TR-8819",
      reporter: "Marco Ruiz", reporterRole: "passenger", desc: "Bus did not arrive at Riverside (PP-13) at scheduled time. Passenger was confirmed and waiting inside geofence.",
      createdAt: m(-2), ackAt: null, owner: null, rootCause: null, affected: 1, escalated: false,
    },
  ];

  const ubers: UberRequest[] = [
    {
      id: "UB-2026-004255", empId: "EMP-108", tripId: "TR-8817", reasonKey: "delay",
      reason: "Significant delay at North Gate pickup", status: "paid", createdAt: m(-160),
      decision: "manual", rule: "POL-07 · Supervisor approval", facts: [], limit: 20,
      approver: "Hassan Yassin", approvedAt: m(-156), requestedAmount: 19,
      receipt: { amount: 18.2, date: "today", time: "earlier shift", ref: "UBX-99120", fileName: "receipt_nadia_18.20.pdf", submittedAt: m(-150) },
      validation: "valid", financeNote: "Within limit — reimbursed", slaDue: null,
    },
    {
      id: "UB-2026-004268", empId: "EMP-107", tripId: "TR-8817", reasonKey: "overslept",
      reason: "Missed pickup — personal", status: "rejected", createdAt: m(-55),
      decision: "reject", rule: "POL-12 · Passenger-responsibility exclusion", facts: [], limit: null,
      approver: "System (policy rule)", approvedAt: m(-55), requestedAmount: null,
      receipt: null, validation: null, financeNote: "No reimbursement — passenger no-show, bus departed on time", slaDue: null,
    },
    {
      id: "UB-2026-004270", empId: "EMP-105", tripId: "TR-8817", reasonKey: "no_request",
      reason: "Uber taken without prior approval", status: "unauthorized", createdAt: m(-50),
      decision: "reject", rule: "POL-01 · Prior approval required", facts: [], limit: null,
      approver: null, approvedAt: null, requestedAmount: 22.5,
      receipt: { amount: 22.5, date: "today", time: "morning", ref: "UBX-77145", fileName: "uber_lena_22.50.jpg", submittedAt: m(-48) },
      validation: "invalid", financeNote: "No linked approval — exception review by manager + finance", slaDue: null,
    },
    {
      id: "UB-2026-004279", empId: "EMP-102", tripId: "TR-8819", reasonKey: "missed_pickup",
      reason: "Missed pickup at Riverside (PP-13)", status: "receipt_submitted", createdAt: m(-9),
      decision: "auto", rule: "POL-06 · Delay ≥ orange + missed-pickup incident confirmed", facts: [],
      limit: 25, approver: "System (auto-rule POL-06)", approvedAt: m(-9), requestedAmount: 25,
      receipt: { amount: 31.4, date: "today", time: "current", ref: "UBX-10422", fileName: "uber_marco_31.40.jpg", submittedAt: m(-3) },
      validation: "exception", financeNote: "Receipt exceeds approved limit by $6.40 — finance decision required", slaDue: null,
    },
    {
      id: "UB-2026-004281", empId: "EMP-103", tripId: "TR-8822", reasonKey: "breakdown",
      reason: "Vehicle breakdown — trip cannot depart (INC-129)", status: "receipt_pending", createdAt: m(-14),
      decision: "auto", rule: "POL-03 · Confirmed vehicle breakdown", facts: [],
      limit: 30, approver: "System (auto-rule POL-03)", approvedAt: m(-14), requestedAmount: 28,
      receipt: null, validation: null, financeNote: null, slaDue: null,
    },
    {
      id: "UB-2026-004283", empId: "EMP-104", tripId: "TR-8819", reasonKey: "delay",
      reason: "Bus 27 minutes late at Airport Rd (PP-08)", status: "pending_approval", createdAt: m(-5),
      decision: "manual", rule: "POL-07 · Delay ≥ orange — supervisor approval required", facts: [],
      limit: null, approver: null, approvedAt: null, requestedAmount: 24,
      receipt: null, validation: null, financeNote: null, slaDue: m(5),
    },
  ];

  const audit: AuditEvent[] = [
    { id: "AUD-9001", ts: m(-93), actor: "Farhan Ali", role: "driver", action: "START_TRIP", object: "TR-8815 · R45", prev: "scheduled", next: "started" },
    { id: "AUD-9002", ts: m(-68), actor: "Bilal Haddad", role: "driver", action: "START_TRIP", object: "TR-8817 · R07", prev: "scheduled", next: "started" },
    { id: "AUD-9003", ts: m(-58), actor: "Farhan Ali", role: "driver", action: "END_TRIP", object: "TR-8815", prev: "in_progress", next: "completed · 5 boarded / 0 no-show" },
    { id: "AUD-9004", ts: m(-55), actor: "System", role: "system", action: "UBER_REJECTED", object: "UB-2026-004268", prev: "requested", next: "rejected · POL-12" },
    { id: "AUD-9005", ts: m(-50), actor: "System", role: "system", action: "UBER_UNAUTHORIZED", object: "UB-2026-004270 · Lena Kovacs", prev: "—", next: "flagged for exception review" },
    { id: "AUD-9006", ts: m(-33), actor: "Ahmed Rashid", role: "driver", action: "START_TRIP", object: "TR-8819 · R14 · VH-12", prev: "scheduled", next: "started · GPS 25.2021,55.2694" },
    { id: "AUD-9007", ts: m(-31), actor: "Bilal Haddad", role: "driver", action: "END_TRIP", object: "TR-8817", prev: "in_progress", next: "completed · 4 boarded / 1 no-show" },
    { id: "AUD-9008", ts: m(-27), actor: "System", role: "system", action: "GPS_PING", object: "TR-8819", prev: "—", next: "fix 25.1871,55.2398 · accuracy 9m" },
    { id: "AUD-9009", ts: m(-18), actor: "Dmitri Volkov", role: "driver", action: "INCIDENT_CREATED", object: "INC-129 · P2 breakdown", prev: "—", next: "created · VH-15 South Depot" },
    { id: "AUD-9010", ts: m(-16), actor: "Layla Nasr", role: "ops", action: "INCIDENT_ACK", object: "INC-129", prev: "created", next: "acknowledged (2m 04s)" },
    { id: "AUD-9011", ts: m(-14), actor: "System", role: "system", action: "UBER_AUTO_APPROVED", object: "UB-2026-004281 · Priya Nair", prev: "requested", next: "approved · POL-03 · limit $30.00" },
    { id: "AUD-9012", ts: m(-14), actor: "Carlos Mendes", role: "driver", action: "START_TRIP", object: "TR-8821 · R22 · VH-21", prev: "scheduled", next: "started · GPS 25.2510,55.3102" },
    { id: "AUD-9013", ts: m(-9), actor: "System", role: "system", action: "UBER_AUTO_APPROVED", object: "UB-2026-004279 · Marco Ruiz", prev: "requested", next: "approved · POL-06 · limit $25.00" },
    { id: "AUD-9014", ts: m(-6), actor: "System", role: "system", action: "GPS_STALE", object: "TR-8819", prev: "live", next: "stale · INC-130 created (level 2)" },
    { id: "AUD-9015", ts: m(-2), actor: "Marco Ruiz", role: "passenger", action: "MISSED_PICKUP", object: "INC-131 · PP-13 Riverside", prev: "—", next: "case created · awaiting ack" },
    { id: "AUD-9016", ts: m(-3), actor: "Marco Ruiz", role: "passenger", action: "RECEIPT_SUBMITTED", object: "UB-2026-004279", prev: "receipt_pending", next: "$31.40 · exception over $25.00 limit" },
  ];

  const alerts: AlertItem[] = [
    { id: "AL-11", ts: m(-2), sev: "warn", text: "P3 INC-131 unacknowledged — missed pickup at Riverside (SLA 15m)", audience: ["ops", "manager"], read: false },
    { id: "AL-10", ts: m(-3), sev: "warn", text: "Receipt exception — UB-2026-004279 exceeds limit by $6.40", audience: ["finance", "manager"], read: false },
    { id: "AL-09", ts: m(-5), sev: "warn", text: "Uber approval pending — UB-2026-004283 (Tom Becker), SLA 10m", audience: ["ops", "manager"], read: false },
    { id: "AL-08", ts: m(-6), sev: "critical", text: "GPS stale — TR-8819 (R14) no fix for 6 min · level 2", audience: ["ops", "manager"], read: false },
    { id: "AL-07", ts: m(-9), sev: "warn", text: "Delay +27m — TR-8819 exceeded orange threshold (20m)", audience: ["ops", "manager"], read: true },
    { id: "AL-06", ts: m(-14), sev: "info", text: "Auto-approval applied — UB-2026-004281 (breakdown · POL-03)", audience: ["ops", "finance"], read: true },
    { id: "AL-05", ts: m(-18), sev: "critical", text: "P2 INC-129 — vehicle breakdown VH-15 at South Depot", audience: ["ops", "manager"], read: true },
    { id: "AL-04", ts: m(-50), sev: "warn", text: "Unauthorized Uber flagged — Lena Kovacs ($22.50)", audience: ["finance", "manager", "ops"], read: true },
  ];

  const exceptions: ExceptionItem[] = [
    { id: "EX-91", ts: m(-18), type: "Vehicle unavailable", ref: "VH-15 / TR-8822", owner: "Transportation Ops", status: "open", slaMin: 30 },
    { id: "EX-92", ts: m(-6), type: "GPS unavailable", ref: "TR-8819 · R14", owner: "Transportation Ops", status: "monitoring", slaMin: 15 },
    { id: "EX-93", ts: m(-50), type: "Uber unauthorized", ref: "UB-2026-004270", owner: "Finance", status: "open", slaMin: 480 },
    { id: "EX-94", ts: m(-3), type: "Receipt over limit", ref: "UB-2026-004279", owner: "Finance", status: "open", slaMin: 120 },
    { id: "EX-95", ts: m(-12), type: "Route over capacity", ref: "TR-8831 · 13 pax / 12 seats", owner: "Transportation Ops", status: "open", slaMin: 45 },
    { id: "EX-96", ts: m(-12), type: "Driver not assigned", ref: "TR-8830 · R22", owner: "Transportation Ops", status: "open", slaMin: 60 },
    { id: "EX-97", ts: m(-2), type: "Missed pickup", ref: "INC-131 · PP-13", owner: "Transportation Ops", status: "open", slaMin: 15 },
  ];

  return { trips, incidents, ubers, audit, alerts, exceptions };
}

export const DEFAULT_CONFIG: Config = {
  delayYellow: 10,
  delayOrange: 20,
  delayRed: 30,
  uberMaxPerTrip: 35,
  uberDaily: 60,
  uberMonthly: 400,
  slaNormal: 10,
  slaUrgent: 2,
  p1Ack: 2,
  p2Ack: 5,
  p3Ack: 15,
  gpsInterval: 30,
  gpsRetention: 30,
  cutoffMin: 60,
  receiptWindowDays: 3,
  autoOnBreakdown: true,
  autoOnCancel: true,
  autoOnRedDelay: true,
};

export const VALIDATION_FINDINGS: ValidationFinding[] = [
  { sev: "crit", code: "SCH-01", text: "TR-8831 (R31 replacement) over capacity — 13 pax assigned / 12 seats on VH-09" },
  { sev: "crit", code: "SCH-02", text: "TR-8830 (R22) has no driver assigned — planned departure in 100 min" },
  { sev: "warn", code: "SCH-03", text: "VH-15 is in maintenance but still referenced by TR-8822 manifest" },
  { sev: "warn", code: "SCH-04", text: "DRV-04 (Dmitri Volkov) license expires in 12 days — renewal required" },
];

/* ---------------- analytics fixtures (rolling 30/180 days) ---------------- */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const FLEET_COST_K = [41.2, 40.1, 42.8, 41.5, 43.9, 43.1];
export const UBER_COST_K = [2.1, 2.6, 3.4, 4.8, 5.9, 6.4];
export const APPROVAL_TREND = [71, 74, 76, 80, 79, 78];
export const INCIDENT_TREND = [4, 6, 5, 8, 7, 5];
export const COST_PER_PAX = [3.1, 3.0, 3.2, 3.3, 3.4, 3.4];
export const UBER_BY_ROUTE = [
  { label: "R14 · South Gate", value: 2410 },
  { label: "R31 · Coastal", value: 1835 },
  { label: "R07 · Harbor", value: 1120 },
  { label: "R22 · North", value: 705 },
  { label: "R45 · West Hills", value: 390 },
];
export const UBER_BY_EMPLOYEE = [
  { label: "Marco Ruiz", value: 342 },
  { label: "Tom Becker", value: 291 },
  { label: "Priya Nair", value: 262 },
  { label: "Lena Kovacs", value: 245 },
  { label: "James Lee", value: 181 },
];
export const PUNCTUAL_BY_ROUTE = [
  { label: "R22 · North Corridor", value: 96 },
  { label: "R07 · Harbor Line", value: 93 },
  { label: "R45 · West Hills", value: 91 },
  { label: "R14 · South Gate", value: 82 },
  { label: "R31 · Coastal Loop", value: 77 },
];
export const DRIVER_PUNCT = [
  { id: "DRV-03", name: "Carlos Mendes", onTime: 98, trips: 118, avgDelay: 1.9 },
  { id: "DRV-02", name: "Bilal Haddad", onTime: 96, trips: 112, avgDelay: 2.6 },
  { id: "DRV-05", name: "Farhan Ali", onTime: 95, trips: 96, avgDelay: 3.1 },
  { id: "DRV-01", name: "Ahmed Rashid", onTime: 88, trips: 121, avgDelay: 5.8 },
  { id: "DRV-04", name: "Dmitri Volkov", onTime: 81, trips: 84, avgDelay: 8.2 },
];
export const UTILIZATION = [
  { label: "R14", value: 92 },
  { label: "R22", value: 88 },
  { label: "R07", value: 84 },
  { label: "R31", value: 79 },
  { label: "R45", value: 61 },
];
export const SEV_MIX = [
  { label: "P1 Critical", value: 1, color: "#FF5C5C" },
  { label: "P2 Major", value: 3, color: "#FF8A3D" },
  { label: "P3 Operational", value: 11, color: "#FFD84D" },
  { label: "P4 Info", value: 6, color: "#5D7189" },
];
export const RESOLUTION_HRS = [
  { label: "P1", value: 0.5 },
  { label: "P2", value: 3.2 },
  { label: "P3", value: 6.8 },
  { label: "P4", value: 18 },
];
export const ROOT_CAUSES = [
  { label: "Vehicle", value: 7 },
  { label: "Traffic", value: 5 },
  { label: "Driver", value: 3 },
  { label: "Scheduling", value: 2 },
  { label: "Route design", value: 2 },
  { label: "External event", value: 2 },
];
export const PEAK_SLOTS = ["05:30", "06:30", "07:30", "08:30", "16:30", "17:30"];
export const PEAK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const PEAK_HEAT = [
  [0.55, 0.9, 1.0, 0.7, 0.5, 0.85],
  [0.5, 0.85, 0.98, 0.66, 0.48, 0.8],
  [0.52, 0.88, 0.95, 0.7, 0.55, 0.82],
  [0.5, 0.9, 0.97, 0.68, 0.5, 0.86],
  [0.45, 0.8, 0.92, 0.62, 0.6, 0.9],
  [0.2, 0.3, 0.35, 0.25, 0.15, 0.2],
  [0.1, 0.15, 0.2, 0.12, 0.1, 0.14],
];
export const KPI_30D = {
  onTimeDepart: 91.2,
  onTimePickup: 87.5,
  avgDelay: 6.4,
  missedPickups: 1.8,
  noShowRate: 4.2,
  cancelRate: 6.1,
  completion: 97.8,
  gpsAvail: 96.4,
  costPerPax: 3.4,
  costPerTrip: 212,
  incidentRate: 0.42,
  uberApprovalRate: 78,
  unauthorizedCount: 3,
  avgTripMin: 42,
};

/* ---------------- reference tables ---------------- */

export const INCIDENT_CATEGORIES = [
  "Accident", "Vehicle breakdown", "Traffic", "Driver issue", "Passenger issue",
  "Medical emergency", "Security issue", "Vehicle problem", "Route obstruction",
  "GPS / telemetry", "Missed pickup", "Other",
];

export const ROOT_CAUSE_OPTIONS = [
  "Driver", "Vehicle", "Route design", "Traffic", "Scheduling",
  "Passenger", "System", "Provider", "External event",
];

export const UBER_REASONS: { key: string; label: string }[] = [
  { key: "breakdown", label: "Vehicle breakdown / trip cancelled by operations" },
  { key: "missed_pickup", label: "Missed pickup — bus did not arrive" },
  { key: "delay", label: "Significant delay at my pickup point" },
  { key: "no_transport", label: "No transportation available for my shift" },
  { key: "medical", label: "Medical / personal emergency" },
  { key: "overslept", label: "I missed my pickup (personal reason)" },
  { key: "preference", label: "I preferred another transportation option" },
];

export const MISSED_REASONS = [
  "Driver did not arrive",
  "Driver arrived early",
  "Driver arrived late",
  "Wrong pickup point",
  "Could not locate driver",
  "Other",
];

export const STATUS_FLOWS: { entity: string; flow: string }[] = [
  { entity: "Trip", flow: "Scheduled → Driver Assigned → Started → In Progress → Completed | Cancelled | Incident" },
  { entity: "Passenger", flow: "Pending → Confirmed → Boarded · or Pending → Cancelled · or Confirmed → No-show" },
  { entity: "Incident", flow: "Created → Acknowledged → Assigned → Investigating → Action Taken → Resolved → Closed" },
  { entity: "Uber", flow: "Requested → Eligibility Checked → Pending Approval → Approved/Rejected → Trip Completed → Receipt Pending → Receipt Submitted → Validated → Finance Approved → Paid/Closed" },
];

export const ENTITIES = [
  "Users", "Employees", "Drivers", "Vehicles", "Routes", "Pickup Points", "Route Stops",
  "Schedules", "Trips", "Trip Passengers", "Passenger Confirmations", "Boarding Events",
  "GPS Events", "Incidents", "Incident Actions", "Uber Requests", "Uber Approvals",
  "Uber Receipts", "Finance Transactions", "Notifications", "Audit Logs", "System Configuration",
];

export const PERMISSION_MATRIX: { cap: string; access: Record<string, string> }[] = [
  { cap: "View own trips & manifest", access: { passenger: "full", driver: "full", ops: "full", manager: "full", finance: "none", admin: "full" } },
  { cap: "Confirm / cancel own transportation", access: { passenger: "full", driver: "none", ops: "limited", manager: "limited", finance: "none", admin: "none" } },
  { cap: "Start / end trip", access: { passenger: "none", driver: "full", ops: "limited", manager: "limited", finance: "none", admin: "none" } },
  { cap: "Mark boarded / no-show", access: { passenger: "none", driver: "full", ops: "limited", manager: "none", finance: "none", admin: "none" } },
  { cap: "Live GPS (operational view)", access: { passenger: "none", driver: "none", ops: "full", manager: "full", finance: "none", admin: "view" } },
  { cap: "Historical driver movements", access: { passenger: "none", driver: "none", ops: "none", manager: "view", finance: "none", admin: "view" } },
  { cap: "Create / edit routes & schedules", access: { passenger: "none", driver: "none", ops: "full", manager: "full", finance: "none", admin: "full" } },
  { cap: "Assign drivers & vehicles", access: { passenger: "none", driver: "none", ops: "full", manager: "full", finance: "none", admin: "none" } },
  { cap: "Approve / reject Uber requests", access: { passenger: "none", driver: "none", ops: "full", manager: "full", finance: "none", admin: "none" } },
  { cap: "Configure policy & thresholds", access: { passenger: "none", driver: "none", ops: "none", manager: "full", finance: "none", admin: "full" } },
  { cap: "Validate receipts & release payment", access: { passenger: "none", driver: "none", ops: "none", manager: "view", finance: "full", admin: "none" } },
  { cap: "Cost & performance analytics", access: { passenger: "none", driver: "none", ops: "view", manager: "full", finance: "full", admin: "view" } },
  { cap: "Record incidents", access: { passenger: "full", driver: "full", ops: "full", manager: "full", finance: "none", admin: "none" } },
  { cap: "View audit logs", access: { passenger: "none", driver: "none", ops: "none", manager: "view", finance: "view", admin: "full" } },
  { cap: "Manage users, roles & permissions", access: { passenger: "none", driver: "none", ops: "none", manager: "none", finance: "none", admin: "full" } },
];

/* ---------------- eligibility + validation engines ---------------- */

export function evaluateUber(args: {
  trip: Trip | null;
  tripIncidents: Incident[];
  cfg: Config;
  confirmed: boolean;
  reasonKey: string;
}): { decision: "auto" | "manual" | "reject"; rule: string; facts: UberFact[] } {
  const { trip, tripIncidents, cfg, confirmed, reasonKey } = args;
  const delay = trip?.delayMin ?? 0;
  const boarded = trip ? trip.pax.filter((p) => p.status === "boarded").length : 0;
  const total = trip?.pax.length ?? 0;
  const breakdown = tripIncidents.some((i) => i.category === "Vehicle breakdown" || i.severity === "P2" || i.severity === "P1");
  const missed = tripIncidents.some((i) => i.category === "Missed pickup");
  const gpsStale = trip ? trip.gps.state !== "live" : true;

  const facts: UberFact[] = [
    {
      label: "Transportation was scheduled",
      ok: !!trip,
      detail: trip ? `${trip.id} · ${trip.routeId} · planned ${new Date(trip.plannedStart).toTimeString().slice(0, 5)}` : "No assignment found",
    },
    {
      label: "Driver started the trip",
      ok: !!trip?.actualStart,
      detail: trip?.actualStart ? `Started ${new Date(trip.actualStart).toTimeString().slice(0, 5)}` : "Trip not started",
    },
    {
      label: "Driver GPS available",
      ok: !gpsStale,
      detail: trip ? `${trip.gps.state.toUpperCase()}${trip.gps.state === "stale" ? " · last fix " + new Date(trip.gps.lastUpdate).toTimeString().slice(0, 5) : ""}` : "—",
    },
    {
      label: `Delay vs thresholds (yellow ${cfg.delayYellow}m · orange ${cfg.delayOrange}m · red ${cfg.delayRed}m)`,
      ok: delay >= cfg.delayOrange,
      detail: trip ? (delay > 0 ? `+${delay}m ${delay >= cfg.delayRed ? "≥ red" : delay >= cfg.delayOrange ? "≥ orange" : "< orange"}` : "On schedule") : "—",
    },
    {
      label: "Passenger confirmation recorded",
      ok: confirmed,
      detail: confirmed ? "Confirmed before cutoff" : "No confirmation stored",
    },
    {
      label: "Other passengers boarded",
      ok: boarded > 0,
      detail: trip ? `${boarded} of ${total} boarded` : "—",
    },
    {
      label: "Linked operational incident",
      ok: tripIncidents.length > 0,
      detail: tripIncidents.length ? tripIncidents.map((i) => `${i.id} ${i.category}`).join(" · ") : "None on this trip",
    },
    {
      label: "Geofence arrival at assigned pickup",
      ok: !missed && !!trip?.actualStart && delay < cfg.delayOrange,
      detail: missed ? "No arrival recorded at passenger pickup" : trip?.actualStart ? "Within tolerance" : "Not evaluated",
    },
  ];

  if (reasonKey === "overslept" || reasonKey === "preference") {
    return { decision: "reject", rule: "POL-12 · Passenger-responsibility exclusion", facts };
  }
  if (reasonKey === "medical") {
    return { decision: "manual", rule: "POL-10 · Emergency exception — expedited manager review", facts };
  }
  if (reasonKey === "breakdown" || reasonKey === "no_transport") {
    if ((breakdown || !trip || trip.status === "cancelled" || trip.status === "incident") && (cfg.autoOnBreakdown || cfg.autoOnCancel)) {
      return { decision: "auto", rule: breakdown ? "POL-03 · Confirmed vehicle breakdown / major failure" : "POL-02 · No transportation available", facts };
    }
    return { decision: "manual", rule: "POL-04 · Claimed failure not confirmed by telemetry — manager review", facts };
  }
  if (reasonKey === "missed_pickup") {
    if (delay >= cfg.delayOrange && (missed || gpsStale || boarded > 0)) {
      return { decision: "auto", rule: "POL-06 · Delay ≥ orange + missed-pickup evidence confirmed", facts };
    }
    return { decision: "manual", rule: "POL-07 · Missed-pickup claim — supervisor approval required", facts };
  }
  // delay
  if (delay >= cfg.delayRed && cfg.autoOnRedDelay) {
    return { decision: "auto", rule: `POL-05 · Delay ≥ red threshold (${cfg.delayRed}m)`, facts };
  }
  if (delay >= cfg.delayOrange) {
    return { decision: "manual", rule: `POL-07 · Delay ≥ orange threshold (${cfg.delayOrange}m) — supervisor approval`, facts };
  }
  return { decision: "manual", rule: "POL-09 · Below automatic thresholds — default manager review", facts };
}

export function validateReceiptAmount(
  amount: number,
  limit: number | null,
  approved: boolean
): "valid" | "exception" | "invalid" {
  if (!approved || limit === null) return "invalid";
  if (amount > limit) return "exception";
  return "valid";
}
