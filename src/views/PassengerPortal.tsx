import { useMemo, useState } from "react";
import { MISSED_REASONS, POINTS, UBER_REASONS, drvById, empById, evaluateUber, routeById, vehById } from "../lib/data";
import { dayLabel, hhmm, money } from "../lib/format";
import { store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Field, inputCls, Modal, uberChip, validationChip } from "../components/ui";
import { FactRow } from "./OpsCenter";

const CANCEL_REASONS = ["Not travelling today", "Working from home", "On leave", "Own transport", "Other"];

export function PassengerPortal({ now }: { now: number }) {
  const s = useTms();
  const empId = s.user?.refId ?? "EMP-101";
  const emp = empById(empId);
  const myTrip = s.trips.find((t) => t.pax.some((p) => p.empId === empId) && !["completed", "cancelled"].includes(t.status))
    ?? s.trips.find((t) => t.pax.some((p) => p.empId === empId));
  const myPax = myTrip?.pax.find((p) => p.empId === empId);
  const myUbers = s.ubers.filter((u) => u.empId === empId);
  const openUber = myUbers.find((u) => !["rejected", "paid", "closed", "unauthorized"].includes(u.status));

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeNote, setChangeNote] = useState("");
  const [missedOpen, setMissedOpen] = useState(false);
  const [uberOpen, setUberOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const r = myTrip ? routeById(myTrip.routeId) : undefined;
  const minsTo = myTrip ? Math.round((myTrip.plannedStart - now) / 60000) : 0;
  const cutoff = myTrip ? myTrip.plannedStart - s.config.cutoffMin * 60000 : now;

  return (
    <div className="mx-auto w-full max-w-md px-3 pb-24 pt-4">
      {/* header */}
      <div className="rise flex items-center gap-3">
        <span className="num grid h-11 w-11 place-items-center rounded-lg border border-gps/40 bg-gps/10 text-[18px] text-gps">
          {emp?.name.split(" ").map((w) => w[0]).join("")}
        </span>
        <div className="flex-1">
          <h2 className="font-display text-[22px] font-semibold uppercase tracking-wide text-mist-100">{emp?.name}</h2>
          <p className="text-[11.5px] text-mist-400">{emp?.dept} · {dayLabel(now)} · Shift {emp?.shift}</p>
        </div>
      </div>

      {/* my transportation */}
      {myTrip && (
        <div className="rise rise-1 panel-flat tick-corner mt-4 overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-ink-700 px-4 py-2.5">
            <span className="label">My transportation — today</span>
            {minsTo > 0 ? <Badge tone="signal">T−{minsTo} MIN</Badge> : <Badge tone="gps">DEPARTURE WINDOW</Badge>}
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <span className="num rounded-md px-3 py-1.5 text-[22px]" style={{ color: r?.color, background: `${r?.color}14`, border: `1px solid ${r?.color}55` }}>
                {myTrip.routeId}
              </span>
              <div>
                <p className="text-[14.5px] font-semibold text-mist-100">{r?.name}</p>
                <p className="text-[11.5px] text-mist-400">to {r?.site} · {r?.direction.toLowerCase()}</p>
              </div>
              <p className="num ml-auto text-[34px] leading-none text-mist-100">{hhmm(myTrip.plannedStart)}</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
              <div className="flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-2.5">
                <I n="pin" s={15} c="text-signal" />
                <div>
                  <p className="font-semibold text-mist-200">{POINTS[emp?.pickupId ?? ""]?.name}</p>
                  <p className="font-mono text-[10px] text-mist-500">{emp?.pickupId} · pickup point</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-ink-800 px-3 py-2.5">
                <I n="bus" s={15} c="text-gps" />
                <div>
                  <p className="font-semibold text-mist-200">{drvById(myTrip.driverId)?.name ?? "—"}</p>
                  <p className="font-mono text-[10px] text-mist-500">{vehById(myTrip.vehicleId)?.plate}</p>
                </div>
              </div>
            </div>

            {/* status timeline */}
            <div className="mt-3 flex items-center gap-1.5">
              {["Assigned", myPax?.status === "confirmed" || myPax?.status === "boarded" ? "Confirmed" : "Confirm", "Boarding", "On board"].map((st, i, arr) => {
                const reached =
                  i === 0 ||
                  (i === 1 && ["confirmed", "boarded"].includes(myPax?.status ?? "")) ||
                  (i === 2 && myPax?.status === "boarded") ||
                  (i === 3 && myPax?.status === "boarded" && myTrip.status === "in_progress");
                return (
                  <div key={st} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex w-full items-center">
                      <span className={`h-[3px] flex-1 ${i === 0 ? "opacity-0" : reached ? "bg-gps" : "bg-ink-600"}`} />
                      <span className={`grid h-5 w-5 place-items-center rounded-full border text-[9px] ${reached ? "border-gps bg-gps/15 text-gps" : "border-ink-600 text-mist-500"}`}>
                        {reached ? <I n="check" s={10} w={2.5} /> : i + 1}
                      </span>
                      <span className={`h-[3px] flex-1 ${i === arr.length - 1 ? "opacity-0" : reached && i < 2 ? "bg-gps" : "bg-ink-600"}`} />
                    </div>
                    <span className={`text-[9.5px] font-medium uppercase tracking-wider ${reached ? "text-gps" : "text-mist-500"}`}>{st}</span>
                  </div>
                );
              })}
            </div>

            {myPax?.status === "pending" && (
              <p className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-[11.5px] ${now > cutoff ? "border-warn/40 bg-warn/5 text-warn" : "border-ink-700 bg-ink-850 text-mist-400"}`}>
                <I n="clock" s={14} />
                {now > cutoff
                  ? "Confirmation cutoff passed — please confirm as soon as possible; no-shows are recorded."
                  : `Please confirm before the cutoff (${hhmm(cutoff)}, ${s.config.cutoffMin} min before departure).`}
              </p>
            )}
            {(myPax?.status === "confirmed" || myPax?.status === "boarded") && (
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-ok/30 bg-ok/5 px-3 py-2 text-[11.5px] text-ok">
                <I n="check" s={14} w={2.2} /> Seat confirmed{myPax?.at ? ` at ${hhmm(myPax.at)}` : ""} — stored to the trip manifest.
              </p>
            )}
            {myPax?.status === "cancelled" && (
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-late/30 bg-late/5 px-3 py-2 text-[11.5px] text-late">
                <I n="x" s={14} w={2.2} /> Cancelled — recorded with reason. Ops has been notified automatically.
              </p>
            )}
          </div>

          {/* actions */}
          {["pending", "confirmed"].includes(myPax?.status ?? "") && (
            <div className="grid grid-cols-2 gap-2.5 border-t border-ink-700 p-3">
              {myPax?.status === "pending" && (
                <Btn tone="primary" size="lg" onClick={() => store.confirmTrip(empId, myTrip.id, "confirmed")}>
                  <I n="check" s={16} w={2.2} /> CONFIRM
                </Btn>
              )}
              <Btn size="lg" tone={myPax?.status === "pending" ? "danger" : "outline"} onClick={() => setCancelOpen(true)}>
                <I n="x" s={15} /> CAN'T TRAVEL
              </Btn>
              <Btn size="lg" onClick={() => setChangeOpen(true)}><I n="swap" s={15} /> REQUEST CHANGE</Btn>
              <Btn size="lg" onClick={() => setMissedOpen(true)}><I n="flag" s={15} /> REPORT PROBLEM</Btn>
              <Btn size="lg" tone="gps" className="col-span-2" onClick={() => setUberOpen(true)}>
                <I n="taxi" s={16} /> REQUEST ALTERNATIVE TRANSPORT (UBER)
              </Btn>
            </div>
          )}
        </div>
      )}

      {/* uber status */}
      <div className="mt-5">
        <p className="label mb-2 px-1">Alternative transportation</p>
        {openUber ? (
          <UberStatusCard uberId={openUber.id} now={now} onReceipt={() => setReceiptOpen(true)} />
        ) : (
          <div className="panel-flat rounded-xl p-4 text-[12.5px] text-mist-400">
            {myUbers.length > 0 ? (
              <p>Last request {myUbers[0].id} — <Badge tone={uberChip(myUbers[0].status).tone}>{uberChip(myUbers[0].status).label}</Badge></p>
            ) : (
              <p>No requests on record. Prior approval is required unless a policy auto-eligibility rule applies — the system checks evidence for you.</p>
            )}
          </div>
        )}
      </div>

      {/* history */}
      <div className="mt-5">
        <p className="label mb-2 px-1">My transportation history</p>
        <div className="panel-flat divide-y divide-ink-700/60 rounded-xl">
          {[
            { d: "Yesterday", route: "R45", status: "Boarded", tone: "ok" as const },
            { d: "Monday", route: "R45", status: "Boarded", tone: "ok" as const },
            { d: "Friday", route: "R45", status: "Cancelled — own transport", tone: "late" as const },
            { d: "Thursday", route: "R45", status: "Boarded", tone: "ok" as const },
          ].map((h) => (
            <div key={h.d} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
              <span className="w-20 text-mist-500">{h.d}</span>
              <span className="font-mono font-semibold text-gps">{h.route}</span>
              <span className="ml-auto"><Badge tone={h.tone}>{h.status}</Badge></span>
            </div>
          ))}
        </div>
      </div>

      {/* modals */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Can't travel today" tone="crit">
        <Field label="Reason (stored with your cancellation)">
          <div className="space-y-1.5">
            {CANCEL_REASONS.map((r0) => (
              <button key={r0} onClick={() => setCancelReason(r0)} className={`w-full rounded-md border px-3 py-2.5 text-left text-[13px] transition ${cancelReason === r0 ? "border-late/60 bg-late/10 text-late" : "border-ink-600 text-mist-300"}`}>
                {r0}
              </button>
            ))}
          </div>
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setCancelOpen(false)}>Back</Btn>
          <Btn tone="danger" onClick={() => { if (myTrip) store.confirmTrip(empId, myTrip.id, "cancelled", cancelReason); setCancelOpen(false); }}>Cancel my seat</Btn>
        </div>
      </Modal>

      <Modal open={changeOpen} onClose={() => setChangeOpen(false)} title="Request a change">
        <p className="mb-3 text-[12.5px] text-mist-400">Creates a structured request for ops. Your original assignment is <b>not</b> modified — the audit trail keeps both.</p>
        <Field label="What do you need?">
          <input className={inputCls} value={changeNote} onChange={(e) => setChangeNote(e.target.value)} placeholder="e.g. need the 08:40 pickup instead" />
        </Field>
        <div className="mt-4 flex justify-end gap-2">
          <Btn onClick={() => setChangeOpen(false)}>Back</Btn>
          <Btn tone="primary" disabled={changeNote.trim().length < 3} onClick={() => { if (myTrip) store.requestChange(empId, myTrip.id, changeNote.trim()); setChangeOpen(false); setChangeNote(""); }}>Submit request</Btn>
        </div>
      </Modal>

      <Modal open={missedOpen} onClose={() => setMissedOpen(false)} title="Report a problem" tone="crit">
        <p className="mb-3 text-[12.5px] text-mist-400">
          The system auto-attaches your trip, route, pickup point, scheduled time, driver, vehicle, GPS state and confirmation status — no typing needed.
        </p>
        <div className="space-y-1.5">
          {MISSED_REASONS.map((mr) => (
            <button
              key={mr}
              onClick={() => { if (myTrip) store.reportMissedPickup(empId, myTrip.id, mr); setMissedOpen(false); }}
              className="w-full rounded-md border border-ink-600 px-3 py-2.5 text-left text-[13px] text-mist-200 transition hover:border-crit/50 hover:bg-crit/5 active:scale-[0.99]"
            >
              {mr}
            </button>
          ))}
        </div>
      </Modal>

      {myTrip && <UberModal tripId={myTrip.id} empId={empId} open={uberOpen} onClose={() => setUberOpen(false)} now={now} />}
      {openUber && <ReceiptModal uberId={openUber.id} open={receiptOpen} onClose={() => setReceiptOpen(false)} />}
    </div>
  );
}

/* ---------- Uber request engine modal ---------- */

function UberModal({ tripId, empId, open, onClose, now }: { tripId: string; empId: string; open: boolean; onClose: () => void; now: number }) {
  const s = useTms();
  const [reasonKey, setReasonKey] = useState("delay");
  const [amount, setAmount] = useState(24);
  const [preview, setPreview] = useState<ReturnType<typeof evaluateUber> | null>(null);
  const [done, setDone] = useState<{ id: string; decision: string; rule: string; limit: number | null } | null>(null);

  const trip = s.trips.find((t) => t.id === tripId) ?? null;
  const tripIncidents = useMemo(() => s.incidents.filter((i) => i.tripId === tripId && i.status !== "closed"), [s.incidents, tripId]);
  const confirmed = trip?.pax.find((p) => p.empId === empId)?.status === "confirmed";

  const run = () => setPreview(evaluateUber({ trip, tripIncidents, cfg: s.config, confirmed, reasonKey }));
  const submit = () => {
    if (!preview) return;
    const reason = UBER_REASONS.find((u) => u.key === reasonKey)?.label ?? reasonKey;
    const req = store.requestUber(empId, tripId, reasonKey, reason, amount);
    setDone({ id: req.id, decision: req.decision, rule: req.rule, limit: req.limit });
  };
  const reset = () => { setPreview(null); setDone(null); onClose(); };

  return (
    <Modal open={open} onClose={reset} title="Alternative transportation" width="max-w-2xl">
      {done ? (
        <div className="text-center">
          <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full border ${done.decision === "auto" ? "border-ok/50 bg-ok/10 text-ok" : done.decision === "reject" ? "border-crit/50 bg-crit/10 text-crit" : "border-warn/50 bg-warn/10 text-warn"}`}>
            <I n={done.decision === "auto" ? "check" : done.decision === "reject" ? "x" : "clock"} s={26} w={2.2} />
          </span>
          <p className="num mt-3 text-[28px] text-mist-100">
            {done.decision === "auto" ? "APPROVED" : done.decision === "reject" ? "NOT ELIGIBLE" : "PENDING APPROVAL"}
          </p>
          <p className="font-mono text-[13px] text-signal">{done.id}</p>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-mist-400">{done.rule}</p>
          {done.decision === "auto" && (
            <div className="mx-auto mt-3 max-w-sm rounded-lg border border-ok/30 bg-ok/5 p-3 text-[12.5px] text-mist-300">
              Approved limit <b className="text-ok">{money(done.limit ?? 0)}</b> · approval timestamped ·
              receipt upload required within {s.config.receiptWindowDays} days.
            </div>
          )}
          {done.decision === "manual" && (
            <p className="mt-3 font-mono text-[11px] text-warn">SLA {s.config.slaNormal}m · then escalates to backup approver — never auto-approved</p>
          )}
          <Btn className="mt-4" onClick={reset}>Done</Btn>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Field label="Reason">
                <div className="space-y-1.5">
                  {UBER_REASONS.map((u) => (
                    <button key={u.key} onClick={() => { setReasonKey(u.key); setPreview(null); }} className={`w-full rounded-md border px-3 py-2 text-left text-[12.5px] transition ${reasonKey === u.key ? "border-gps/60 bg-gps/10 text-gps" : "border-ink-600 text-mist-300"}`}>
                      {u.label}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="mt-3">
                <Field label="Estimated fare ($)">
                  <input type="number" className={inputCls} value={amount} min={1} onChange={(e) => setAmount(Number(e.target.value))} />
                </Field>
              </div>
            </div>
            <div>
              <p className="label mb-2">Eligibility engine — checks facts first</p>
              {!preview ? (
                <div className="grid h-44 place-items-center rounded-lg border border-dashed border-ink-600 text-center">
                  <div>
                    <p className="text-[12.5px] text-mist-400">The engine inspects trip start, GPS, delay,<br />confirmations, boardings and incidents.</p>
                    <Btn tone="gps" className="mt-3" onClick={run}><I n="radar" s={14} /> Check my eligibility</Btn>
                  </div>
                </div>
              ) : (
                <div>
                  <div className={`mb-2 rounded-lg border px-3 py-2.5 text-[12.5px] font-semibold ${preview.decision === "auto" ? "border-ok/40 bg-ok/10 text-ok" : preview.decision === "reject" ? "border-crit/40 bg-crit/10 text-crit" : "border-warn/40 bg-warn/10 text-warn"}`}>
                    {preview.decision === "auto" ? "AUTO-ELIGIBLE — will approve instantly" : preview.decision === "reject" ? "NOT ELIGIBLE under policy" : "MANAGER APPROVAL REQUIRED"}
                    <span className="mt-0.5 block font-mono text-[10px] font-normal opacity-80">{preview.rule}</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900/60 px-3">
                    {preview.facts.map((f) => <FactRow key={f.label} {...f} />)}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink-700 pt-3">
            <p className="text-[11px] text-mist-500">Requesting without approval when not eligible is tracked as unauthorized transportation.</p>
            <div className="flex gap-2">
              <Btn onClick={reset}>Cancel</Btn>
              {preview ? (
                <Btn tone="primary" onClick={submit}><I n="send" s={14} /> Submit request</Btn>
              ) : (
                <Btn tone="gps" onClick={run}><I n="radar" s={14} /> Check eligibility</Btn>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ---------- Uber status + receipt ---------- */

function UberStatusCard({ uberId, now, onReceipt }: { uberId: string; now: number; onReceipt: () => void }) {
  const s = useTms();
  const u = s.ubers.find((x) => x.id === uberId);
  if (!u) return null;
  const chip = uberChip(u.status);
  const stages = [
    { label: "Requested", on: true },
    { label: "Eligibility", on: true },
    { label: u.decision === "manual" ? "Approval" : "Approved", on: ["approved", "receipt_pending", "receipt_submitted", "validated", "finance_approved", "paid"].includes(u.status) },
    { label: "Receipt", on: !!u.receipt },
    { label: "Validated", on: !!u.validation },
    { label: "Paid", on: u.status === "paid" },
  ];
  return (
    <div className="rise panel-flat rounded-xl p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-signal">{u.id}</span>
        <Badge tone={chip.tone} pulse={u.status === "pending_approval"}>{chip.label}</Badge>
        {u.limit !== null && <span className="ml-auto font-mono text-[12px] text-mist-300">limit {money(u.limit)}</span>}
      </div>
      <p className="mt-1.5 text-[12.5px] text-mist-300">{u.reason}</p>
      <p className="font-mono text-[10.5px] text-mist-500">{u.rule}{u.approver ? ` · approver ${u.approver}` : ""}</p>

      <div className="mt-3 flex items-center gap-1">
        {stages.map((st, i) => (
          <div key={st.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <span className={`h-[3px] flex-1 ${i === 0 ? "opacity-0" : st.on ? "bg-signal" : "bg-ink-600"}`} />
              <span className={`h-2.5 w-2.5 rounded-full ${st.on ? "bg-signal" : "bg-ink-600"}`} />
              <span className={`h-[3px] flex-1 ${i === stages.length - 1 ? "opacity-0" : stages[i + 1].on ? "bg-signal" : "bg-ink-600"}`} />
            </div>
            <span className={`text-[9px] uppercase tracking-wider ${st.on ? "text-signal" : "text-mist-500"}`}>{st.label}</span>
          </div>
        ))}
      </div>

      {u.status === "pending_approval" && u.slaDue && (
        <p className="mt-3 rounded-lg border border-warn/30 bg-warn/5 px-3 py-2 font-mono text-[11px] text-warn">
          Approval SLA: {Math.max(0, Math.round((u.slaDue - now) / 60000))}m — then escalates to backup approver
        </p>
      )}
      {(u.status === "approved" || u.status === "receipt_pending") && (
        <Btn tone="primary" className="mt-3 w-full" onClick={() => { if (u.status === "approved") store.markUberRidden(u.id); onReceipt(); }}>
          <I n="upload" s={15} /> UPLOAD RECEIPT
        </Btn>
      )}
      {u.receipt && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-[12px]">
          <I n="file" s={14} c="text-signal" />
          <span className="min-w-0 flex-1 truncate text-mist-300">{u.receipt.fileName} · {money(u.receipt.amount)}</span>
          <Badge tone={validationChip(u.validation).tone}>{validationChip(u.validation).label}</Badge>
        </div>
      )}
      {u.financeNote && <p className="mt-2 font-mono text-[10.5px] text-mist-500">{u.financeNote}</p>}
    </div>
  );
}

function ReceiptModal({ uberId, open, onClose }: { uberId: string; open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<string | null>(null);
  const [amount, setAmount] = useState(24);
  const [ref, setRef] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("08:45");
  return (
    <Modal open={open} onClose={onClose} title={`Upload receipt — ${uberId}`}>
      <p className="mb-3 text-[12px] text-mist-400">Receipts are linked to this approval ID automatically. A receipt can never exist without a request ID.</p>
      <div className="space-y-3">
        <Field label="Receipt file (image or PDF)">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-ink-500 bg-ink-900/60 px-3 py-5 text-[13px] text-mist-400 transition hover:border-signal/60 hover:text-signal">
            <I n="upload" s={16} /> {file ?? "Tap to attach receipt"}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
          </label>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Uber amount ($)">
            <input type="number" className={inputCls} value={amount} min={0} step="0.1" onChange={(e) => setAmount(Number(e.target.value))} />
          </Field>
          <Field label="Trip reference (optional)">
            <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UBX-…" />
          </Field>
          <Field label="Trip date">
            <input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Trip time">
            <input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn tone="primary" disabled={!file} onClick={() => { store.uploadReceipt(uberId, { amount, date, time, ref: ref || "—", fileName: file ?? "" }); setFile(null); onClose(); }}>
          <I n="check" s={14} /> Submit for validation
        </Btn>
      </div>
    </Modal>
  );
}
