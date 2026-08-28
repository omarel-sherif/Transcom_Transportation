import { useEffect, useRef, useState } from "react";
import type { Role } from "./lib/types";
import { ago, hhmmss } from "./lib/format";
import { store, useTms } from "./lib/store";
import { I } from "./components/icons";
import { Dot } from "./components/ui";
import { LoginGate } from "./views/LoginGate";
import { OpsCenter } from "./views/OpsCenter";
import { DriverPortal } from "./views/DriverPortal";
import { PassengerPortal } from "./views/PassengerPortal";
import { ManagerDashboard } from "./views/ManagerDashboard";
import { FinanceView } from "./views/FinanceView";
import { AdminView } from "./views/AdminView";

const NAV: Record<string, { id: string; label: string; icon: string }[]> = {
  ops: [
    { id: "control", label: "Control Center", icon: "gauge" },
    { id: "trips", label: "Trips & Manifests", icon: "bus" },
    { id: "cases", label: "Incidents & Uber", icon: "taxi" },
    { id: "audit", label: "Audit Log", icon: "doc" },
  ],
  manager: [
    { id: "exec", label: "Executive", icon: "gauge" },
    { id: "cost", label: "Cost Analytics", icon: "card" },
    { id: "performance", label: "Performance", icon: "route" },
    { id: "uber", label: "Uber Analytics", icon: "taxi" },
    { id: "incidents", label: "Incidents", icon: "alert" },
  ],
  finance: [
    { id: "receipts", label: "Receipt Validation", icon: "file" },
    { id: "spend", label: "Spend Analytics", icon: "card" },
  ],
  admin: [
    { id: "config", label: "Configuration", icon: "gear" },
    { id: "access", label: "Access Matrix", icon: "shield" },
    { id: "model", label: "System Model", icon: "layers" },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  passenger: "Passenger", driver: "Driver", ops: "Transportation Ops",
  manager: "Transportation Manager", finance: "Finance", admin: "System Admin",
};

function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={small ? 28 : 34} height={small ? 28 : 34} viewBox="0 0 46 46" aria-hidden="true">
        <rect x="1" y="1" width="44" height="44" rx="9" fill="#121B28" stroke="#24344A" />
        <path d="M10 34 C 18 34, 15 16, 24 14" fill="none" stroke="#45C8E0" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M10 34 C 22 30, 26 24, 36 20" fill="none" stroke="#F5A524" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M10 34 C 20 36, 30 32, 36 28" fill="none" stroke="#57E0C0" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="10" cy="34" r="3.4" fill="#E6EEF7" />
        <circle cx="36" cy="20" r="2.6" fill="#F5A524" />
        <circle cx="36" cy="28" r="2.6" fill="#57E0C0" />
        <circle cx="24" cy="14" r="2.6" fill="#45C8E0" />
      </svg>
      {!small && (
        <div>
          <p className="num text-[19px] leading-none tracking-wide text-mist-100">FLEET<span className="text-signal">GRID</span></p>
          <p className="label mt-0.5 !text-[8.5px]">Transit control</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const s = useTms();
  const [now, setNow] = useState(Date.now());
  const [section, setSection] = useState("control");
  const [bellOpen, setBellOpen] = useState(false);
  const slaAlerted = useRef<Set<string>>(new Set());

  // wall clock
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // simulation + automatic escalation engine
  useEffect(() => {
    const id = setInterval(() => {
      store.tick();
      const st = store.state;
      for (const inc of st.incidents) {
        if (inc.status === "created" && !inc.escalated) {
          const sla = inc.severity === "P1" ? st.config.p1Ack : inc.severity === "P2" ? st.config.p2Ack : st.config.p3Ack;
          if (Date.now() - inc.createdAt > sla * 60000) store.markEscalated(inc.id);
        }
      }
      for (const u of st.ubers) {
        if (u.status === "pending_approval" && u.slaDue && Date.now() > u.slaDue && !slaAlerted.current.has(u.id)) {
          slaAlerted.current.add(u.id);
          store.log("System", "system", "APPROVAL_SLA_BREACHED", u.id, "pending_approval", "escalated to backup approver — NOT auto-approved");
          store.alert("warn", `Approval SLA breached — ${u.id} escalated to backup approver`, ["ops", "manager"]);
        }
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // reset section on role change
  useEffect(() => {
    if (s.user) setSection(NAV[s.user.role]?.[0]?.id ?? "control");
  }, [s.user?.id]);

  if (!s.user) return <LoginGate />;

  const role = s.user.role;
  const isPortal = role === "driver" || role === "passenger";
  const nav = NAV[role] ?? [];
  const myAlerts = s.alerts.filter((a) => a.audience.includes(role));
  const unread = myAlerts.filter((a) => !a.read).length;

  return (
    <div className="bg-ops min-h-screen">
      <div className={isPortal ? "" : "flex min-h-screen"}>
        {/* sidebar (console roles) */}
        {!isPortal && (
          <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-900/80 px-3 py-4 lg:flex">
            <div className="px-2"><Logo /></div>
            <p className="label mt-5 mb-2 px-2">{ROLE_LABEL[role]}</p>
            <nav className="space-y-1">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSection(n.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-150 ${
                    section === n.id ? "bg-ink-700 text-mist-100 shadow-[inset_2px_0_0_#F5A524]" : "text-mist-400 hover:bg-ink-800 hover:text-mist-200"
                  }`}
                >
                  <I n={n.icon} s={16} c={section === n.id ? "text-signal" : ""} />
                  {n.label}
                </button>
              ))}
            </nav>
            <div className="mt-auto space-y-2">
              <div className="rounded-lg border border-ink-700 bg-ink-850 p-3">
                <p className="flex items-center gap-2 text-[12px] font-semibold text-mist-200">
                  <Dot tone="ok" pulse s={6} /> System nominal
                </p>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-mist-500">
                  DB: source of truth · audit on<br />GPS mesh: {s.trips.filter((t) => t.gps.state === "live").length} live feeds
                </p>
              </div>
              <UserCard onSwitch={() => store.logout()} name={s.user.name} title={ROLE_LABEL[role]} initials={s.user.name.split(" ").map((w) => w[0]).join("")} />
            </div>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {/* topbar */}
          <header className="sticky top-0 z-40 border-b border-ink-700 bg-ink-900/85 backdrop-blur">
            <div className="flex items-center gap-3 px-3 py-2.5 lg:px-6">
              {isPortal && <Logo small />}
              {!isPortal && (
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[21px] font-semibold uppercase tracking-wide text-mist-100">
                    {nav.find((n) => n.id === section)?.label ?? "Control"}
                  </h2>
                  <p className="hidden text-[10.5px] text-mist-500 sm:block">Site A · inbound operations · {new Date(now).toDateString()}</p>
                </div>
              )}
              {isPortal && (
                <div className="min-w-0">
                  <h2 className="truncate font-display text-[19px] font-semibold uppercase tracking-wide text-mist-100">
                    {role === "driver" ? "Driver Portal" : "My Transportation"}
                  </h2>
                  <p className="text-[10.5px] text-mist-500">{s.user.name} · {ROLE_LABEL[role]}</p>
                </div>
              )}

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <span className="hidden items-center gap-1.5 rounded-md border border-gps/30 bg-gps/5 px-2 py-1 font-mono text-[10.5px] text-gps md:flex">
                  <Dot tone="gps" pulse s={5} /> GPS MESH
                </span>
                <span className="hidden font-mono text-[13px] text-mist-300 sm:block">{hhmmss(now)}</span>

                {/* bell */}
                <div className="relative">
                  <button
                    onClick={() => { setBellOpen((o) => !o); if (!bellOpen) store.markAlertsRead(role); }}
                    className="relative rounded-md border border-ink-600 bg-ink-850 p-2 text-mist-300 transition hover:border-mist-500 hover:text-mist-100"
                    aria-label="Alerts"
                  >
                    <I n="bell" s={16} />
                    {unread > 0 && (
                      <span className="num absolute -right-1.5 -top-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-crit px-1 text-[10px] text-ink-950" style={{ height: 18, minWidth: 18 }}>
                        {unread}
                      </span>
                    )}
                  </button>
                  {bellOpen && (
                    <div className="toast-in absolute right-0 top-11 w-80 panel-flat overflow-hidden shadow-2xl shadow-black/60">
                      <div className="flex items-center justify-between border-b border-ink-700 px-3 py-2">
                        <span className="label">Alert engine</span>
                        <button onClick={() => setBellOpen(false)} className="text-mist-500 hover:text-mist-100"><I n="x" s={13} /></button>
                      </div>
                      <ul className="max-h-80 divide-y divide-ink-700/60 overflow-y-auto">
                        {myAlerts.length === 0 && <li className="px-3 py-6 text-center text-[12px] text-mist-500">No alerts for your role.</li>}
                        {myAlerts.slice(0, 12).map((a) => (
                          <li key={a.id} className="flex items-start gap-2.5 px-3 py-2.5">
                            <Dot tone={a.sev === "critical" ? "crit" : a.sev === "warn" ? "warn" : "gps"} s={7} />
                            <div className="min-w-0">
                              <p className="text-[12px] leading-snug text-mist-200">{a.text}</p>
                              <p className="font-mono text-[9.5px] text-mist-500">{ago(a.ts, now)} · in-app{a.sev === "critical" ? " · push · sms" : ""}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {isPortal && (
                  <button onClick={() => store.logout()} className="flex items-center gap-1.5 rounded-md border border-ink-600 bg-ink-850 px-2.5 py-2 text-[11.5px] text-mist-300 transition hover:border-signal/50 hover:text-signal">
                    <I n="swap" s={13} /> Switch
                  </button>
                )}
                {!isPortal && (
                  <div className="hidden md:block">
                    <UserCard compact onSwitch={() => store.logout()} name={s.user.name} title={ROLE_LABEL[role]} initials={s.user.name.split(" ").map((w) => w[0]).join("")} />
                  </div>
                )}
              </div>
            </div>

            {/* mobile section nav */}
            {!isPortal && (
              <div className="flex gap-1 overflow-x-auto border-t border-ink-700/70 px-3 py-1.5 lg:hidden">
                {nav.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition ${section === n.id ? "bg-ink-700 text-signal" : "text-mist-400"}`}
                  >
                    <I n={n.icon} s={13} /> {n.label}
                  </button>
                ))}
              </div>
            )}

            {/* live ticker for console roles */}
            {!isPortal && (
              <div className="hidden overflow-hidden border-t border-ink-700/70 bg-ink-950/60 lg:block">
                <div className="ticker flex w-max items-center gap-8 whitespace-nowrap px-4 py-1 font-mono text-[10.5px] text-mist-500">
                  {[0, 1].map((k) => (
                    <span key={k} className="flex items-center gap-8">
                      <span className="text-gps">● {s.trips.filter((t) => t.status === "in_progress").length} trips live</span>
                      {s.alerts.slice(0, 5).map((a) => (
                        <span key={a.id + k} className={a.sev === "critical" ? "text-crit" : a.sev === "warn" ? "text-warn" : ""}>{a.text}</span>
                      ))}
                      <span>delay thresholds {s.config.delayYellow}/{s.config.delayOrange}/{s.config.delayRed}m</span>
                      <span>GPS interval {s.config.gpsInterval}s</span>
                      <span className="text-signal">single source of truth — no WhatsApp required</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* content */}
          <main className={isPortal ? "" : "px-3 py-4 lg:px-6"}>
            {role === "driver" && <DriverPortal now={now} />}
            {role === "passenger" && <PassengerPortal now={now} />}
            {role === "ops" && <OpsCenter section={section} now={now} />}
            {role === "manager" && <ManagerDashboard section={section} />}
            {role === "finance" && <FinanceView section={section} now={now} />}
            {role === "admin" && <AdminView section={section} />}
          </main>
        </div>
      </div>

      {/* toasts */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-80 flex-col gap-2">
        {s.toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[12.5px] shadow-xl shadow-black/50 backdrop-blur ${
              t.tone === "ok" ? "border-ok/40 bg-[#0d1a14]/95 text-ok"
              : t.tone === "warn" ? "border-warn/40 bg-[#1a1608]/95 text-warn"
              : t.tone === "err" ? "border-crit/40 bg-[#1a0d0d]/95 text-crit"
              : "border-ink-600 bg-ink-850/95 text-mist-200"
            }`}
          >
            <I n={t.tone === "ok" ? "check" : t.tone === "err" ? "x" : t.tone === "warn" ? "alert" : "bell"} s={15} w={2} />
            <span className="leading-snug">{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserCard({ name, title, initials, onSwitch, compact = false }: { name: string; title: string; initials: string; onSwitch: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onSwitch}
      title="Switch role"
      className={`flex w-full items-center gap-2.5 rounded-lg border border-ink-700 bg-ink-850 text-left transition hover:border-signal/50 ${compact ? "px-2 py-1.5" : "p-2.5"}`}
    >
      <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-md border border-ink-600 bg-ink-800 text-[13px] text-signal">{initials}</span>
      {!compact && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12.5px] font-semibold text-mist-100">{name}</span>
          <span className="block truncate text-[10px] text-mist-500">{title}</span>
        </span>
      )}
      <I n="swap" s={13} c="text-mist-500" />
    </button>
  );
}
