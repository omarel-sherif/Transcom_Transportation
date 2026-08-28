export type Role = "passenger" | "driver" | "ops" | "manager" | "finance" | "admin";

export interface Persona {
  id: string;
  name: string;
  role: Role;
  title: string;
  refId: string;
}

export interface PickupPoint {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  geofenceM: number;
}

export interface RouteDef {
  id: string;
  name: string;
  site: string;
  direction: string;
  shift: string;
  stops: string[];
  path: [number, number][];
  color: string;
  capacity: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  provider: string;
  license: "valid" | "expiring" | "expired";
  vehicleId: string | null;
  active: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  type: string;
  capacity: number;
  provider: string;
  status: "active" | "maintenance" | "unassigned";
}

export interface Employee {
  id: string;
  name: string;
  dept: string;
  pickupId: string;
  shift: string;
  eligible: boolean;
}

export type PaxStatus = "pending" | "confirmed" | "cancelled" | "no_show" | "boarded";

export interface TripPax {
  empId: string;
  pickupId: string;
  status: PaxStatus;
  at?: number;
}

export type TripStatus = "scheduled" | "started" | "in_progress" | "completed" | "cancelled" | "incident";
export type GpsState = "live" | "stale" | "unavailable" | "offline";

export interface Trip {
  id: string;
  routeId: string;
  driverId: string | null;
  vehicleId: string | null;
  plannedStart: number;
  actualStart: number | null;
  endedAt: number | null;
  status: TripStatus;
  delayMin: number;
  progress: number;
  gps: { state: GpsState; lastUpdate: number; note?: string };
  pax: TripPax[];
}

export type Severity = "P1" | "P2" | "P3" | "P4";
export type IncidentStatus =
  | "created"
  | "acknowledged"
  | "assigned"
  | "investigating"
  | "action_taken"
  | "resolved"
  | "closed";

export interface Incident {
  id: string;
  severity: Severity;
  category: string;
  status: IncidentStatus;
  tripId: string | null;
  reporter: string;
  reporterRole: Role;
  desc: string;
  createdAt: number;
  ackAt: number | null;
  owner: string | null;
  rootCause: string | null;
  affected: number;
  escalated: boolean;
}

export type UberDecision = "auto" | "manual" | "reject";
export type UberStatus =
  | "requested"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "receipt_pending"
  | "receipt_submitted"
  | "validated"
  | "finance_approved"
  | "paid"
  | "unauthorized"
  | "closed";

export interface UberReceipt {
  amount: number;
  date: string;
  time: string;
  ref: string;
  fileName: string;
  submittedAt: number;
}

export interface UberFact {
  label: string;
  ok: boolean;
  detail: string;
}

export interface UberRequest {
  id: string;
  empId: string;
  tripId: string | null;
  reasonKey: string;
  reason: string;
  status: UberStatus;
  createdAt: number;
  decision: UberDecision;
  rule: string;
  facts: UberFact[];
  limit: number | null;
  approver: string | null;
  approvedAt: number | null;
  requestedAmount: number | null;
  receipt: UberReceipt | null;
  validation: "valid" | "exception" | "invalid" | null;
  financeNote: string | null;
  slaDue: number | null;
}

export interface AuditEvent {
  id: string;
  ts: number;
  actor: string;
  role: string;
  action: string;
  object: string;
  prev: string;
  next: string;
}

export interface AlertItem {
  id: string;
  ts: number;
  sev: "info" | "warn" | "critical";
  text: string;
  audience: Role[];
  read: boolean;
}

export interface ExceptionItem {
  id: string;
  ts: number;
  type: string;
  ref: string;
  owner: string;
  status: "open" | "monitoring" | "resolved";
  slaMin: number;
}

export interface ToastMsg {
  id: number;
  text: string;
  tone: "ok" | "warn" | "err" | "info";
}

export interface Config {
  delayYellow: number;
  delayOrange: number;
  delayRed: number;
  uberMaxPerTrip: number;
  uberDaily: number;
  uberMonthly: number;
  slaNormal: number;
  slaUrgent: number;
  p1Ack: number;
  p2Ack: number;
  p3Ack: number;
  gpsInterval: number;
  gpsRetention: number;
  cutoffMin: number;
  receiptWindowDays: number;
  autoOnBreakdown: boolean;
  autoOnCancel: boolean;
  autoOnRedDelay: boolean;
}

export interface ValidationFinding {
  sev: "warn" | "crit";
  code: string;
  text: string;
}
