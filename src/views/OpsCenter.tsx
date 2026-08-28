import { useMemo, useState } from "react";
import type { Incident, Trip, UberRequest } from "../lib/types";
import {
  DRIVERS, VALIDATION_FINDINGS, VEHICLES, drvById, empById, routeById, vehById,
  ROOT_CAUSE_OPTIONS,
} from "../lib/data";
import { ago, downloadCsv, fullStamp, hhmm, money } from "../lib/format";
import { delayTone, gpsBadge, slaRemaining, store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Dot, Field, inputCls, KV, Modal, Panel, ProgressBar, Seg, sevChip, TONE_TEXT, tripChip, uberChip, paxChip, validationChip } from "../components/ui";
import { LiveMap } from "../components/LiveMap";

/* ---------- small shared bits ---------- */

function Stat({ label, value, sub, tone = "text-mist-100", pulse = false }: { label: string; value: string | number; sub?: string; tone?: string; pulse?: boolean }) {
  return (
    <div className="panel-flat relative overflow-hidden rounded-lg px-3.5 py-3">
      <div className="flex items-center gap-2">
        <span className="label">{label}</span>
        {pulse && <Dot tone="ok" pulse s={5} />}
      </div>
      <p className={`num mt-1 text-[30px] leading-none ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-[10.5px] text-mist-500">{sub}</p>}
    </div>
  );
}

export function FactRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-ink-700/60 py-2 last:border-0">
      <span className={`mt-0.5 ${ok ? "text-ok" : "text-crit"}`}>
        <I n={ok ? "check" : "x"} s={14} w={2.2} />
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-medium text-mist-200">{label}</p>
        <p className="font-mono text-[11px] text-mist-500">{detail}</p>
      </div>
    </div>
  );
}

function buildFacts(t: Trip | undefined, inc: Incident[], cfg: { delayYellow: number; delayOrange: number; delayRed: number }) {
  if (!t) return [];
  const boarded = t.pax.filter((p) => p.status === "boarded").length;
  return [
    { ok: true, label: "Transportation was scheduled", detail: `${t.id} · ${t.routeId} · planned ${hhmm(t.plannedStart)}` },
    { ok: !!t.actualStart, label: "Driver started the trip", detail: t.actualStart ? `started ${hhmm(t.actualStart)}` : "trip not started" },
    { ok: t.gps.state === "live", label: "Driver GPS available", detail: `${t.gps.state.toUpperCase()} · last update ${hhmm(t.gps.lastUpdate)}` },
    { ok: t.delayMin >= cfg.delayOrange, label: `Delay vs thresholds (y${cfg.delayYellow}/o${cfg.delayOrange}/r${cfg.delayRed} min)`, detail: t.delayMin > 0 ? `+${t.delayMin}m` : "on schedule" },
    { ok: boarded > 0, label: "Other passengers boarded", detail: `${boarded} of ${t.pax.length} boarded` },
    { ok: inc.length > 0, label: "Linked operational incidents", detail: inc.length ? inc.map((i) => `${i.id} ${i.category} (${i.severity})`).join(" · ") : "none recorded" },
  ];
}

/* ---------- main view ---------- */

export function OpsCenter({ section, now }: { section: string; now: number }) {
  const s = useTms();
  const [focus, setFocus] = useState<string | null>("TR-8819");
  const [drawer, setDrawer] = useState<Trip | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [approveTarget, setApproveTarget] = useState<UberRequest | null>(null);

  const cfg = s.config;
  const trips = s.trips;
  const active = trips.filter((t) => t.status === "in_progress" || t.status === "started");
  const scheduled = trips.filter((t) => t.status === "scheduled");
  const delayed = trips.filter((t) => t.delayMin >= cfg.delayYellow && !["completed", "cancelled"].includes(t.status));
  const paxTravelling = active.reduce((n, t) => n + t.pax.filter((p) => p.status === "boarded").length, 0);
  const openInc = s.incidents.filter((i) => !["resolved", "closed"].includes(i.status));
  const uberOpen = s.ubers.filter((u) => ["pending_approval", "approved", "receipt_pending", "receipt_submitted"].includes(u.status));
  const receiptsMissing = s.ubers.filter((u) => ["approved", "receipt_pending"].includes(u.status) && !u.receipt).length;
  const unauthorized = s.ubers.filter((u) => u.status === "unauthorized");

  const eod = [
    { ok: trips.every((t) => ["completed", "cancelled"].includes(t.status)), label: "All trips completed", detail: `${trips.filter((t) => t.status === "completed").length}/${trips.length} completed` },
    { ok: active.length === 0, label: "No active trips remaining", detail: active.length ? `${active.length} still live` : "clear" },
    { ok: openInc.length === 0, label: "No unresolved incidents", detail: openInc.length ? `${openInc.length} open` : "clear" },
    { ok: !active.some((t) => t.gps.state !== "live"), label: "No GPS anomalies on live trips", detail: active.some((t) => t.gps.state !== "live") ? "TR-8819 stale" : "clear" },
    { ok: !s.ubers.some((u) => u.status === "pending_approval"), label: "No Uber requests pending approval", detail: `${s.ubers.filter((u) => u.status === "pending_approval").length} waiting` },
    { ok: receiptsMissing === 0, label: "No receipts missing", detail: `${receiptsMissing} outstanding` },
    { ok: unauthorized.length === 0, label: "No unauthorized transportation", detail: `${unauthorized.length} flagged` },
    { ok: !VALIDATION_FINDINGS.some((f) => f.sev === "crit"), label: "No route failures / schedule faults", detail: `${VALIDATION_FINDINGS.filter((f) => f.sev === "crit").length} critical findings` },
  ];
  const eodFail = eod.filter((e) => !e.ok).length;

  const filtered = useMemo(() => {
    return trips.filter((t) => {
      if (filter === "active") return active.includes(t);
      if (filter === "delayed") return delayed.includes(t);
      if (filter === "gps") return ["stale", "unavailable"].includes(t.gps.state) && !["completed", "cancelled"].includes(t.status);
      if (filter === "incident") return t.status === "incident";
      if (filter === "scheduled") return t.status === "scheduled";
      return true;
    });
  }, [trips, filter, active, delayed]);

  const audit = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...s.audit].sort((a, b) => b.ts - a.ts).filter((e) => !term || `${e.actor} ${e.action} ${e.object} ${e.next} ${e.prev}`.toLowerCase().includes(term));
  }, [s.audit, q]);

  const focusTrip = trips.find((t) => t.id === focus) ?? null;

  return (
    <div className="space-y-4">
      {section === "control" && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            <Stat label="Active trips" value={active.length} pulse tone="text-gps" sub="live telemetry" />
            <Stat label="Scheduled" value={scheduled.length} sub="later today" />
            <Stat label="Delayed" value={delayed.length} tone={delayed.length ? "text-late" : "text-ok"} sub={`≥ ${cfg.delayYellow}m threshold`} />
            <Stat label="Drivers active" value={new Set(active.map((t) => t.driverId)).size} sub="on duty" />
            <Stat label="Pax travelling" value={paxTravelling} tone="text-signal" sub="boarded now" />
            <Stat label="Open incidents" value={openInc.length} tone={openInc.length ? "text-warn" : "text-ok"} sub={`${openInc.filter((i) => i.severity === "P1" || i.severity === "P2").length} major+`} />
            <Stat label="Uber open" value={uberOpen.length} sub="in workflow" />
            <Stat label="Receipts missing" value={receiptsMissing} tone={receiptsMissing ? "text-warn" : "text-ok"} sub={`window ${cfg.receiptWindowDays}d`} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
            {/* map */}
            <Panel
              title="Live map — inbound operations" icon="map" live
              right={
                <span className="font-mono text-[10.5px] text-mist-500">
                  GPS interval {cfg.gpsInterval}s · retention {cfg.gpsRetention}d
                </span>
              }
              pad={false}
            >
              <LiveMap trips={trips} focus={focus} onFocus={setFocus} now={now} />
              {focusTrip && (
                <div className="rise border-t border-ink-700 bg-ink-900/60 p-4">
                  <FocusCard t={focusTrip} now={now} onClose={() => setFocus(null)} onDetails={() => setDrawer(focusTrip)} />
                </div>
              )}
            </Panel>

            {/* right rail */}
            <div className="space-y-4">
              <Panel title="Alert rail" icon="bell" live pad={false}>
                <ul className="max-h-64 divide-y divide-ink-700/60 overflow-y-auto">
                  {s.alerts.slice(0, 8).map((a) => (
                    <li key={a.id} className={`flex items-start gap-2.5 px-4 py-2.5 ${a.read ? "opacity-55" : ""}`}>
                      <Dot tone={a.sev === "critical" ? "crit" : a.sev === "warn" ? "warn" : "gps"} pulse={!a.read && a.sev === "critical"} s={7} />
                      <div className="min-w-0">
                        <p className="text-[12.5px] leading-snug text-mist-200">{a.text}</p>
                        <p className="font-mono text-[10px] text-mist-500">{ago(a.ts, now)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel title="Schedule validation" icon="shield" right={<Badge tone="crit">{VALIDATION_FINDINGS.filter((f) => f.sev === "crit").length} CRIT</Badge>}>
                <ul className="space-y-2">
                  {VALIDATION_FINDINGS.map((f) => (
                    <li key={f.code} className="flex items-start gap-2.5">
                      <span className={f.sev === "crit" ? "text-crit" : "text-warn"}>
                        <I n="alert" s={14} />
                      </span>
                      <div>
                        <p className="font-mono text-[10.5px] text-mist-500">{f.code}</p>
                        <p className="text-[12.5px] leading-snug text-mist-200">{f.text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel
                title="End-of-day control" icon="flag"
                right={<Badge tone={eodFail ? "crit" : "ok"}>{eodFail ? `${eodFail} OPEN` : "READY"}</Badge>}
              >
                <ul className="space-y-1.5">
                  {eod.map((e) => (
                    <li key={e.label} className="flex items-center gap-2.5 text-[12.5px]">
                      <span className={e.ok ? "text-ok" : "text-crit"}>
                        <I n={e.ok ? "check" : "x"} s={13} w={2.2} />
                      </span>
                      <span className={e.ok ? "text-mist-300" : "text-mist-200"}>{e.label}</span>
                      <span className="ml-auto font-mono text-[10.5px] text-mist-500">{e.detail}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 border-t border-ink-700 pt-3">
                  {s.dayClosed ? (
                    <Badge tone="warn">DAY CLOSED · OVERRIDE ON RECORD</Badge>
                  ) : eodFail > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11.5px] leading-relaxed text-mist-500">
                        Day cannot be closed while {eodFail} item{s.dayClosed ? "" : eodFail > 1 ? "s" : ""} remain. Manager override is recorded to the audit trail.
                      </p>
                      {s.user?.role === "manager" ? (
                        <Btn tone="danger" size="sm" onClick={() => store.closeDay()}>
                          <I n="power" s={13} /> Manager override — close day
                        </Btn>
                      ) : (
                        <Badge tone="idle">OVERRIDE REQUIRES TRANSPORTATION MANAGER</Badge>
                      )}
                    </div>
                  ) : (
                    <Btn tone="ok" size="sm" onClick={() => store.closeDay()}>
                      <I n="check" s={13} /> Close operational day
                    </Btn>
                  )}
                </div>
              </Panel>
            </div>
          </div>

          {/* exceptions strip */}
          <Panel
            title="Exception register — first-class records" icon="alert"
            right={<Btn size="sm" tone="ghost" onClick={() => downloadCsv("fleetgrid_exceptions.csv", [["ID", "Type", "Ref", "Owner", "Status", "SLA (min)"], ...s.exceptions.map((e) => [e.id, e.type, e.ref, e.owner, e.status, e.slaMin])])}><I n="download" s={13} /> CSV</Btn>}
          >
            <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {s.exceptions.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                  <Dot tone={e.status === "resolved" ? "ok" : e.type.includes("unauthorized") || e.type.includes("invalid") ? "crit" : "warn"} s={7} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-mist-200">{e.type}</p>
                    <p className="truncate font-mono text-[10.5px] text-mist-500">{e.id} · {e.ref} · {e.owner} · SLA {e.slaMin}m</p>
                  </div>
                  {e.status !== "resolved" ? (
                    <Btn size="sm" onClick={() => store.resolveException(e.id)}>Resolve</Btn>
                  ) : (
                    <Badge tone="ok">RESOLVED</Badge>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      {section === "trips" && (
        <Panel
          title="Trips & manifests" icon="bus" live
          right={
            <Seg
              value={filter}
              onChange={setFilter}
              options={[
                { id: "all", label: "All", count: trips.length },
                { id: "active", label: "Active", count: active.length },
                { id: "delayed", label: "Delayed", count: delayed.length },
                { id: "gps", label: "GPS issue", count: trips.filter((t) => ["stale", "unavailable"].includes(t.gps.state) && !["completed", "cancelled"].includes(t.status)).length },
                { id: "scheduled", label: "Scheduled", count: scheduled.length },
              ]}
            />
          }
          pad={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-[12.5px]">
              <thead>
                <tr className="label border-b border-ink-700 !text-[10px]">
                  {["Trip", "Route", "Driver", "Vehicle", "Planned", "Actual", "Status", "GPS", "Delay", "Pax", "Boarded", "No-show", "Incident", ""].map((h) => (
                    <th key={h} className="px-3 py-2.5 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const r = routeById(t.routeId);
                  const boarded = t.pax.filter((p) => p.status === "boarded").length;
                  const noShow = t.pax.filter((p) => p.status === "no_show").length;
                  const inc = s.incidents.filter((i) => i.tripId === t.id && !["closed", "resolved"].includes(i.status));
                  const g = gpsBadge(t, now);
                  const dt = delayTone(t.delayMin, cfg);
                  return (
                    <tr key={t.id} className="border-b border-ink-700/50 transition hover:bg-ink-800/50">
                      <td className="px-3 py-2.5 font-mono text-mist-200">{t.id}</td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold" style={{ color: r?.color }}>{t.routeId}</span>
                        <span className="ml-1.5 hidden text-mist-500 2xl:inline">{r?.name}</span>
                      </td>
                      <td className="px-3 py-2.5 text-mist-300">{drvById(t.driverId)?.name ?? <span className="text-crit">unassigned</span>}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] text-mist-400">{vehById(t.vehicleId)?.plate ?? "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-mist-300">{hhmm(t.plannedStart)}</td>
                      <td className="px-3 py-2.5 font-mono text-mist-300">{t.actualStart ? hhmm(t.actualStart) : "—"}</td>
                      <td className="px-3 py-2.5"><Badge tone={tripChip(t.status).tone} pulse={t.status === "in_progress"}>{tripChip(t.status).label}</Badge></td>
                      <td className="px-3 py-2.5"><Badge tone={g.tone}>{g.label}</Badge></td>
                      <td className={`px-3 py-2.5 font-mono ${TONE_TEXT[dt]}`}>{t.delayMin > 0 ? `+${t.delayMin}m` : "—"}</td>
                      <td className="px-3 py-2.5 font-mono text-mist-300">{t.pax.length}</td>
                      <td className="px-3 py-2.5 font-mono text-ok">{boarded}</td>
                      <td className="px-3 py-2.5 font-mono text-crit">{noShow || "—"}</td>
                      <td className="px-3 py-2.5">{inc.length ? <Badge tone="crit">{inc[0].id}</Badge> : <span className="text-mist-500">—</span>}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Btn size="sm" onClick={() => setDrawer(t)}><I n="eye" s={13} /> Open</Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {section === "cases" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {/* incidents */}
          <Panel title={`Incident management (${openInc.length} open)`} icon="alert" live>
            <div className="space-y-3">
              {[...s.incidents]
                .sort((a, b) => (["closed", "resolved"].includes(a.status) ? 1 : 0) - (["closed", "resolved"].includes(b.status) ? 1 : 0) || b.createdAt - a.createdAt)
                .map((inc) => (
                  <IncidentCard key={inc.id} inc={inc} now={now} />
                ))}
            </div>
          </Panel>

          {/* uber queue */}
          <div className="space-y-4">
            <Panel title="Alternative transportation queue" icon="taxi" live>
              <div className="space-y-3">
                {s.ubers.filter((u) => ["pending_approval", "approved", "receipt_pending", "receipt_submitted"].includes(u.status)).map((u) => (
                  <UberCard key={u.id} u={u} now={now} onApprove={() => setApproveTarget(u)} />
                ))}
              </div>
            </Panel>
            <Panel title={`Unauthorized transportation (${unauthorized.length})`} icon="lock">
              {unauthorized.length === 0 && <p className="text-[12.5px] text-mist-500">No unauthorized rides flagged.</p>}
              <div className="space-y-2.5">
                {unauthorized.map((u) => (
                  <div key={u.id} className="rounded-lg border border-crit/30 bg-crit/5 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold text-mist-100">{empById(u.empId)?.name} · {money(u.receipt?.amount ?? u.requestedAmount ?? 0)}</p>
                      <Badge tone="crit">UNAUTHORIZED</Badge>
                    </div>
                    <p className="mt-1 text-[12px] text-mist-400">{u.financeNote ?? "No prior approval on record — never auto-reimbursed. Tracked separately in cost reporting."}</p>
                    <p className="mt-1 font-mono text-[10.5px] text-mist-500">{u.id} · {u.receipt?.fileName ?? "no receipt"} · exception review: manager + finance</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {section === "audit" && (
        <Panel
          title={`Audit trail — immutable (${audit.length})`} icon="doc"
          right={
            <div className="flex items-center gap-2">
              <div className="relative">
                <I n="search" s={13} c="absolute left-2.5 top-1/2 -translate-y-1/2 text-mist-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actor, action, object…" className={`${inputCls} !w-56 !py-1.5 !pl-8 !text-[12px]`} />
              </div>
              <Btn size="sm" tone="ghost" onClick={() => downloadCsv("fleetgrid_audit.csv", [["Timestamp", "Actor", "Role", "Action", "Object", "Prev", "Next"], ...audit.map((e) => [fullStamp(e.ts), e.actor, e.role, e.action, e.object, e.prev, e.next])])}>
                <I n="download" s={13} /> CSV
              </Btn>
            </div>
          }
          pad={false}
        >
          <ul className="max-h-[70vh] divide-y divide-ink-700/50 overflow-y-auto font-mono text-[11.5px]">
            {audit.map((e) => (
              <li key={e.id} className="flex gap-3 px-4 py-2.5 transition hover:bg-ink-800/40">
                <span className="w-32 shrink-0 text-mist-500">{fullStamp(e.ts)}</span>
                <span className="w-32 shrink-0 truncate text-signal">{e.actor}</span>
                <span className="w-40 shrink-0 truncate text-gps">{e.action}</span>
                <span className="min-w-0 flex-1 text-mist-300">
                  <span className="text-mist-100">{e.object}</span>
                  <span className="text-mist-500"> · {e.prev} → {e.next}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* trip drawer */}
      {drawer && <TripDrawer t={s.trips.find((x) => x.id === drawer.id) ?? drawer} now={now} onClose={() => setDrawer(null)} />}

      {/* approve modal */}
      {approveTarget && <ApproveModal u={approveTarget} onClose={() => setApproveTarget(null)} />}
    </div>
  );
}

/* ---------- focus card under map ---------- */

function FocusCard({ t, now, onClose, onDetails }: { t: Trip; now: number; onClose: () => void; onDetails: () => void }) {
  const s = useTms();
  const r = routeById(t.routeId);
  const g = gpsBadge(t, now);
  const boarded = t.pax.filter((p) => p.status === "boarded").length;
  const [noteOpen, setNoteOpen] = useState(false);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="num text-[24px] text-mist-100">{t.id}</span>
        <Badge tone={tripChip(t.status).tone} pulse={t.status === "in_progress"}>{tripChip(t.status).label}</Badge>
        <Badge tone={g.tone}>{g.label}</Badge>
        {t.delayMin > 0 && <Badge tone={delayTone(t.delayMin, s.config) === "ok" ? "warn" : delayTone(t.delayMin, s.config)}>+{t.delayMin}M DELAY</Badge>}
        <button onClick={onClose} className="ml-auto text-mist-500 transition hover:text-mist-100" aria-label="Clear focus"><I n="x" s={16} /></button>
      </div>
      <div className="mt-2 grid gap-x-6 gap-y-1 text-[12.5px] sm:grid-cols-2 xl:grid-cols-4">
        <p className="text-mist-400">Route <span className="font-semibold" style={{ color: r?.color }}>{t.routeId} · {r?.name}</span></p>
        <p className="text-mist-400">Driver <span className="text-mist-100">{drvById(t.driverId)?.name ?? "—"}</span></p>
        <p className="text-mist-400">Vehicle <span className="font-mono text-mist-100">{vehById(t.vehicleId)?.plate ?? "—"}</span></p>
        <p className="text-mist-400">Passengers <span className="text-mist-100">{boarded}/{t.pax.length} boarded</span></p>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <ProgressBar value={t.progress} tone={t.gps.state === "live" ? "gps" : "late"} h={7} />
        <span className="shrink-0 font-mono text-[11px] text-mist-500">{Math.round(t.progress * 100)}%</span>
      </div>
      {t.gps.state !== "live" && (
        <p className="mt-2 flex items-center gap-2 rounded border border-late/30 bg-late/5 px-3 py-2 text-[12px] text-late">
          <I n="alert" s={14} /> Last location {hhmm(t.gps.lastUpdate)} · GPS {t.gps.state} — position shown is the last fix, not live.
          {s.gpsLoggedNote[t.id] && <span className="font-mono text-[10.5px] text-mist-400">Operator note: {s.gpsLoggedNote[t.id]}</span>}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn size="sm" tone="primary" onClick={onDetails}><I n="users" s={13} /> Manifest & evidence</Btn>
        {t.gps.state !== "live" && !s.gpsLoggedNote[t.id] && (
          <Btn size="sm" tone="gps" onClick={() => setNoteOpen(true)}><I n="radio" s={13} /> Log GPS check</Btn>
        )}
        <Btn size="sm" onClick={() => store.toast(`Push + SMS fallback sent to ${t.pax.length} passengers of ${t.id}`, "ok")}>
          <I n="send" s={13} /> Notify passengers
        </Btn>
        <Btn size="sm" onClick={() => store.toast(`Calling ${drvById(t.driverId)?.name} via ${drvById(t.driverId)?.phone}`, "info")}>
          <I n="phone" s={13} /> Call driver
        </Btn>
      </div>
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={`GPS check — ${t.id}`}>
        <p className="mb-3 text-[12.5px] text-mist-400">Record the outcome of contacting the driver. This becomes part of the audit trail.</p>
        <div className="flex flex-wrap gap-2">
          {["GPS issue — trip operational", "Device offline — driver reached by phone", "Location services disabled — instructed to re-enable"].map((n) => (
            <Btn key={n} size="sm" onClick={() => { store.logGpsNote(t.id, n); setNoteOpen(false); }}>{n}</Btn>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/* ---------- trip drawer ---------- */

function TripDrawer({ t, now, onClose }: { t: Trip; now: number; onClose: () => void }) {
  const s = useTms();
  const r = routeById(t.routeId);
  const inc = s.incidents.filter((i) => i.tripId === t.id);
  const g = gpsBadge(t, now);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("Vehicle unavailable");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [dSel, setDSel] = useState(t.driverId ?? "DRV-06");
  const [vSel, setVSel] = useState(t.vehicleId ?? "VH-09");

  return (
    <Modal open onClose={onClose} title={`${t.id} · ${r?.id} ${r?.name}`} width="max-w-3xl">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge tone={tripChip(t.status).tone} pulse={t.status === "in_progress"}>{tripChip(t.status).label}</Badge>
            <Badge tone={g.tone}>{g.label}</Badge>
            {t.delayMin > 0 && <Badge tone="late">+{t.delayMin}M</Badge>}
          </div>
          <KV k="Route" v={<span style={{ color: r?.color }}>{r?.id} · {r?.name} · {r?.direction}</span>} />
          <KV k="Driver" v={drvById(t.driverId)?.name ?? "UNASSIGNED"} />
          <KV k="Vehicle" v={`${vehById(t.vehicleId)?.plate ?? "—"} · ${vehById(t.vehicleId)?.type ?? ""}`} mono />
          <KV k="Planned / actual start" v={`${hhmm(t.plannedStart)} / ${t.actualStart ? hhmm(t.actualStart) : "—"}`} mono />
          <KV k="Last GPS update" v={`${hhmm(t.gps.lastUpdate)} · ${ago(t.gps.lastUpdate, now)}`} mono />
          <KV k="Route progress" v={`${Math.round(t.progress * 100)}%`} mono />

          <div className="mt-3 rounded-lg border border-ink-700 bg-ink-850 p-3">
            <p className="label mb-2">Fact vs claim — system evidence</p>
            <p className="mb-1 text-[12px] italic text-mist-400">
              Claim: “The bus never came.” — passenger at PP-13
            </p>
            {buildFacts(t, inc, s.config).map((f) => (
              <FactRow key={f.label} {...f} />
            ))}
            <p className="mt-2 text-[11px] leading-relaxed text-mist-500">
              Both the claim and the telemetry are stored as structured records. Approvals are decided on evidence, not on message history.
            </p>
          </div>
        </div>

        <div>
          <p className="label mb-2">Passenger manifest ({t.pax.length})</p>
          <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {t.pax.map((p) => {
              const emp = empById(p.empId);
              const pp = emp?.pickupId;
              const chip = paxChip(p.status);
              return (
                <li key={p.empId} className="flex items-center gap-2.5 rounded border border-ink-700 bg-ink-850 px-2.5 py-1.5">
                  <span className="num grid h-7 w-9 place-items-center rounded bg-ink-700 text-[12px] text-mist-300">{pp?.slice(3)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-mist-200">{emp?.name}</p>
                    <p className="font-mono text-[10px] text-mist-500">{pp} · {p.at ? hhmm(p.at) : "no event"}</p>
                  </div>
                  <Badge tone={chip.tone}>{chip.label}</Badge>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex flex-wrap gap-2">
            <Btn size="sm" onClick={() => setReassignOpen(true)}><I n="swap" s={13} /> Reassign</Btn>
            {t.status !== "completed" && t.status !== "cancelled" && (
              <Btn size="sm" tone="danger" onClick={() => setCancelOpen(true)}><I n="x" s={13} /> Cancel trip</Btn>
            )}
          </div>
        </div>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={`Cancel ${t.id}`} tone="crit">
        <Field label="Cancellation reason (stored to audit)">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            {["Vehicle unavailable", "Driver unavailable", "Route obstruction", "Safety decision", "Low demand"].map((o) => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <p className="mt-3 text-[12px] text-mist-400">{t.pax.length} passengers will be notified in-app instantly. Affected passengers may become auto-eligible for alternative transportation under POL-02.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setCancelOpen(false)}>Keep trip</Btn>
          <Btn tone="danger" onClick={() => { store.cancelTrip(t.id, reason); setCancelOpen(false); onClose(); }}>Cancel trip</Btn>
        </div>
      </Modal>

      <Modal open={reassignOpen} onClose={() => setReassignOpen(false)} title={`Reassign ${t.id}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Driver">
            <select className={inputCls} value={dSel} onChange={(e) => setDSel(e.target.value)}>
              {DRIVERS.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.id})</option>)}
            </select>
          </Field>
          <Field label="Vehicle">
            <select className={inputCls} value={vSel} onChange={(e) => setVSel(e.target.value)}>
              {VEHICLES.map((v) => <option key={v.id} value={v.id}>{v.plate} · {v.type}</option>)}
            </select>
          </Field>
        </div>
        <p className="mt-3 text-[12px] text-mist-500">Overlap and capacity checks run on save; the previous assignment is preserved in the audit trail.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setReassignOpen(false)}>Back</Btn>
          <Btn tone="primary" onClick={() => { store.reassignTrip(t.id, dSel, vSel); setReassignOpen(false); }}>Apply reassignment</Btn>
        </div>
      </Modal>
    </Modal>
  );
}

/* ---------- incident card ---------- */

function IncidentCard({ inc, now }: { inc: Incident; now: number }) {
  const s = useTms();
  const cfg = s.config;
  const slaMin = inc.severity === "P1" ? cfg.p1Ack : inc.severity === "P2" ? cfg.p2Ack : cfg.p3Ack;
  const ackBreached = inc.status === "created" && now - inc.createdAt > slaMin * 60000;
  const sev = sevChip(inc.severity);
  const [rc, setRc] = useState("Vehicle");
  const steps: Record<string, { label: string; to: Incident["status"]; tone?: "primary" | "ok" | "outline" }> = {
    created: { label: "Acknowledge", to: "acknowledged", tone: "primary" },
    acknowledged: { label: "Assign to me", to: "assigned" },
    assigned: { label: "Start investigating", to: "investigating" },
    investigating: { label: "Record action taken", to: "action_taken" },
    action_taken: { label: "Resolve with root cause", to: "resolved", tone: "ok" },
    resolved: { label: "Close case", to: "closed" },
  };
  const step = steps[inc.status];
  return (
    <div className={`rounded-lg border p-3 ${inc.status === "created" ? "border-warn/35 bg-warn/[0.04]" : "border-ink-700 bg-ink-850"} ${inc.severity === "P1" && inc.status === "created" ? "border-crit/50" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={sev.tone} pulse={inc.severity === "P1" && !["closed", "resolved"].includes(inc.status)}>{sev.label}</Badge>
        <span className="font-mono text-[11px] text-mist-500">{inc.id}</span>
        <span className="text-[12.5px] font-semibold text-mist-100">{inc.category}</span>
        {inc.tripId && <span className="font-mono text-[10.5px] text-gps">{inc.tripId}</span>}
        <span className="ml-auto font-mono text-[10.5px] text-mist-500">{ago(inc.createdAt, now)}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist-300">{inc.desc}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[10.5px] text-mist-500">
        <span>Reporter: {inc.reporter} ({inc.reporterRole})</span>
        <span>· Affected: {inc.affected}</span>
        {inc.owner && <span>· Owner: {inc.owner}</span>}
        {inc.rootCause && <span>· Root cause: {inc.rootCause}</span>}
        {inc.escalated && <span className="text-crit">· ESCALATED</span>}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Badge tone={["closed", "resolved"].includes(inc.status) ? "ok" : inc.status === "created" ? "warn" : "gps"}>
          {inc.status.replace("_", " ").toUpperCase()}
        </Badge>
        {inc.status === "created" && !ackBreached && (
          <span className={`font-mono text-[10.5px] ${slaMin * 60000 - (now - inc.createdAt) < 2 * 60000 ? "text-late" : "text-mist-500"}`}>
            ack SLA {slaRemaining(inc.createdAt + slaMin * 60000, now)}
          </span>
        )}
        {ackBreached && !inc.escalated && (
          <Btn size="sm" tone="danger" onClick={() => store.markEscalated(inc.id)}>
            <I n="alert" s={13} /> SLA breached — escalate now
          </Btn>
        )}
        {inc.escalated && inc.status === "created" && (
          <span className="font-mono text-[10.5px] text-crit">escalated → operator · manager · backup</span>
        )}
        {step && (
          <span className="ml-auto flex items-center gap-2">
            {["investigating", "action_taken"].includes(inc.status) && (
              <select value={rc} onChange={(e) => setRc(e.target.value)} className={`${inputCls} !w-40 !py-1 !text-[11.5px]`}>
                {ROOT_CAUSE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
            )}
            <Btn size="sm" tone={step.tone ?? "outline"} onClick={() => store.advanceIncident(inc.id, step.to, step.to === "resolved" ? rc : undefined)}>
              {step.label}
            </Btn>
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- uber card + approve modal ---------- */

function UberCard({ u, now, onApprove }: { u: UberRequest; now: number; onApprove: () => void }) {
  const emp = empById(u.empId);
  const chip = uberChip(u.status);
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-850 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[11px] text-mist-500">{u.id}</span>
        <span className="text-[13px] font-semibold text-mist-100">{emp?.name}</span>
        <span className="font-mono text-[10.5px] text-gps">{u.tripId ?? "no trip"}</span>
        <span className="ml-auto"><Badge tone={chip.tone} pulse={u.status === "pending_approval"}>{chip.label}</Badge></span>
      </div>
      <p className="mt-1 text-[12.5px] text-mist-300">{u.reason}</p>
      <p className="mt-0.5 font-mono text-[10.5px] text-mist-500">{u.rule}</p>
      {u.status === "pending_approval" && u.slaDue && (
        <p className={`mt-1.5 font-mono text-[11px] ${u.slaDue - now < 3 * 60000 ? "text-late" : "text-warn"}`}>
          Approval SLA: {slaRemaining(u.slaDue, now)} · then escalates to backup approver (never auto-approved)
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {u.status === "pending_approval" && (
          <>
            <Btn size="sm" tone="primary" onClick={onApprove}><I n="check" s={13} /> Review & approve</Btn>
            <Btn size="sm" tone="danger" onClick={() => store.rejectUber(u.id, "Evidence insufficient under policy")}>Reject</Btn>
          </>
        )}
        {u.status === "approved" && (
          <span className="text-[12px] text-mist-400">Limit {money(u.limit ?? 0)} · approver {u.approver} · awaiting ride completion</span>
        )}
        {u.status === "receipt_pending" && (
          <Btn size="sm" onClick={() => store.toast(`Reminder sent to ${emp?.name} — receipt due within window`, "info")}><I n="send" s={13} /> Nudge receipt</Btn>
        )}
        {u.status === "receipt_submitted" && u.receipt && (
          <span className="flex items-center gap-2 text-[12px] text-mist-400">
            {u.receipt.fileName} · {money(u.receipt.amount)} vs limit {money(u.limit ?? 0)}
            <Badge tone={validationChip(u.validation).tone}>{validationChip(u.validation).label}</Badge>
          </span>
        )}
      </div>
    </div>
  );
}

function ApproveModal({ u, onClose }: { u: UberRequest; onClose: () => void }) {
  const s = useTms();
  const emp = empById(u.empId);
  const t = s.trips.find((x) => x.id === u.tripId);
  const inc = s.incidents.filter((i) => i.tripId === u.tripId);
  const [limit, setLimit] = useState(Math.min(u.requestedAmount ?? s.config.uberMaxPerTrip, s.config.uberMaxPerTrip));
  const facts = u.facts.length > 0 ? u.facts : buildFacts(t, inc, s.config);
  return (
    <Modal open onClose={onClose} title={`Approve ${u.id}`} width="max-w-2xl" tone="ok">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <KV k="Passenger" v={`${emp?.name} (${u.empId})`} />
          <KV k="Reason" v={u.reason} />
          <KV k="Original transportation" v={u.tripId ? `${u.tripId} · ${routeById(t?.routeId ?? "")?.id ?? ""} · ${drvById(t?.driverId ?? null)?.name ?? "—"}` : "—"} />
          <KV k="Requested amount" v={u.requestedAmount ? money(u.requestedAmount) : "—"} mono />
          <KV k="Policy rule" v={u.rule} />
          <KV k="Per-trip cap (config)" v={money(s.config.uberMaxPerTrip)} mono />
          <div className="mt-3">
            <Field label="Approved limit ($)" hint={`Amounts above ${money(s.config.uberMaxPerTrip)} require exception approval and are blocked here.`}>
              <input type="number" className={inputCls} value={limit} min={1} max={999} onChange={(e) => setLimit(Number(e.target.value))} />
            </Field>
          </div>
        </div>
        <div>
          <p className="label mb-2">System evidence (fact, not claim)</p>
          <div className="rounded-lg border border-ink-700 bg-ink-900/60 px-3">
            {facts.map((f) => <FactRow key={f.label} ok={f.ok} label={f.label} detail={f.detail} />)}
          </div>
          <p className="mt-2 text-[11px] text-mist-500">Self-approval is blocked by POL-11. Every approval stores approver, timestamp, limit and rule.</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-ink-700 pt-3">
        <Btn onClick={onClose}>Back</Btn>
        <Btn tone="danger" onClick={() => { store.rejectUber(u.id, "Rejected after evidence review"); onClose(); }}>Reject request</Btn>
        <Btn tone="primary" onClick={() => { store.approveUber(u.id, limit); onClose(); }}><I n="check" s={14} /> Approve with limit</Btn>
      </div>
    </Modal>
  );
}
