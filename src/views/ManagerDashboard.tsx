import { useMemo } from "react";
import {
  APPROVAL_TREND, COST_PER_PAX, DRIVER_PUNCT, FLEET_COST_K, INCIDENT_TREND, KPI_30D, MONTHS,
  PEAK_DAYS, PEAK_HEAT, PEAK_SLOTS, PUNCTUAL_BY_ROUTE, RESOLUTION_HRS, ROOT_CAUSES, SEV_MIX,
  UBER_BY_EMPLOYEE, UBER_BY_ROUTE, UBER_COST_K, UTILIZATION,
} from "../lib/data";
import { downloadCsv, money } from "../lib/format";
import { useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Panel } from "../components/ui";
import { Donut, GroupBars, HBars, Heat, SegDonut, Spark } from "../components/charts";

function Kpi({ label, value, sub, tone = "text-mist-100" }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="panel-flat rounded-lg px-3.5 py-3">
      <p className="label">{label}</p>
      <p className={`num mt-1 text-[26px] leading-none ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-[10.5px] text-mist-500">{sub}</p>}
    </div>
  );
}

export function ManagerDashboard({ section }: { section: string }) {
  const s = useTms();
  const cfg = s.config;

  const today = useMemo(() => {
    const trips = s.trips;
    const completed = trips.filter((t) => t.status === "completed");
    const cancelled = trips.filter((t) => t.status === "cancelled");
    const delayed = trips.filter((t) => t.delayMin >= cfg.delayYellow && !["completed", "cancelled"].includes(t.status));
    const allPax = trips.flatMap((t) => t.pax);
    const ubers = s.ubers;
    const uberCost = ubers.reduce((n, u) => n + (u.receipt?.amount ?? 0), 0);
    const onTime = completed.filter((t) => t.delayMin < cfg.delayYellow).length;
    return {
      tripsPlanned: trips.length,
      tripsCompleted: completed.length,
      tripsCancelled: cancelled.length,
      tripsDelayed: delayed.length,
      paxScheduled: allPax.length,
      paxConfirmed: allPax.filter((p) => ["confirmed", "boarded"].includes(p.status)).length,
      paxBoarded: allPax.filter((p) => p.status === "boarded").length,
      paxNoShow: allPax.filter((p) => p.status === "no_show").length,
      paxCancelled: allPax.filter((p) => p.status === "cancelled").length,
      incTotal: s.incidents.length,
      incP1: s.incidents.filter((i) => i.severity === "P1").length,
      incP2: s.incidents.filter((i) => i.severity === "P2").length,
      incP3: s.incidents.filter((i) => i.severity === "P3").length,
      ubRequests: ubers.length,
      ubApproved: ubers.filter((u) => !["rejected"].includes(u.status)).length,
      ubRejected: ubers.filter((u) => u.status === "rejected").length,
      ubUnauthorized: ubers.filter((u) => u.status === "unauthorized").length,
      ubReceiptsPending: ubers.filter((u) => ["approved", "receipt_pending"].includes(u.status) && !u.receipt).length,
      ubCost: uberCost,
      onTimePct: completed.length ? Math.round((onTime / completed.length) * 100) : 100,
      avgDelay: (trips.reduce((n, t) => n + t.delayMin, 0) / Math.max(1, trips.length)).toFixed(1),
      utilization: Math.round(UTILIZATION.reduce((n, u) => n + u.value, 0) / UTILIZATION.length),
    };
  }, [s.trips, s.incidents, s.ubers, cfg.delayYellow]);

  const reportRows: (string | number)[][] = [
    ["Metric", "Value"],
    ["Trips planned", today.tripsPlanned], ["Trips completed", today.tripsCompleted],
    ["Trips cancelled", today.tripsCancelled], ["Trips delayed", today.tripsDelayed],
    ["Passengers scheduled", today.paxScheduled], ["Passengers confirmed", today.paxConfirmed],
    ["Passengers boarded", today.paxBoarded], ["No-shows", today.paxNoShow], ["Cancelled seats", today.paxCancelled],
    ["Incidents total", today.incTotal], ["P1", today.incP1], ["P2", today.incP2], ["P3", today.incP3],
    ["Uber requests", today.ubRequests], ["Uber approved", today.ubApproved], ["Uber rejected", today.ubRejected],
    ["Unauthorized Uber", today.ubUnauthorized], ["Receipts pending", today.ubReceiptsPending],
    ["Uber cost (receipts)", today.ubCost.toFixed(2)],
    ["On-time %", today.onTimePct], ["Average delay (min)", today.avgDelay],
    ["Utilization %", today.utilization], ["Cost per passenger ($)", KPI_30D.costPerPax],
  ];

  return (
    <div className="space-y-4">
      {section === "exec" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            <Kpi label="On-time departure" value={`${KPI_30D.onTimeDepart}%`} tone="text-ok" sub="30-day" />
            <Kpi label="On-time pickup" value={`${KPI_30D.onTimePickup}%`} tone="text-ok" sub="30-day" />
            <Kpi label="Avg delay" value={`${KPI_30D.avgDelay}m`} sub="per delayed trip" />
            <Kpi label="No-show rate" value={`${KPI_30D.noShowRate}%`} sub="of confirmed" />
            <Kpi label="Trip completion" value={`${KPI_30D.completion}%`} tone="text-ok" sub="30-day" />
            <Kpi label="GPS availability" value={`${KPI_30D.gpsAvail}%`} tone="text-gps" sub="active trips" />
            <Kpi label="Incident rate" value={`${KPI_30D.incidentRate}`} sub="per 100 trips" />
            <Kpi label="Cost / passenger" value={`$${KPI_30D.costPerPax}`} tone="text-signal" sub="blended" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <Panel
              title="Daily operations report — auto-generated" icon="doc" live
              right={<Btn size="sm" tone="ghost" onClick={() => downloadCsv("fleetgrid_daily_report.csv", reportRows)}><I n="download" s={13} /> Export CSV</Btn>}
            >
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="label mb-2 !text-signal">Trips</p>
                  <ReportRow k="Planned" v={String(today.tripsPlanned)} />
                  <ReportRow k="Completed" v={String(today.tripsCompleted)} tone="text-ok" />
                  <ReportRow k="Delayed" v={String(today.tripsDelayed)} tone={today.tripsDelayed ? "text-late" : undefined} />
                  <ReportRow k="Cancelled" v={String(today.tripsCancelled)} />
                </div>
                <div>
                  <p className="label mb-2 !text-gps">Passengers</p>
                  <ReportRow k="Scheduled" v={String(today.paxScheduled)} />
                  <ReportRow k="Confirmed" v={String(today.paxConfirmed)} />
                  <ReportRow k="Boarded" v={String(today.paxBoarded)} tone="text-ok" />
                  <ReportRow k="No-show" v={String(today.paxNoShow)} tone={today.paxNoShow ? "text-crit" : undefined} />
                </div>
                <div>
                  <p className="label mb-2 !text-crit">Incidents</p>
                  <ReportRow k="Total" v={String(today.incTotal)} />
                  <ReportRow k="P1 critical" v={String(today.incP1)} tone={today.incP1 ? "text-crit" : undefined} />
                  <ReportRow k="P2 major" v={String(today.incP2)} tone="text-late" />
                  <ReportRow k="P3 operational" v={String(today.incP3)} />
                </div>
                <div>
                  <p className="label mb-2 !text-warn">Uber</p>
                  <ReportRow k="Requests" v={String(today.ubRequests)} />
                  <ReportRow k="Unauthorized" v={String(today.ubUnauthorized)} tone={today.ubUnauthorized ? "text-crit" : undefined} />
                  <ReportRow k="Receipts pending" v={String(today.ubReceiptsPending)} />
                  <ReportRow k="Cost (receipts)" v={money(today.ubCost)} tone="text-signal" />
                </div>
              </div>
              <p className="mt-4 border-t border-ink-700 pt-3 text-[11.5px] text-mist-500">
                Generated from structured trip, boarding, incident and finance records — no manual compilation, no WhatsApp archaeology.
              </p>
            </Panel>

            <Panel title="Root causes — recurring issues (30d)" icon="gauge">
              <HBars items={ROOT_CAUSES} color="#FF8A3D" />
              <p className="mt-3 text-[11.5px] leading-relaxed text-mist-500">
                Managers classify root cause on resolution. <b className="text-mist-300">Vehicle</b> leads this cycle —
                VH-15 breakdowns suggest provider maintenance SLA review, not driver behaviour.
              </p>
            </Panel>
          </div>
        </>
      )}

      {section === "cost" && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <Kpi label="Fleet cost (Jun)" value="$43.1k" sub="planned transportation" />
            <Kpi label="Uber spend (Jun)" value="$6.4k" tone="text-late" sub="+8.5% vs May — failures drive spend" />
            <Kpi label="Avg Uber trip" value="$23.40" sub="approved requests" />
            <Kpi label="Unauthorized" value={`${KPI_30D.unauthorizedCount}`} tone="text-crit" sub="never auto-reimbursed" />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Transportation cost by month ($k)" icon="card">
              <GroupBars labels={MONTHS} a={FLEET_COST_K} b={UBER_COST_K} aLabel="Planned fleet" bLabel="Uber / alternative" unit="k" />
            </Panel>
            <Panel title="Uber cost by route (180d, $)" icon="taxi">
              <HBars items={UBER_BY_ROUTE.map((u) => ({ label: u.label, value: u.value }))} unit="$" color="#F5A524" />
              <p className="mt-3 text-[11.5px] text-mist-500">R14 and R31 dominate — both have open punctuality issues this morning. Cost of failures, not demand.</p>
            </Panel>
            <Panel title="Uber cost by employee (180d, $)" icon="users">
              <HBars items={UBER_BY_EMPLOYEE.map((u) => ({ label: u.label, value: u.value }))} unit="$" color="#45C8E0" />
            </Panel>
            <Panel title="Cost per passenger trend ($)" icon="pulse">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="num text-[42px] leading-none text-signal">$3.40</p>
                  <p className="mt-1 text-[11.5px] text-mist-500">June blended · target ≤ $3.25</p>
                </div>
                <Spark data={COST_PER_PAX} color="#F5A524" w={220} h={64} />
              </div>
              <p className="mt-3 border-t border-ink-700 pt-3 text-[11.5px] text-mist-500">
                Every 1% drop in on-time pickup adds ≈ $0.09 per passenger through alternative transportation.
              </p>
            </Panel>
          </div>
        </>
      )}

      {section === "performance" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Route punctuality — on-time pickup %" icon="route">
            <HBars items={PUNCTUAL_BY_ROUTE.map((p) => ({ label: p.label, value: p.value }))} unit="%" color="#43D98B" maxOverride={100} />
          </Panel>
          <Panel title="Driver punctuality (30d)" icon="users" pad={false}>
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="label border-b border-ink-700 !text-[10px]">
                  {["Driver", "Provider", "On-time %", "Trips", "Avg delay"].map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {DRIVER_PUNCT.map((d) => (
                  <tr key={d.id} className="border-b border-ink-700/50">
                    <td className="px-4 py-2.5"><span className="font-medium text-mist-100">{d.name}</span> <span className="font-mono text-[10px] text-mist-500">{d.id}</span></td>
                    <td className="px-4 py-2.5 text-mist-400">{d.id === "DRV-01" || d.id === "DRV-03" ? "Metro Shuttle" : d.id === "DRV-05" ? "CityLink" : "Gulf Transit"}</td>
                    <td className={`px-4 py-2.5 font-mono ${d.onTime >= 95 ? "text-ok" : d.onTime >= 88 ? "text-warn" : "text-late"}`}>{d.onTime}%</td>
                    <td className="px-4 py-2.5 font-mono text-mist-300">{d.trips}</td>
                    <td className="px-4 py-2.5 font-mono text-mist-300">{d.avgDelay}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="Vehicle / route utilization %" icon="gauge">
            <HBars items={UTILIZATION.map((u) => ({ label: `Route ${u.label}`, value: u.value, hint: u.value < 70 ? "underutilized" : undefined }))} unit="%" color="#45C8E0" maxOverride={100} />
            <p className="mt-3 text-[11.5px] text-mist-500">R45 at 61% — candidate for schedule merge with R07 morning block.</p>
          </Panel>
          <Panel title="Peak transportation demand" icon="clock">
            <Heat rows={PEAK_DAYS} cols={PEAK_SLOTS} values={PEAK_HEAT} />
            <p className="mt-2 text-[11.5px] text-mist-500">07:30 inbound is the system peak — capacity and cutoffs are planned against it.</p>
          </Panel>
        </div>
      )}

      {section === "uber" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Approval outcome (30d)" icon="taxi">
            <Donut value={KPI_30D.uberApprovalRate} label="approved" color="#43D98B" sub="78% of requests approved — 22% rejected by policy rules before reaching a human." />
          </Panel>
          <Panel title="Approval rate trend" icon="pulse">
            <Spark data={APPROVAL_TREND} color="#43D98B" w={260} h={70} />
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-ink-800 py-2.5"><p className="num text-[22px] text-warn">{cfg.slaNormal}m</p><p className="label">Normal SLA</p></div>
              <div className="rounded-lg bg-ink-800 py-2.5"><p className="num text-[22px] text-crit">{cfg.slaUrgent}m</p><p className="label">Urgent SLA</p></div>
            </div>
            <p className="mt-2 text-[11px] text-mist-500">SLA breach escalates to the backup approver — it never auto-approves.</p>
          </Panel>
          <Panel title="Control signals" icon="shield">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                <span className="text-[12.5px] text-mist-300">Unauthorized rides (30d)</span>
                <Badge tone="crit">{KPI_30D.unauthorizedCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                <span className="text-[12.5px] text-mist-300">Receipts missing today</span>
                <Badge tone={today.ubReceiptsPending ? "warn" : "ok"}>{today.ubReceiptsPending}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                <span className="text-[12.5px] text-mist-300">Auto-approvals (evidence-based)</span>
                <Badge tone="ok">{s.ubers.filter((u) => u.decision === "auto").length} today</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-ink-700 bg-ink-850 px-3 py-2.5">
                <span className="text-[12.5px] text-mist-300">Avg Uber cost</span>
                <span className="font-mono text-[12.5px] text-signal">$23.40</span>
              </div>
              <p className="pt-1 text-[11px] leading-relaxed text-mist-500">
                Per-trip cap {money(cfg.uberMaxPerTrip)} · daily {money(cfg.uberDaily)} · monthly {money(cfg.uberMonthly)} — all configurable, all enforced at approval time.
              </p>
            </div>
          </Panel>
        </div>
      )}

      {section === "incidents" && (
        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Severity mix (30d)" icon="alert">
            <SegDonut parts={SEV_MIX} />
          </Panel>
          <Panel title="Resolution time by severity (hrs)" icon="clock">
            <HBars items={RESOLUTION_HRS.map((r0) => ({ label: r0.label, value: r0.value }))} color="#FF5C5C" />
            <p className="mt-3 text-[11.5px] text-mist-500">P1 median 30 min — within the 2-minute acknowledge / immediate-escalation policy.</p>
          </Panel>
          <Panel title="Incident frequency by month" icon="pulse">
            <GroupBars labels={MONTHS} a={INCIDENT_TREND} b={INCIDENT_TREND.map(() => 0)} aLabel="Incidents" bLabel="" aColor="#FF8A3D" bColor="#FF8A3D" />
            <div className="mt-2 flex items-center gap-2 text-[11.5px] text-mist-500">
              <Badge tone={KPI_30D.incidentRate < 0.5 ? "ok" : "warn"}>{KPI_30D.incidentRate} / 100 trips</Badge>
              GPS availability <span className="font-mono text-gps">{KPI_30D.gpsAvail}%</span>
            </div>
          </Panel>
          <div className="xl:col-span-3">
            <Panel title="Escalation policy (configurable)" icon="shield">
              <div className="grid gap-3 text-[12.5px] text-mist-300 sm:grid-cols-3">
                <div className="rounded-lg border border-crit/30 bg-crit/5 p-3">
                  <p className="font-semibold text-crit">P1 — Critical</p>
                  <p className="mt-1 text-mist-400">Acknowledge ≤ {cfg.p1Ack}m, else auto-escalate: operator → manager → backup. Emergency contacts notified immediately. App never replaces emergency services.</p>
                </div>
                <div className="rounded-lg border border-late/30 bg-late/5 p-3">
                  <p className="font-semibold text-late">P2 — Major</p>
                  <p className="mt-1 text-mist-400">Acknowledge ≤ {cfg.p2Ack}m. Transportation operations alerted immediately; alternative-transport eligibility may trigger.</p>
                </div>
                <div className="rounded-lg border border-warn/30 bg-warn/5 p-3">
                  <p className="font-semibold text-warn">P3 / P4</p>
                  <p className="mt-1 text-mist-400">Operational case, acknowledge ≤ {cfg.p3Ack}m, resolution with root cause required. P4 recorded for reporting only.</p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink-700/50 py-1.5">
      <span className="text-[12px] text-mist-500">{k}</span>
      <span className={`num text-[17px] ${tone ?? "text-mist-200"}`}>{v}</span>
    </div>
  );
}
