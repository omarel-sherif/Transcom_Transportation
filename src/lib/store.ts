import { useEffect, useReducer } from "react";
import type {
  AlertItem, AuditEvent, Config, ExceptionItem, Incident, IncidentStatus,
  Persona, Role, Severity, ToastMsg, Trip, UberRequest,
} from "./types";
import {
  buildSeed, DEFAULT_CONFIG, drvById, empById, evaluateUber,
  routeById, validateReceiptAmount, vehById,
} from "./data";
import { hhmm, nextId } from "./format";

let seedNow = Date.now();
const seed = buildSeed(seedNow);

export interface TmsState {
  user: Persona | null;
  trips: Trip[];
  incidents: Incident[];
  ubers: UberRequest[];
  audit: AuditEvent[];
  alerts: AlertItem[];
  exceptions: ExceptionItem[];
  config: Config;
  toasts: ToastMsg[];
  dayClosed: boolean;
  gpsLoggedNote: Record<string, string>;
}

type Listener = () => void;

class TmsStore {
  state: TmsState = {
    user: null,
    trips: seed.trips,
    incidents: seed.incidents,
    ubers: seed.ubers,
    audit: seed.audit,
    alerts: seed.alerts,
    exceptions: seed.exceptions,
    config: { ...DEFAULT_CONFIG },
    toasts: [],
    dayClosed: false,
    gpsLoggedNote: {},
  };

  private listeners = new Set<Listener>();
  private version = 0;
  private toastSeq = 0;
  private tickCount = 0;

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this.version;

  private emit() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  private set(patch: Partial<TmsState>) {
    this.state = { ...this.state, ...patch };
    this.emit();
  }

  /* ---------- generic helpers ---------- */

  toast(text: string, tone: ToastMsg["tone"] = "info") {
    const id = ++this.toastSeq;
    this.set({ toasts: [...this.state.toasts, { id, text, tone }] });
    setTimeout(() => {
      this.set({ toasts: this.state.toasts.filter((t) => t.id !== id) });
    }, 4200);
  }

  log(actor: string, role: string, action: string, object: string, prev: string, next: string) {
    const ev: AuditEvent = { id: nextId("AUD"), ts: Date.now(), actor, role, action, object, prev, next };
    this.state = { ...this.state, audit: [...this.state.audit, ev] };
  }

  alert(sev: AlertItem["sev"], text: string, audience: Role[]) {
    const al: AlertItem = { id: nextId("AL"), ts: Date.now(), sev, text, audience, read: false };
    this.state = { ...this.state, alerts: [al, ...this.state.alerts] };
  }

  private actor() {
    return { name: this.state.user?.name ?? "System", role: this.state.user?.role ?? "system" };
  }

  /* ---------- auth ---------- */

  login(p: Persona) {
    this.set({ user: p });
    this.log(p.name, p.role, "SESSION_START", p.id, "—", `authenticated · role ${p.role}`);
    this.toast(`Signed in as ${p.name} — ${p.role.toUpperCase()} workspace`, "ok");
    this.emit();
  }

  logout() {
    const u = this.state.user;
    if (u) this.log(u.name, u.role, "SESSION_END", u.id, "active", "closed");
    this.set({ user: null });
    this.emit();
  }

  /* ---------- simulation tick ---------- */

  tick() {
    const now = Date.now();
    this.tickCount++;
    const trips = this.state.trips.map((t) => {
      if ((t.status === "in_progress" || t.status === "started") && t.gps.state === "live") {
        const progress = Math.min(0.985, t.progress + 0.011 + (((this.tickCount * 7) % 5) / 1000));
        return { ...t, progress, gps: { ...t.gps, lastUpdate: now } };
      }
      return t;
    });
    this.state = { ...this.state, trips };

    // occasional telemetry audit lines for live trips
    if (this.tickCount % 4 === 0) {
      const live = trips.filter((t) => t.gps.state === "live" && t.status === "in_progress");
      if (live.length > 0) {
        const t = live[this.tickCount % live.length];
        this.log("System", "system", "GPS_PING", t.id, "—", `fix received · accuracy ${6 + (this.tickCount % 7)}m · interval ${this.state.config.gpsInterval}s`);
      }
    }

    // stale GPS graduated alert levels
    const stale = trips.find((t) => t.id === "TR-8819");
    if (stale && this.tickCount % 10 === 5) {
      const mins = Math.round((now - stale.gps.lastUpdate) / 60000);
      if (mins >= 10) {
        this.alert("critical", `GPS lost — TR-8819 unresponsive ${mins}m · level 3, escalation active`, ["ops", "manager"]);
      }
    }
    this.emit();
  }

  /* ---------- passenger actions ---------- */

  confirmTrip(empId: string, tripId: string, action: "confirmed" | "cancelled", reason?: string) {
    const trips = this.state.trips.map((t) => {
      if (t.id !== tripId) return t;
      return {
        ...t,
        pax: t.pax.map((p) =>
          p.empId === empId ? { ...p, status: action === "confirmed" ? ("confirmed" as const) : ("cancelled" as const), at: Date.now() } : p
        ),
      };
    });
    const a = this.actor();
    this.set({ trips });
    this.log(a.name, a.role, action === "confirmed" ? "PAX_CONFIRMED" : "PAX_CANCELLED", `${tripId} · ${empId}`, "pending", action + (reason ? ` · reason: ${reason}` : ""));
    this.toast(action === "confirmed" ? "Seat confirmed — recorded to trip manifest" : "Cancellation recorded with reason", "ok");
    this.emit();
  }

  requestChange(empId: string, fromTripId: string, note: string) {
    const ex: ExceptionItem = {
      id: nextId("EX"), ts: Date.now(), type: "Change request", ref: `${fromTripId} · ${empId}`,
      owner: "Transportation Ops", status: "open", slaMin: 60,
    };
    const a = this.actor();
    this.set({ exceptions: [ex, ...this.state.exceptions] });
    this.log(a.name, a.role, "CHANGE_REQUESTED", `${fromTripId} · ${empId}`, "assigned " + fromTripId, `structured request ${ex.id} · ${note}`);
    this.alert("info", `Change request ${ex.id} — ${empById(empId)?.name ?? empId} on ${fromTripId}`, ["ops"]);
    this.toast(`Change request ${ex.id} submitted — original assignment untouched (audit preserved)`, "ok");
    this.emit();
  }

  reportMissedPickup(empId: string, tripId: string, reason: string) {
    const trip = this.state.trips.find((t) => t.id === tripId);
    const inc: Incident = {
      id: nextId("INC"), severity: "P3", category: "Missed pickup", status: "created",
      tripId, reporter: empById(empId)?.name ?? empId, reporterRole: "passenger",
      desc: `${reason}. Auto-attached: ${tripId} · ${trip?.routeId} · planned ${trip ? hhmm(trip.plannedStart) : "—"} · driver ${drvById(trip?.driverId ?? null)?.name ?? "—"} · GPS ${trip?.gps.state ?? "—"} · confirmation ${trip?.pax.find((p) => p.empId === empId)?.status ?? "—"}.`,
      createdAt: Date.now(), ackAt: null, owner: null, rootCause: null, affected: 1, escalated: false,
    };
    const a = this.actor();
    this.set({ incidents: [...this.state.incidents, inc] });
    this.log(a.name, a.role, "MISSED_PICKUP", `${inc.id} · ${tripId}`, "—", `case created · "${reason}"`);
    this.alert("warn", `${inc.id} missed pickup — ${empById(empId)?.name} on ${tripId}`, ["ops", "manager"]);
    this.toast(`Missed pickup reported — case ${inc.id} opened with system evidence attached`, "warn");
    this.emit();
  }

  /* ---------- driver actions ---------- */

  startTrip(tripId: string) {
    const a = this.actor();
    const trips = this.state.trips.map((t) =>
      t.id === tripId
        ? { ...t, status: "in_progress" as const, actualStart: Date.now(), progress: 0.02, gps: { state: "live" as const, lastUpdate: Date.now() } }
        : t
    );
    this.set({ trips });
    this.log(a.name, a.role, "START_TRIP", tripId, "scheduled", `started · GPS 25.2021,55.2694 · device session ${nextId("SES")}`);
    this.alert("info", `Trip ${tripId} started — live location sharing enabled`, ["ops"]);
    this.toast(`Trip started — GPS pings every ${this.state.config.gpsInterval}s until trip ends`, "ok");
    this.emit();
  }

  endTrip(tripId: string) {
    const a = this.actor();
    const t = this.state.trips.find((x) => x.id === tripId);
    const boarded = t?.pax.filter((p) => p.status === "boarded").length ?? 0;
    const noShow = t?.pax.filter((p) => p.status === "no_show").length ?? 0;
    const trips = this.state.trips.map((x) =>
      x.id === tripId
        ? { ...x, status: "completed" as const, endedAt: Date.now(), progress: 1, gps: { state: "offline" as const, lastUpdate: Date.now(), note: "Tracking ended with trip" } }
        : x
    );
    this.set({ trips });
    this.log(a.name, a.role, "END_TRIP", tripId, "in_progress", `completed · ${boarded} boarded / ${noShow} no-show · location tracking stopped`);
    this.alert("info", `Trip ${tripId} completed — ${boarded} boarded, ${noShow} no-show`, ["ops", "manager"]);
    this.toast(`Trip ${tripId} closed — GPS tracking stopped (privacy-by-design)`, "ok");
    this.emit();
  }

  resumeGps(tripId: string) {
    const a = this.actor();
    const trips = this.state.trips.map((t) =>
      t.id === tripId && t.gps.state !== "live"
        ? { ...t, gps: { state: "live" as const, lastUpdate: Date.now() } }
        : t
    );
    this.set({ trips });
    this.log(a.name, a.role, "GPS_RESTORED", tripId, "stale", "live · signal recovered by device");
    this.alert("info", `GPS restored — ${tripId} transmitting live again`, ["ops"]);
    this.toast("GPS signal restored — back to live tracking", "ok");
    this.emit();
  }

  setPaxStatus(tripId: string, empId: string, status: "boarded" | "no_show") {
    const a = this.actor();
    const trips = this.state.trips.map((t) =>
      t.id === tripId
        ? { ...t, pax: t.pax.map((p) => (p.empId === empId ? { ...p, status, at: Date.now() } : p)) }
        : t
    );
    this.set({ trips });
    this.log(a.name, a.role, status === "boarded" ? "PAX_BOARDED" : "PAX_NO_SHOW", `${tripId} · ${empId}`, "pending", status);
    this.emit();
  }

  reportDelay(tripId: string, minutes: number, note: string) {
    const a = this.actor();
    const cfg = this.state.config;
    const trips = this.state.trips.map((t) => (t.id === tripId ? { ...t, delayMin: Math.max(t.delayMin, minutes) } : t));
    this.set({ trips });
    const tone = minutes >= cfg.delayRed ? "red" : minutes >= cfg.delayOrange ? "orange" : minutes >= cfg.delayYellow ? "yellow" : "normal";
    this.log(a.name, a.role, "DELAY_REPORTED", tripId, "—", `+${minutes}m (${tone})${note ? " · " + note : ""}`);
    if (minutes >= cfg.delayOrange) this.alert("warn", `Delay +${minutes}m reported on ${tripId} — ${tone.toUpperCase()} threshold`, ["ops", "manager"]);
    this.toast(`Delay recorded: +${minutes}m on ${tripId}`, minutes >= cfg.delayOrange ? "warn" : "info");
    this.emit();
  }

  /* ---------- incidents ---------- */

  createIncident(args: { severity: Severity; category: string; desc: string; tripId: string | null; affected: number; reporterRole: Role }) {
    const a = this.actor();
    const inc: Incident = {
      id: nextId("INC"), severity: args.severity, category: args.category, status: "created",
      tripId: args.tripId, reporter: a.name, reporterRole: args.reporterRole, desc: args.desc,
      createdAt: Date.now(), ackAt: null, owner: null, rootCause: null,
      affected: args.affected, escalated: false,
    };
    this.set({ incidents: [...this.state.incidents, inc] });
    this.log(a.name, a.role, "INCIDENT_CREATED", `${inc.id} · ${args.severity} ${args.category}`, "—", args.desc.slice(0, 90));
    const aud: Role[] = args.severity === "P1" ? ["ops", "manager", "admin"] : args.severity === "P2" ? ["ops", "manager"] : ["ops"];
    this.alert(args.severity === "P1" || args.severity === "P2" ? "critical" : "warn", `${inc.id} (${args.severity}) ${args.category} — ${args.desc.slice(0, 70)}`, aud);
    this.toast(`Incident ${inc.id} created — ${args.severity} routing applied`, args.severity === "P1" ? "err" : "warn");
    this.emit();
    return inc.id;
  }

  advanceIncident(id: string, to: IncidentStatus, rootCause?: string) {
    const a = this.actor();
    const prevStatus = this.state.incidents.find((i) => i.id === id)?.status ?? "—";
    const incidents = this.state.incidents.map((i) => {
      if (i.id !== id) return i;
      return {
        ...i, status: to,
        ackAt: to === "acknowledged" ? Date.now() : i.ackAt,
        owner: to === "assigned" || to === "acknowledged" ? a.name : i.owner,
        rootCause: rootCause ?? i.rootCause,
      };
    });
    this.set({ incidents });
    this.log(a.name, a.role, "INCIDENT_" + to.toUpperCase(), id, prevStatus, to + (rootCause ? ` · root cause: ${rootCause}` : ""));
    this.toast(`${id} → ${to.replace("_", " ").toUpperCase()}`, "ok");
    this.emit();
  }

  markEscalated(id: string) {
    const incidents = this.state.incidents.map((i) => (i.id === id ? { ...i, escalated: true } : i));
    this.set({ incidents });
    this.log("System", "system", "INCIDENT_ESCALATED", id, "created", "auto-escalated · ack SLA breached → operator, manager, backup");
    this.alert("critical", `${id} auto-escalated — acknowledgement SLA breached`, ["ops", "manager"]);
    this.emit();
  }

  /* ---------- uber workflow ---------- */

  requestUber(empId: string, tripId: string | null, reasonKey: string, reason: string, requestedAmount: number) {
    const a = this.actor();
    const trip = this.state.trips.find((t) => t.id === tripId) ?? null;
    const tripIncidents = this.state.incidents.filter((i) => i.tripId === tripId && i.status !== "closed");
    const confirmed = trip ? trip.pax.find((p) => p.empId === empId)?.status === "confirmed" || trip.pax.find((p) => p.empId === empId)?.status === "boarded" : false;
    const result = evaluateUber({ trip, tripIncidents, cfg: this.state.config, confirmed, reasonKey });
    const id = nextId("UB-2026");
    const cfg = this.state.config;

    const base: UberRequest = {
      id, empId, tripId, reasonKey, reason, createdAt: Date.now(),
      decision: result.decision, rule: result.rule, facts: result.facts,
      requestedAmount, receipt: null, validation: null, financeNote: null,
      limit: null, approver: null, approvedAt: null, slaDue: null,
      status: result.decision === "auto" ? "approved" : result.decision === "reject" ? "rejected" : "pending_approval",
    };

    if (result.decision === "auto") {
      base.limit = Math.min(requestedAmount || cfg.uberMaxPerTrip, cfg.uberMaxPerTrip);
      base.approver = "System (auto-rule)";
      base.approvedAt = Date.now();
    } else if (result.decision === "manual") {
      base.slaDue = Date.now() + cfg.slaNormal * 60000;
    }

    this.set({ ubers: [base, ...this.state.ubers] });
    this.log(a.name, a.role, "UBER_REQUESTED", id, "—", `${reason} · eligibility: ${result.decision.toUpperCase()} · ${result.rule}`);
    if (result.decision === "auto") {
      this.log("System", "system", "UBER_AUTO_APPROVED", id, "requested", `approved · ${result.rule} · limit $${(base.limit ?? 0).toFixed(2)}`);
      this.alert("info", `Auto-approval applied — ${id} (${result.rule})`, ["ops", "finance"]);
      this.toast(`${id} approved automatically — limit $${(base.limit ?? 0).toFixed(2)}. Receipt required within ${cfg.receiptWindowDays} days.`, "ok");
    } else if (result.decision === "reject") {
      this.log("System", "system", "UBER_REJECTED", id, "requested", `rejected · ${result.rule}`);
      this.toast(`Request ${id} rejected by policy — ${result.rule}`, "err");
    } else {
      this.alert("warn", `Uber approval pending — ${id} (${empById(empId)?.name}), SLA ${cfg.slaNormal}m`, ["ops", "manager"]);
      this.toast(`${id} submitted for supervisor approval — SLA ${cfg.slaNormal} minutes`, "warn");
    }
    this.emit();
    return base;
  }

  approveUber(id: string, limit: number) {
    const a = this.actor();
    const req = this.state.ubers.find((u) => u.id === id);
    if (!req) return;
    if (req.empId === this.state.user?.refId || req.empId === this.state.user?.id) {
      this.log(a.name, a.role, "APPROVAL_BLOCKED", id, "pending", "self-approval attempt denied by policy POL-11");
      this.toast("Blocked — approvers cannot approve their own request (POL-11)", "err");
      this.emit();
      return;
    }
    if (limit > this.state.config.uberMaxPerTrip) {
      this.toast(`Limit exceeds per-trip cap ($${this.state.config.uberMaxPerTrip}) — exception approval required`, "err");
      return;
    }
    const ubers = this.state.ubers.map((u) =>
      u.id === id ? { ...u, status: "approved" as const, limit, approver: a.name, approvedAt: Date.now(), slaDue: null } : u
    );
    this.set({ ubers });
    this.log(a.name, a.role, "UBER_APPROVED", id, "pending_approval", `approved · limit $${limit.toFixed(2)} · ${req.rule}`);
    this.alert("info", `${id} approved by ${a.name} — limit $${limit.toFixed(2)}`, ["finance"]);
    this.toast(`${id} approved — passenger notified, receipt required`, "ok");
    this.emit();
  }

  rejectUber(id: string, reason: string) {
    const a = this.actor();
    const ubers = this.state.ubers.map((u) =>
      u.id === id ? { ...u, status: "rejected" as const, approver: a.name, approvedAt: Date.now(), financeNote: reason, slaDue: null } : u
    );
    this.set({ ubers });
    this.log(a.name, a.role, "UBER_REJECTED", id, "pending_approval", `rejected · ${reason}`);
    this.toast(`${id} rejected — passenger notified with reason`, "warn");
    this.emit();
  }

  markUberRidden(id: string) {
    const ubers = this.state.ubers.map((u) => (u.id === id ? { ...u, status: "receipt_pending" as const } : u));
    this.set({ ubers });
    this.log(this.actor().name, this.actor().role, "UBER_TRIP_COMPLETED", id, "approved", "receipt_pending");
    this.toast("Ride marked complete — receipt upload now required", "info");
    this.emit();
  }

  uploadReceipt(id: string, receipt: { amount: number; date: string; time: string; ref: string; fileName: string }) {
    const a = this.actor();
    const req = this.state.ubers.find((u) => u.id === id);
    if (!req) return;
    const approved = req.status === "approved" || req.status === "receipt_pending";
    const validation = validateReceiptAmount(receipt.amount, req.limit, approved);
    const dup = this.state.ubers.some((u) => u.receipt && u.receipt.fileName === receipt.fileName && u.receipt.amount === receipt.amount && u.id !== id);
    const finalValidation = dup ? "invalid" : validation;
    const ubers = this.state.ubers.map((u) =>
      u.id === id
        ? {
            ...u, status: "receipt_submitted" as const, receipt: { ...receipt, submittedAt: Date.now() },
            validation: finalValidation as UberRequest["validation"],
            financeNote: dup
              ? "Duplicate receipt detected — blocked"
              : finalValidation === "exception"
                ? `Receipt exceeds approved limit by $${(receipt.amount - (req.limit ?? 0)).toFixed(2)} — finance decision required`
                : finalValidation === "invalid"
                  ? "No valid approval linked — routed to exception review"
                  : "Within approved limit",
          }
        : u
    );
    this.set({ ubers });
    this.log(a.name, a.role, "RECEIPT_SUBMITTED", id, "receipt_pending", `$${receipt.amount.toFixed(2)} · ${receipt.fileName} · validation ${finalValidation.toUpperCase()}`);
    if (finalValidation === "valid") this.toast(`Receipt validated — within $${req.limit?.toFixed(2)} limit`, "ok");
    else if (finalValidation === "exception") this.toast("Receipt flagged — amount exceeds approved limit (finance review)", "warn");
    else this.toast("Receipt invalid — no matching approval or duplicate", "err");
    if (finalValidation !== "valid") {
      this.alert("warn", `Receipt ${finalValidation} — ${id} $${receipt.amount.toFixed(2)} vs limit $${req.limit?.toFixed(2) ?? "—"}`, ["finance", "manager"]);
      const ex: ExceptionItem = {
        id: nextId("EX"), ts: Date.now(), type: finalValidation === "exception" ? "Receipt over limit" : "Receipt invalid",
        ref: id, owner: "Finance", status: "open", slaMin: 120,
      };
      this.state = { ...this.state, exceptions: [ex, ...this.state.exceptions] };
    }
    this.emit();
  }

  financeDecision(id: string, decision: "accepted" | "rejected" | "clarification" | "exception_approved") {
    const a = this.actor();
    const ubers = this.state.ubers.map((u) => {
      if (u.id !== id) return u;
      const status = decision === "accepted" ? ("finance_approved" as const) : decision === "exception_approved" ? ("finance_approved" as const) : u.status;
      return {
        ...u, status,
        validation: decision === "exception_approved" ? ("valid" as const) : u.validation,
        financeNote: decision === "clarification" ? "Clarification requested from employee" : decision === "rejected" ? "Rejected by finance" : decision === "exception_approved" ? "Exception approved by finance (over-limit accepted)" : "Accepted",
      };
    });
    this.set({ ubers });
    this.log(a.name, a.role, "FINANCE_" + decision.toUpperCase(), id, "receipt_submitted", decision);
    this.toast(`Finance decision recorded: ${decision.replace("_", " ")}`, decision === "rejected" ? "warn" : "ok");
    this.emit();
  }

  markPaid(id: string) {
    const a = this.actor();
    const ubers = this.state.ubers.map((u) => (u.id === id ? { ...u, status: "paid" as const } : u));
    this.set({ ubers });
    this.log(a.name, a.role, "UBER_PAID", id, "finance_approved", "paid · closed");
    this.toast(`${id} marked paid and closed`, "ok");
    this.emit();
  }

  /* ---------- ops actions ---------- */

  cancelTrip(tripId: string, reason: string) {
    const a = this.actor();
    const t = this.state.trips.find((x) => x.id === tripId);
    const trips = this.state.trips.map((x) => (x.id === tripId ? { ...x, status: "cancelled" as const, endedAt: Date.now() } : x));
    this.set({ trips });
    this.log(a.name, a.role, "TRIP_CANCELLED", tripId, t?.status ?? "—", `cancelled · ${reason} · ${t?.pax.length ?? 0} passengers notified via app`);
    this.alert("warn", `${tripId} cancelled — affected passengers auto-notified (${t?.pax.length ?? 0})`, ["ops", "manager"]);
    this.toast(`Trip cancelled — ${t?.pax.length ?? 0} passengers notified in-app (no WhatsApp needed)`, "warn");
    this.emit();
  }

  reassignTrip(tripId: string, driverId: string, vehicleId: string) {
    const a = this.actor();
    const t = this.state.trips.find((x) => x.id === tripId);
    const trips = this.state.trips.map((x) => (x.id === tripId ? { ...x, driverId, vehicleId } : x));
    this.set({ trips });
    this.log(a.name, a.role, "TRIP_REASSIGNED", tripId,
      `${drvById(t?.driverId ?? null)?.name ?? "unassigned"} / ${vehById(t?.vehicleId ?? null)?.plate ?? "—"}`,
      `${drvById(driverId)?.name} / ${vehById(vehicleId)?.plate}`);
    this.toast(`${tripId} reassigned — manifest and audit updated`, "ok");
    this.emit();
  }

  logGpsNote(tripId: string, note: string) {
    const a = this.actor();
    this.set({ gpsLoggedNote: { ...this.state.gpsLoggedNote, [tripId]: note } });
    this.log(a.name, a.role, "GPS_ISSUE_LOGGED", tripId, "stale", note);
    this.toast("Operator note recorded to audit trail", "ok");
    this.emit();
  }

  resolveException(id: string) {
    const a = this.actor();
    const exceptions = this.state.exceptions.map((e) => (e.id === id ? { ...e, status: "resolved" as const } : e));
    this.set({ exceptions });
    this.log(a.name, a.role, "EXCEPTION_RESOLVED", id, "open", "resolved");
    this.toast(`${id} resolved`, "ok");
    this.emit();
  }

  closeDay() {
    const a = this.actor();
    this.set({ dayClosed: true });
    this.log(a.name, a.role, "DAY_CLOSED", "OPERATIONS", "open", "closed · manager override recorded");
    this.alert("info", "Operational day closed by manager override — checklist items remain on record", ["ops", "manager", "finance"]);
    this.toast("Day closed — override and open items preserved in audit trail", "warn");
    this.emit();
  }

  markAlertsRead(role: Role) {
    this.set({ alerts: this.state.alerts.map((al) => (al.audience.includes(role) ? { ...al, read: true } : al)) });
    this.emit();
  }

  updateConfig(patch: Partial<Config>) {
    const a = this.actor();
    const prev = this.state.config;
    const config = { ...prev, ...patch };
    this.set({ config });
    const changed = Object.keys(patch).join(", ");
    this.log(a.name, a.role, "CONFIG_UPDATED", "System Configuration", JSON.stringify(Object.fromEntries(Object.keys(patch).map((k) => [k, (prev as unknown as Record<string, unknown>)[k]]))), JSON.stringify(patch) + ` · keys: ${changed}`);
    this.toast(`Configuration saved — ${changed} now active system-wide`, "ok");
    this.emit();
  }
}

export const store = new TmsStore();

export function useTms(): TmsState {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => store.subscribe(() => force()), []);
  return store.state;
}

/* ---------- derived helpers ---------- */

export function delayTone(min: number, cfg: Config): "ok" | "warn" | "late" | "crit" {
  if (min >= cfg.delayRed) return "crit";
  if (min >= cfg.delayOrange) return "late";
  if (min >= cfg.delayYellow) return "warn";
  return "ok";
}

export function gpsBadge(t: Trip, now: number): { label: string; tone: "ok" | "warn" | "late" | "crit" | "idle" } {
  const age = Math.max(0, Math.round((now - t.gps.lastUpdate) / 1000));
  switch (t.gps.state) {
    case "live":
      return { label: `LIVE · ${age}s`, tone: "ok" };
    case "stale":
      return { label: `STALE · ${Math.round(age / 60)}m`, tone: age > 600 ? "crit" : "late" };
    case "unavailable":
      return { label: "GPS UNAVAILABLE", tone: "crit" };
    default:
      return { label: t.status === "completed" ? "ENDED" : "PRE-TRIP", tone: "idle" };
  }
}

export function slaRemaining(due: number, now: number): string {
  const s = Math.round((due - now) / 1000);
  if (s <= 0) return `breached ${Math.abs(Math.round(s / 60))}m ago`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s left`;
}

export function tripRoute(t: Trip) {
  return routeById(t.routeId);
}
