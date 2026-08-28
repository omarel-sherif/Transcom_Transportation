import { useMemo, useState } from "react";
import { DRIVERS, INCIDENT_CATEGORIES, POINTS, empById, routeById, vehById } from "../lib/data";
import { hhmm, minsBetween } from "../lib/format";
import { store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Field, inputCls, Modal, ProgressBar, tripChip, paxChip } from "../components/ui";

export function DriverPortal({ now }: { now: number }) {
  const s = useTms();
  const driver = DRIVERS.find((d) => d.id === s.user?.refId) ?? DRIVERS[0];
  const myTrips = s.trips.filter((t) => t.driverId === driver.id);
  const active = myTrips.find((t) => t.status === "in_progress" || t.status === "started");
  const [sel, setSel] = useState<string | null>(active?.id ?? myTrips[0]?.id ?? null);
  const trip = myTrips.find((t) => t.id === sel) ?? null;

  return (
    <div className="mx-auto w-full max-w-md px-3 pb-24 pt-4">
      {/* driver header */}
      <div className="rise panel-flat tick-corner rounded-xl p-4">
        <div className="flex items-center gap-3">
          <span className="num grid h-12 w-12 place-items-center rounded-lg border border-signal/40 bg-signal/10 text-[20px] text-signal">
            {driver.name.split(" ").map((w) => w[0]).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-[22px] font-semibold uppercase tracking-wide text-mist-100">{driver.name}</h2>
            <p className="truncate text-[11.5px] text-mist-400">{driver.provider} · {driver.id} · license <span className={driver.license === "valid" ? "text-ok" : "text-warn"}>{driver.license.toUpperCase()}</span></p>
          </div>
          <Badge tone={active ? "gps" : "idle"} pulse={!!active}>{active ? "ON TRIP" : "ON DUTY"}</Badge>
        </div>
      </div>

      {/* trip list */}
      <p className="label mt-5 mb-2 px-1">Today's trips — {myTrips.length}</p>
      <div className="space-y-2.5">
        {myTrips.map((t, i) => {
          const r = routeById(t.routeId);
          const isSel = sel === t.id;
          const chip = tripChip(t.status);
          return (
            <button
              key={t.id}
              onClick={() => setSel(t.id)}
              className={`rise rise-${i + 1} w-full rounded-xl border p-4 text-left transition-all duration-150 ${isSel ? "border-signal/60 bg-ink-800 shadow-[0_0_24px_rgba(245,165,36,0.1)]" : "border-ink-700 bg-ink-850 hover:border-ink-500"}`}
            >
              <div className="flex items-center gap-3">
                <span className="num rounded-md px-2.5 py-1 text-[18px]" style={{ color: r?.color, background: `${r?.color}14`, border: `1px solid ${r?.color}55` }}>
                  {t.routeId}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2">
                    <span className="num text-[26px] leading-none text-mist-100">{hhmm(t.plannedStart)}</span>
                    <span className="text-[12px] text-mist-400">{r?.name}</span>
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-mist-500">
                    {vehById(t.vehicleId)?.plate} · {t.pax.length} passengers · {r?.stops.length} stops
                    {t.delayMin > 0 && <span className="ml-1 font-mono text-late">+{t.delayMin}m</span>}
                  </p>
                </div>
                <Badge tone={chip.tone} pulse={t.status === "in_progress"}>{chip.label}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      {trip && <TripScreen key={trip.id} tripId={trip.id} now={now} driverName={driver.name} />}

      <p className="mt-6 px-2 text-center text-[10.5px] leading-relaxed text-mist-500">
        All operational actions happen here — no WhatsApp needed. Location is shared only while a trip is
        active and stops automatically when the trip ends.
      </p>
    </div>
  );
}

function TripScreen({ tripId, now, driverName }: { tripId: string; now: number; driverName: string }) {
  const s = useTms();
  const t = s.trips.find((x) => x.id === tripId);
  const [delayOpen, setDelayOpen] = useState(false);
  const [incOpen, setIncOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [delayMin, setDelayMin] = useState(10);
  const [cat, setCat] = useState("Traffic");
  const [desc, setDesc] = useState("");

  if (!t) return null;
  const r = routeById(t.routeId);
  const boarded = t.pax.filter((p) => p.status === "boarded").length;
  const noShow = t.pax.filter((p) => p.status === "no_show").length;
  const isActive = t.status === "in_progress" || t.status === "started";
  const duration = t.actualStart ? minsBetween(t.actualStart, t.endedAt ?? now) : 0;

  const byStop = useMemo(() => {
    const stops = r?.stops ?? [];
    return stops.map((sp) => ({ sp, pax: t.pax.filter((p) => p.pickupId === sp) })).filter((g) => g.pax.length > 0);
  }, [r, t]);

  return (
    <div className="rise mt-5 space-y-3">
      {/* status / start */}
      {t.status === "scheduled" && (
        <div className="panel-flat rounded-xl p-4 text-center">
          <p className="label">Departure {hhmm(t.plannedStart)} · {r?.stops.length} stops · {t.pax.length} pax</p>
          <Btn tone="primary" size="xl" className="mt-3 w-full !text-[17px]" onClick={() => store.startTrip(t.id)}>
            <I n="play" s={20} w={2} /> START TRIP
          </Btn>
          <p className="mt-2 text-[10.5px] text-mist-500">Records time, driver, vehicle, trip ID and GPS position.</p>
        </div>
      )}

      {isActive && (
        <>
          <div className="panel-flat rounded-xl p-4">
            <div className="flex items-center justify-between">
              <p className="num text-[24px] text-mist-100">{t.id} <span className="text-[16px]" style={{ color: r?.color }}>· {t.routeId}</span></p>
              {t.gps.state === "live" ? <Badge tone="gps" pulse>LIVE GPS</Badge> : <Badge tone="late">GPS STALE</Badge>}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={t.progress} tone={t.gps.state === "live" ? "gps" : "late"} h={9} />
              <span className="shrink-0 font-mono text-[12px] text-mist-400">{Math.round(t.progress * 100)}%</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-ink-800 py-2">
                <p className="num text-[22px] text-ok">{boarded}</p>
                <p className="label">Boarded</p>
              </div>
              <div className="rounded-lg bg-ink-800 py-2">
                <p className="num text-[22px] text-crit">{noShow}</p>
                <p className="label">No-show</p>
              </div>
              <div className="rounded-lg bg-ink-800 py-2">
                <p className="num text-[22px] text-mist-200">{duration}m</p>
                <p className="label">Duration</p>
              </div>
            </div>
            <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[11.5px] ${t.gps.state === "live" ? "border-gps/30 bg-gps/5 text-gps" : "border-late/30 bg-late/5 text-late"}`}>
              <I n="radar" s={15} />
              <span>
                {t.gps.state === "live"
                  ? `Location sharing active — ping every ${s.config.gpsInterval}s while trip is active. Tracking stops automatically at trip end. Ops can see this trip only.`
                  : "GPS signal lost — ops see your last fix, not a live position. Tracking resumes when signal returns."}
                <span className="ml-1 font-mono text-[10px] opacity-80">Last update {hhmm(t.gps.lastUpdate)}</span>
              </span>
              {t.gps.state !== "live" && (
                <button onClick={() => store.resumeGps(t.id)} className="ml-auto shrink-0 rounded-md border border-gps/50 px-2.5 py-1.5 text-[11px] font-bold text-gps transition active:scale-95">
                  RETRY GPS
                </button>
              )}
            </div>
          </div>

          {/* manifest */}
          <div className="panel-flat rounded-xl p-4">
            <p className="label mb-3">Passenger manifest — tap to mark</p>
            <div className="space-y-3">
              {byStop.map(({ sp, pax }) => (
                <div key={sp}>
                  <p className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-mist-300">
                    <I n="pin" s={13} c="text-signal" /> {POINTS[sp]?.name} <span className="font-mono text-[10px] text-mist-500">{sp}</span>
                  </p>
                  <div className="space-y-1.5">
                    {pax.map((p) => {
                      const chip = paxChip(p.status);
                      return (
                        <div key={p.empId} className="flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 p-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13.5px] font-medium text-mist-100">{empById(p.empId)?.name}</p>
                            <p className="font-mono text-[9.5px] text-mist-500">{p.empId}{p.at ? ` · ${hhmm(p.at)}` : ""}</p>
                          </div>
                          {p.status === "boarded" || p.status === "no_show" ? (
                            <Badge tone={chip.tone}>{chip.label}</Badge>
                          ) : (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => store.setPaxStatus(t.id, p.empId, "boarded")}
                                className="rounded-md border border-ok/40 bg-ok/10 px-3 py-2 text-[12px] font-bold text-ok transition active:scale-95"
                              >
                                BOARDED
                              </button>
                              <button
                                onClick={() => store.setPaxStatus(t.id, p.empId, "no_show")}
                                className="rounded-md border border-crit/40 bg-crit/10 px-3 py-2 text-[12px] font-bold text-crit transition active:scale-95"
                              >
                                NO-SHOW
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <Btn size="xl" onClick={() => setDelayOpen(true)}><I n="clock" s={18} /> REPORT DELAY</Btn>
            <Btn size="xl" tone="danger" onClick={() => setIncOpen(true)}><I n="alert" s={18} /> REPORT INCIDENT</Btn>
            <Btn size="xl" className="!border-crit/60 !text-crit" onClick={() => setSosOpen(true)}><I n="sos" s={18} /> EMERGENCY</Btn>
            <Btn size="xl" tone="primary" onClick={() => setEndOpen(true)}><I n="stop" s={18} /> END TRIP</Btn>
          </div>
        </>
      )}

      {t.status === "completed" && (
        <div className="panel-flat rounded-xl p-5 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-ok/40 bg-ok/10 text-ok"><I n="check" s={22} w={2.2} /></span>
          <p className="num mt-2 text-[26px] text-mist-100">Trip completed</p>
          <p className="text-[12.5px] text-mist-400">{boarded} boarded · {noShow} no-show · {duration} min · GPS tracking stopped</p>
          <p className="mt-1 font-mono text-[10.5px] text-mist-500">Boarding record sealed to audit trail · {driverName}</p>
        </div>
      )}

      {t.status === "incident" && (
        <div className="panel-flat rounded-xl border-crit/40 p-5 text-center">
          <p className="num text-[24px] text-crit">Trip blocked — incident</p>
          <p className="mt-1 text-[12.5px] text-mist-400">Vehicle unavailable. Ops is preparing a replacement; passengers are being notified in-app.</p>
        </div>
      )}

      {/* delay modal */}
      <Modal open={delayOpen} onClose={() => setDelayOpen(false)} title="Report delay">
        <p className="mb-3 text-[12.5px] text-mist-400">One tap — the control center thresholds (yellow {s.config.delayYellow}m / orange {s.config.delayOrange}m / red {s.config.delayRed}m) apply automatically.</p>
        <div className="grid grid-cols-5 gap-2">
          {[5, 10, 15, 20, 30].map((m) => (
            <button key={m} onClick={() => setDelayMin(m)} className={`num rounded-lg border py-3 text-[19px] transition active:scale-95 ${delayMin === m ? "border-signal bg-signal/15 text-signal" : "border-ink-600 text-mist-300"}`}>
              +{m}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setDelayOpen(false)}>Cancel</Btn>
          <Btn tone="primary" onClick={() => { store.reportDelay(t.id, delayMin, "driver-reported"); setDelayOpen(false); }}>Report +{delayMin}m</Btn>
        </div>
      </Modal>

      {/* incident modal */}
      <Modal open={incOpen} onClose={() => setIncOpen(false)} title="Report incident" tone="crit">
        <Field label="Category">
          <div className="grid grid-cols-3 gap-1.5">
            {INCIDENT_CATEGORIES.slice(0, 9).map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-md border px-2 py-2 text-[11px] font-medium transition ${cat === c ? "border-crit/60 bg-crit/10 text-crit" : "border-ink-600 text-mist-300"}`}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <div className="mt-3">
          <Field label="What happened? (short)">
            <input className={inputCls} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. heavy traffic on Harbor bridge" />
          </Field>
        </div>
        <p className="mt-3 text-[11px] text-mist-500">Trip, route, vehicle, time, GPS position and passenger count are attached automatically. Severity is routed by policy (P1–P4).</p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setIncOpen(false)}>Cancel</Btn>
          <Btn tone="danger" onClick={() => { store.createIncident({ severity: cat === "Accident" || cat === "Medical emergency" || cat === "Security issue" ? "P1" : cat === "Vehicle breakdown" ? "P2" : "P3", category: cat, desc: desc || cat, tripId: t.id, affected: t.pax.length - boarded, reporterRole: "driver" }); setIncOpen(false); setDesc(""); }}>Submit incident</Btn>
        </div>
      </Modal>

      {/* SOS modal */}
      <Modal open={sosOpen} onClose={() => setSosOpen(false)} title="Emergency" tone="crit">
        <div className="rounded-lg border border-crit/40 bg-crit/5 p-3 text-[13px] leading-relaxed text-mist-200">
          <p className="font-semibold text-crit">For genuine emergencies, call emergency services first.</p>
          <p className="mt-1">This app supports operations — it never replaces emergency services.</p>
        </div>
        <div className="mt-3 space-y-2">
          <a href="tel:999" className="flex items-center justify-center gap-2 rounded-lg bg-crit py-3.5 text-[15px] font-bold text-ink-950 transition active:scale-[0.98]">
            <I n="phone" s={18} w={2.2} /> CALL EMERGENCY — 999
          </a>
          <a href="tel:+97145551900" className="flex items-center justify-center gap-2 rounded-lg border border-crit/50 py-3 text-[13.5px] font-semibold text-crit transition active:scale-[0.98]">
            <I n="phone" s={16} /> Company emergency line +971 4 555 1900
          </a>
          <Btn className="w-full" onClick={() => { store.createIncident({ severity: "P1", category: "Security issue", desc: "Emergency call placed by driver — P1 protocol, manager + emergency contacts alerted", tripId: t.id, affected: t.pax.length, reporterRole: "driver" }); setSosOpen(false); }}>
            Flag P1 to transportation manager
          </Btn>
        </div>
      </Modal>

      {/* end trip modal */}
      <Modal open={endOpen} onClose={() => setEndOpen(false)} title={`End ${t.id}`} tone="ok">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-ink-800 py-3"><p className="num text-[24px] text-ok">{boarded}</p><p className="label">Boarded</p></div>
          <div className="rounded-lg bg-ink-800 py-3"><p className="num text-[24px] text-crit">{noShow}</p><p className="label">No-show</p></div>
          <div className="rounded-lg bg-ink-800 py-3"><p className="num text-[24px] text-mist-200">{t.pax.length - boarded - noShow}</p><p className="label">Unmarked</p></div>
        </div>
        <p className="mt-3 text-[12px] text-mist-500">Ending the trip seals the boarding record and immediately stops location sharing.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setEndOpen(false)}>Keep driving</Btn>
          <Btn tone="ok" onClick={() => { store.endTrip(t.id); setEndOpen(false); }}><I n="check" s={14} /> End trip</Btn>
        </div>
      </Modal>
    </div>
  );
}
