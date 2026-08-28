import { useState } from "react";
import type { Config } from "../lib/types";
import { ENTITIES, PERMISSION_MATRIX, STATUS_FLOWS } from "../lib/data";
import { store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Field, inputCls, Panel } from "../components/ui";

function NumField({ label, value, onChange, suffix }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) {
  return (
    <Field label={label}>
      <div className="relative">
        <input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-mist-500">{suffix}</span>}
      </div>
    </Field>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} className="flex w-full items-start gap-3 rounded-lg border border-ink-700 bg-ink-850 p-3 text-left transition hover:border-ink-500">
      <span className={`mt-0.5 grid h-5 w-9 shrink-0 place-items-center rounded-full border transition ${value ? "border-ok/60 bg-ok/20" : "border-ink-500 bg-ink-800"}`}>
        <span className={`h-3.5 w-3.5 rounded-full transition-all ${value ? "translate-x-2 bg-ok" : "-translate-x-2 bg-mist-500"}`} />
      </span>
      <span>
        <span className="block text-[13px] font-medium text-mist-100">{label}</span>
        <span className="block text-[11px] text-mist-500">{hint}</span>
      </span>
    </button>
  );
}

export function AdminView({ section }: { section: string }) {
  const s = useTms();
  const [draft, setDraft] = useState<Config>({ ...s.config });
  const up = (patch: Partial<Config>) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(s.config);

  if (section === "access") {
    const roles = ["passenger", "driver", "ops", "manager", "finance", "admin"];
    const cell = (v: string) =>
      v === "full" ? <Badge tone="ok">FULL</Badge>
      : v === "limited" ? <Badge tone="warn">LIMITED</Badge>
      : v === "view" ? <Badge tone="gps">VIEW</Badge>
      : <span className="text-mist-500">—</span>;
    return (
      <Panel title="Role / permission matrix — least privilege" icon="shield" pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[12.5px]">
            <thead>
              <tr className="label border-b border-ink-700 !text-[10px]">
                <th className="px-4 py-3 font-semibold">Capability</th>
                {roles.map((r) => <th key={r} className="px-3 py-3 text-center font-semibold">{r.toUpperCase()}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX.map((row) => (
                <tr key={row.cap} className="border-b border-ink-700/50 transition hover:bg-ink-800/40">
                  <td className="px-4 py-2.5 text-mist-200">{row.cap}</td>
                  {roles.map((r) => <td key={r} className="px-3 py-2.5 text-center">{cell(row.access[r] ?? "none")}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-ink-700 px-4 py-3 text-[11.5px] text-mist-500">
          Enforced in the service layer, not the UI only. Passengers never see other passengers' data, driver GPS history is limited to
          manager/admin, and self-approval is structurally impossible (POL-11).
        </p>
      </Panel>
    );
  }

  if (section === "model") {
    return (
      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Data model — 22 entities, unique IDs everywhere" icon="layers">
          <div className="flex flex-wrap gap-1.5">
            {ENTITIES.map((e) => (
              <span key={e} className="rounded border border-ink-600 bg-ink-850 px-2.5 py-1 font-mono text-[11px] text-mist-300 transition hover:border-signal/50 hover:text-signal">
                {e}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-mist-500">
            Presentation is separated from business logic; the data layer is swappable (Sheets MVP → SQL) without touching workflows.
            Every object carries a unique ID referenced across audit, GPS, finance and incident records.
          </p>
        </Panel>
        <Panel title="Controlled status models — no free-text states" icon="list">
          <div className="space-y-3">
            {STATUS_FLOWS.map((f) => (
              <div key={f.entity}>
                <p className="label mb-1 !text-signal">{f.entity}</p>
                <p className="rounded border border-ink-700 bg-ink-900/60 px-3 py-2 font-mono text-[11px] leading-relaxed text-mist-300">{f.flow}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="GPS privacy & retention" icon="radar">
          <ul className="space-y-2 text-[12.5px] leading-relaxed text-mist-300">
            <li className="flex gap-2.5"><I n="check" s={14} w={2.2} c="mt-0.5 shrink-0 text-ok" /> Tracking is active only during an operational trip — never 24/7.</li>
            <li className="flex gap-2.5"><I n="check" s={14} w={2.2} c="mt-0.5 shrink-0 text-ok" /> Pings every {s.config.gpsInterval}s while active; stopped automatically at trip end.</li>
            <li className="flex gap-2.5"><I n="check" s={14} w={2.2} c="mt-0.5 shrink-0 text-ok" /> Retention {s.config.gpsRetention} days, configurable, then purged.</li>
            <li className="flex gap-2.5"><I n="check" s={14} w={2.2} c="mt-0.5 shrink-0 text-ok" /> Historical movement visible to manager/admin only; passengers see trip facts, not tracks.</li>
            <li className="flex gap-2.5"><I n="check" s={14} w={2.2} c="mt-0.5 shrink-0 text-ok" /> Purpose (safety & operations, not surveillance) is stated in-driver before each trip.</li>
          </ul>
        </Panel>
        <Panel title="Communication policy" icon="send">
          <div className="space-y-3 text-[12.5px] leading-relaxed text-mist-300">
            <p>
              The application database is the <b className="text-signal">single source of truth</b>. WhatsApp remains available purely as an
              emergency backup channel and is never required to determine assignments, statuses, approvals or costs.
            </p>
            <div className="rounded-lg border border-ink-700 bg-ink-900/60 p-3 font-mono text-[11px] text-mist-400">
              channels: in-app (primary) · email · push (PWA) · SMS fallback (outages)<br />
              whatsapp: emergency-only · never a system dependency
            </div>
            <p className="text-[11.5px] text-mist-500">
              Offline-safe behavior: drivers continue trips, passengers report once connectivity returns, operators back-record with audit stamps.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  /* config */
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[12.5px] text-mist-400">
          Nothing here is hard-coded. Changes apply system-wide the moment they are saved — delay colours, the Uber
          eligibility engine, SLA timers and escalation ladders all read from this configuration.
        </p>
        <div className="flex items-center gap-2">
          {dirty && <Badge tone="warn">UNSAVED CHANGES</Badge>}
          <Btn tone="primary" disabled={!dirty} onClick={() => store.updateConfig(draft)}><I n="check" s={14} /> Save configuration</Btn>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Delay detection thresholds" icon="clock">
          <div className="space-y-3">
            <NumField label="Yellow — normal variance up to" value={draft.delayYellow} onChange={(n) => up({ delayYellow: n })} suffix="min" />
            <NumField label="Orange — monitor / approval trigger" value={draft.delayOrange} onChange={(n) => up({ delayOrange: n })} suffix="min" />
            <NumField label="Red — escalation / auto-eligibility" value={draft.delayRed} onChange={(n) => up({ delayRed: n })} suffix="min" />
          </div>
        </Panel>
        <Panel title="Uber limits & policy" icon="taxi">
          <div className="space-y-3">
            <NumField label="Max amount per trip" value={draft.uberMaxPerTrip} onChange={(n) => up({ uberMaxPerTrip: n })} suffix="$" />
            <NumField label="Max per employee / day" value={draft.uberDaily} onChange={(n) => up({ uberDaily: n })} suffix="$" />
            <NumField label="Max per employee / month" value={draft.uberMonthly} onChange={(n) => up({ uberMonthly: n })} suffix="$" />
            <NumField label="Receipt submission window" value={draft.receiptWindowDays} onChange={(n) => up({ receiptWindowDays: n })} suffix="days" />
          </div>
        </Panel>
        <Panel title="Approval SLA & escalation" icon="flag">
          <div className="space-y-3">
            <NumField label="Normal approval SLA" value={draft.slaNormal} onChange={(n) => up({ slaNormal: n })} suffix="min" />
            <NumField label="Urgent approval SLA" value={draft.slaUrgent} onChange={(n) => up({ slaUrgent: n })} suffix="min" />
            <NumField label="P1 acknowledge SLA" value={draft.p1Ack} onChange={(n) => up({ p1Ack: n })} suffix="min" />
            <NumField label="P2 acknowledge SLA" value={draft.p2Ack} onChange={(n) => up({ p2Ack: n })} suffix="min" />
            <NumField label="P3 acknowledge SLA" value={draft.p3Ack} onChange={(n) => up({ p3Ack: n })} suffix="min" />
          </div>
        </Panel>
        <Panel title="GPS configuration" icon="radar">
          <div className="space-y-3">
            <NumField label="Ping interval while trip active" value={draft.gpsInterval} onChange={(n) => up({ gpsInterval: n })} suffix="sec" />
            <NumField label="Location data retention" value={draft.gpsRetention} onChange={(n) => up({ gpsRetention: n })} suffix="days" />
            <NumField label="Passenger confirmation cutoff" value={draft.cutoffMin} onChange={(n) => up({ cutoffMin: n })} suffix="min before" />
          </div>
        </Panel>
        <div className="xl:col-span-2">
          <Panel title="Automatic eligibility rules" icon="gear">
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Toggle label="Auto-approve on confirmed breakdown" hint="POL-03 — vehicle breakdown / major failure evidence" value={draft.autoOnBreakdown} onChange={(b) => up({ autoOnBreakdown: b })} />
              <Toggle label="Auto-approve on cancelled transport" hint="POL-02 — company transportation cancelled or absent" value={draft.autoOnCancel} onChange={(b) => up({ autoOnCancel: b })} />
              <Toggle label="Auto-approve at red delay" hint={`POL-05 — delay ≥ ${draft.delayRed}m threshold`} value={draft.autoOnRedDelay} onChange={(b) => up({ autoOnRedDelay: b })} />
            </div>
            <p className="mt-3 border-t border-ink-700 pt-3 text-[11.5px] text-mist-500">
              SLA expiry never auto-approves — it escalates to the backup approver. Passenger-responsibility cases (POL-12) are always rejected regardless of these rules.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
