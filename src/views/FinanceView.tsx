import { useMemo, useState } from "react";
import { MONTHS, UBER_BY_ROUTE, UBER_COST_K } from "../lib/data";
import { downloadCsv, fullStamp, hhmm, money } from "../lib/format";
import { store, useTms } from "../lib/store";
import { I } from "../components/icons";
import { Badge, Btn, Panel, Seg, uberChip, validationChip } from "../components/ui";
import { GroupBars, HBars } from "../components/charts";
import { empById } from "../lib/data";

export function FinanceView({ section, now }: { section: string; now: number }) {
  const s = useTms();
  const [filter, setFilter] = useState("all");

  const receipts = useMemo(() => {
    const list = s.ubers.filter((u) => u.receipt || u.status === "unauthorized" || u.status === "finance_approved");
    if (filter === "exception") return list.filter((u) => u.validation === "exception");
    if (filter === "invalid") return list.filter((u) => u.validation === "invalid" || u.status === "unauthorized");
    if (filter === "paid") return list.filter((u) => u.status === "paid");
    if (filter === "open") return list.filter((u) => !["paid", "closed"].includes(u.status));
    return list;
  }, [s.ubers, filter]);

  const totalPaid = s.ubers.filter((u) => u.status === "paid").reduce((n, u) => n + (u.receipt?.amount ?? 0), 0);
  const totalPending = s.ubers.filter((u) => u.receipt && !["paid", "closed", "rejected"].includes(u.status)).reduce((n, u) => n + (u.receipt?.amount ?? 0), 0);
  const totalUnauthorized = s.ubers.filter((u) => u.status === "unauthorized").reduce((n, u) => n + (u.receipt?.amount ?? u.requestedAmount ?? 0), 0);
  const exceptions = s.ubers.filter((u) => u.validation === "exception").length;

  return (
    <div className="space-y-4">
      {section === "receipts" && (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="panel-flat rounded-lg px-3.5 py-3">
              <p className="label">Paid & closed</p>
              <p className="num mt-1 text-[26px] text-ok">{money(totalPaid)}</p>
            </div>
            <div className="panel-flat rounded-lg px-3.5 py-3">
              <p className="label">Awaiting decision</p>
              <p className="num mt-1 text-[26px] text-warn">{money(totalPending)}</p>
            </div>
            <div className="panel-flat rounded-lg px-3.5 py-3">
              <p className="label">Receipt exceptions</p>
              <p className="num mt-1 text-[26px] text-late">{exceptions}</p>
            </div>
            <div className="panel-flat rounded-lg px-3.5 py-3">
              <p className="label">Unauthorized (never auto-paid)</p>
              <p className="num mt-1 text-[26px] text-crit">{money(totalUnauthorized)}</p>
            </div>
          </div>

          <Panel
            title="Receipt validation desk" icon="file" live
            right={
              <div className="flex items-center gap-2">
                <Seg
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { id: "all", label: "All", count: s.ubers.filter((u) => u.receipt || u.status === "unauthorized" || u.status === "finance_approved").length },
                    { id: "open", label: "Open" },
                    { id: "exception", label: "Exception", count: exceptions },
                    { id: "invalid", label: "Invalid" },
                    { id: "paid", label: "Paid" },
                  ]}
                />
                <Btn size="sm" tone="ghost" onClick={() => downloadCsv("fleetgrid_finance.csv", [
                  ["Request ID", "Employee", "Status", "Approved limit", "Receipt amount", "Validation", "Receipt file", "Approver", "Note"],
                  ...s.ubers.map((u) => [u.id, empById(u.empId)?.name ?? u.empId, u.status, u.limit ?? "", u.receipt?.amount ?? "", u.validation ?? "", u.receipt?.fileName ?? "", u.approver ?? "", u.financeNote ?? ""]),
                ])}><I n="download" s={13} /> CSV</Btn>
              </div>
            }
            pad={false}
          >
            <div className="space-y-2.5 p-4">
              {receipts.length === 0 && <p className="py-6 text-center text-[12.5px] text-mist-500">Nothing in this bucket.</p>}
              {receipts.map((u) => {
                const emp = empById(u.empId);
                const vc = validationChip(u.validation);
                return (
                  <div key={u.id} className={`rounded-lg border p-3.5 ${u.status === "unauthorized" ? "border-crit/40 bg-crit/[0.04]" : "border-ink-700 bg-ink-850"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11.5px] text-signal">{u.id}</span>
                      <span className="text-[13.5px] font-semibold text-mist-100">{emp?.name}</span>
                      <span className="font-mono text-[10.5px] text-mist-500">{emp?.dept}</span>
                      <span className="ml-auto"><Badge tone={uberChip(u.status).tone}>{uberChip(u.status).label}</Badge></span>
                      <Badge tone={vc.tone}>{vc.label}</Badge>
                    </div>
                    <div className="mt-2 grid gap-x-6 gap-y-1 text-[12px] text-mist-400 sm:grid-cols-2">
                      <p>Approved limit <span className="font-mono text-mist-200">{u.limit !== null ? money(u.limit) : "— no approval —"}</span></p>
                      <p>Receipt <span className={`font-mono ${u.validation === "exception" ? "text-late" : "text-mist-200"}`}>{u.receipt ? money(u.receipt.amount) : "—"}</span> {u.receipt && <span className="font-mono text-[10px] text-mist-500">({u.receipt.fileName})</span>}</p>
                      <p>Rule <span className="text-mist-300">{u.rule}</span></p>
                      <p>Approver <span className="text-mist-300">{u.approver ?? "—"}</span>{u.approvedAt ? <span className="font-mono text-[10px] text-mist-500"> · {fullStamp(u.approvedAt)}</span> : null}</p>
                    </div>
                    {u.financeNote && <p className="mt-1.5 text-[11.5px] italic text-mist-500">{u.financeNote}</p>}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {u.status === "receipt_submitted" && u.validation === "valid" && (
                        <Btn size="sm" tone="ok" onClick={() => store.financeDecision(u.id, "accepted")}><I n="check" s={13} /> Accept</Btn>
                      )}
                      {u.status === "receipt_submitted" && u.validation === "exception" && (
                        <>
                          <Btn size="sm" tone="ok" onClick={() => store.financeDecision(u.id, "exception_approved")}><I n="check" s={13} /> Approve exception</Btn>
                          <Btn size="sm" tone="danger" onClick={() => store.financeDecision(u.id, "rejected")}><I n="x" s={13} /> Reject</Btn>
                        </>
                      )}
                      {u.status === "receipt_submitted" && u.validation === "invalid" && (
                        <Btn size="sm" tone="danger" onClick={() => store.financeDecision(u.id, "rejected")}><I n="x" s={13} /> Reject — no approval</Btn>
                      )}
                      {u.status === "receipt_submitted" && (
                        <Btn size="sm" onClick={() => store.financeDecision(u.id, "clarification")}><I n="send" s={13} /> Request clarification</Btn>
                      )}
                      {u.status === "finance_approved" && (
                        <Btn size="sm" tone="primary" onClick={() => store.markPaid(u.id)}><I n="card" s={13} /> Mark paid & close</Btn>
                      )}
                      {u.status === "unauthorized" && (
                        <span className="text-[11.5px] text-mist-500">Exception review: manager + finance required. Reimbursement is never automatic.</span>
                      )}
                      {u.status === "paid" && <span className="font-mono text-[11px] text-ok">settled {u.receipt ? money(u.receipt.amount) : ""}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
          <p className="px-1 text-[11px] text-mist-500">
            Read-only boundary: finance validates and pays against approvals, but cannot modify trips, routes, drivers or any operational record.
          </p>
        </>
      )}

      {section === "spend" && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel title="Uber spend by month ($k)" icon="card">
            <GroupBars labels={MONTHS} a={UBER_COST_K} b={UBER_COST_K.map(() => 0)} aLabel="Uber / alternative" bLabel="" unit="k" aColor="#F5A524" bColor="#F5A524" />
            <p className="mt-2 text-[11.5px] text-mist-500">Spend correlates with transportation failures, not headcount — June spike traced to R14/R31.</p>
          </Panel>
          <Panel title="Uber spend by route (180d, $)" icon="taxi">
            <HBars items={UBER_BY_ROUTE.map((r) => ({ label: r.label, value: r.value }))} unit="$" />
          </Panel>
          <div className="xl:col-span-2">
            <Panel title="Cost control configuration in force" icon="shield">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { k: "Max per trip", v: money(s.config.uberMaxPerTrip) },
                  { k: "Max per employee / day", v: money(s.config.uberDaily) },
                  { k: "Max per employee / month", v: money(s.config.uberMonthly) },
                  { k: "Receipt window", v: `${s.config.receiptWindowDays} days` },
                ].map((c) => (
                  <div key={c.k} className="rounded-lg border border-ink-700 bg-ink-850 px-3.5 py-3">
                    <p className="label">{c.k}</p>
                    <p className="num mt-1 text-[22px] text-signal">{c.v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-mist-500">
                Limits are enforced at approval time and re-checked at receipt validation. Overrides require manager exception approval and are audited.
                Last sync {hhmm(now)}.
              </p>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
