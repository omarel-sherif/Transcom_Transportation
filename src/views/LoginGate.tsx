import { useEffect, useState } from "react";
import { PERSONAS, drvById, routeById } from "../lib/data";
import { hhmm } from "../lib/format";
import { store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Dot } from "../components/ui";

const ROLE_META: Record<string, { tone: string; label: string }> = {
  passenger: { tone: "bg-gps/15 text-gps border-gps/40", label: "PASSENGER" },
  driver: { tone: "bg-signal/15 text-signal border-signal/40", label: "DRIVER" },
  ops: { tone: "bg-ok/15 text-ok border-ok/40", label: "OPERATIONS" },
  manager: { tone: "bg-late/15 text-late border-late/40", label: "MANAGER" },
  finance: { tone: "bg-warn/15 text-warn border-warn/40", label: "FINANCE" },
  admin: { tone: "bg-mist-500/15 text-mist-300 border-mist-500/40", label: "ADMIN" },
};

export function LoginGate() {
  const s = useTms();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const rows = [...s.trips]
    .sort((a, b) => a.plannedStart - b.plannedStart)
    .map((t) => {
      const r = routeById(t.routeId);
      const status =
        t.status === "completed" ? { txt: "ARRIVED", cls: "text-ok" }
        : t.status === "cancelled" ? { txt: "CANCELLED", cls: "text-crit" }
        : t.status === "incident" ? { txt: "BREAKDOWN", cls: "text-crit blink" }
        : t.status === "in_progress"
          ? t.delayMin >= 20
            ? { txt: `DELAYED +${t.delayMin}′`, cls: "text-late blink" }
            : t.gps.state === "stale"
              ? { txt: "GPS STALE", cls: "text-late blink" }
              : { txt: "EN ROUTE", cls: "text-gps" }
          : t.plannedStart - now < 15 * 60000
            ? { txt: "BOARDING", cls: "text-signal blink" }
            : { txt: "ON TIME", cls: "text-mist-300" };
      return { t, r, status };
    });

  const active = s.trips.filter((t) => t.status === "in_progress" || t.status === "started").length;
  const delayed = s.trips.filter((t) => t.delayMin >= s.config.delayYellow && t.status !== "completed").length;
  const openInc = s.incidents.filter((i) => !["resolved", "closed"].includes(i.status)).length;

  return (
    <div className="bg-ops flex min-h-screen items-center justify-center p-4 lg:p-8">
      <div className="grid w-full max-w-6xl gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* left: brand + departures board */}
        <div className="rise flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
              <rect x="1" y="1" width="44" height="44" rx="9" fill="#121B28" stroke="#24344A" />
              <path d="M10 34 C 18 34, 15 16, 24 14" fill="none" stroke="#45C8E0" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M10 34 C 22 30, 26 24, 36 20" fill="none" stroke="#F5A524" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M10 34 C 20 36, 30 32, 36 28" fill="none" stroke="#57E0C0" strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="10" cy="34" r="3.4" fill="#E6EEF7" />
              <circle cx="36" cy="20" r="2.6" fill="#F5A524" />
              <circle cx="36" cy="28" r="2.6" fill="#57E0C0" />
              <circle cx="24" cy="14" r="2.6" fill="#45C8E0" />
            </svg>
            <div>
              <h1 className="num text-[34px] leading-none tracking-wide text-mist-100">
                FLEET<span className="text-signal">GRID</span>
              </h1>
              <p className="label mt-1">Corporate employee transit control</p>
            </div>
            <div className="ml-auto hidden text-right sm:block">
              <p className="font-mono text-[22px] text-mist-200">{new Date(now).toTimeString().slice(0, 8)}</p>
              <p className="label">{new Date(now).toDateString().slice(0, 10)} · SITE A</p>
            </div>
          </div>

          <div className="board tick-corner rounded-xl">
            <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2.5">
              <span className="label !text-signal">Live departures — inbound to Site A</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-gps">
                <Dot tone="ok" pulse s={6} /> FEED {active + 2} CH
              </span>
            </div>
            <div className="px-2 py-1 font-mono">
              <div className="board-row flex items-center gap-3 px-2 py-1.5 text-[10px] uppercase tracking-widest text-mist-500">
                <span className="w-14">Trip</span>
                <span className="w-40">Route</span>
                <span className="w-14">Plan</span>
                <span className="w-16">Driver</span>
                <span className="flex-1" />
                <span>Status</span>
              </div>
              {rows.map(({ t, r, status }, i) => (
                <div key={t.id} className={`board-row rise rise-${Math.min(i + 1, 5)} flex items-center gap-3 px-2 py-2 text-[12.5px]`}>
                  <span className="w-14 text-mist-400">{t.id.slice(3)}</span>
                  <span className="w-40 text-mist-200">
                    <span style={{ color: r?.color }}>{t.routeId}</span>
                    <span className="ml-1.5 hidden text-mist-500 sm:inline">{r?.name}</span>
                  </span>
                  <span className="w-14 text-mist-300">{hhmm(t.plannedStart)}</span>
                  <span className="w-16 truncate text-mist-400">{drvById(t.driverId)?.name.split(" ")[0] ?? "—"}</span>
                  <span className="flex-1" />
                  <span className={`${status.cls} text-[11.5px] font-semibold tracking-wider`}>{status.txt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[11px] text-mist-500">
            <span className="flex items-center gap-1.5"><I n="bus" s={13} c="text-signal" /> {active} trips live</span>
            <span className="flex items-center gap-1.5"><I n="alert" s={13} c="text-late" /> {delayed} delayed · {openInc} open incidents</span>
            <span className="flex items-center gap-1.5"><I n="radar" s={13} c="text-gps" /> GPS mesh nominal</span>
            <span className="flex items-center gap-1.5"><I n="lock" s={13} c="text-mist-400" /> RBAC · audit on</span>
            <span className="ml-auto font-mono">v2.4.1 · single source of truth</span>
          </div>
        </div>

        {/* right: persona select */}
        <div className="rise rise-2 panel-flat tick-corner self-start rounded-xl p-5">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-display text-[24px] font-semibold uppercase tracking-wide text-mist-100">Open a workspace</h2>
            <span className="label">demo access</span>
          </div>
          <p className="mb-4 text-[12.5px] leading-relaxed text-mist-400">
            Role-based access is enforced everywhere — each persona sees only the records, GPS detail and
            approvals their role permits. No WhatsApp required for any operational action.
          </p>
          <div className="space-y-2.5">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => store.login(p)}
                className="group flex w-full items-center gap-3 rounded-lg border border-ink-700 bg-ink-850 px-3.5 py-3 text-left transition-all duration-150 hover:border-signal/60 hover:bg-ink-800 hover:shadow-[0_0_24px_rgba(245,165,36,0.08)]"
              >
                <span className="num grid h-10 w-10 shrink-0 place-items-center rounded-md border border-ink-600 bg-ink-800 text-[17px] text-signal">
                  {p.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-mist-100">{p.name}</span>
                    <span className={`rounded border px-1.5 py-px text-[9px] font-bold tracking-widest ${ROLE_META[p.role].tone}`}>
                      {ROLE_META[p.role].label}
                    </span>
                  </span>
                  <span className="block truncate text-[11.5px] text-mist-500">{p.title}</span>
                </span>
                <span className="text-mist-500 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-signal">
                  <I n="chevron" s={18} />
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 border-t border-ink-700 pt-3 text-[11px] leading-relaxed text-mist-500">
            The application database is the operational source of truth. Every event below is a structured,
            auditable record — claims and telemetry are both stored, never conflated.
          </p>
        </div>
      </div>
    </div>
  );
}
