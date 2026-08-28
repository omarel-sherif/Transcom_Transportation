import type { ReactNode } from "react";
import { I } from "./icons";

export type Tone = "ok" | "warn" | "late" | "crit" | "idle" | "gps" | "signal";

export const TONE_TEXT: Record<Tone, string> = {
  ok: "text-ok",
  warn: "text-warn",
  late: "text-late",
  crit: "text-crit",
  idle: "text-mist-400",
  gps: "text-gps",
  signal: "text-signal",
};

export const TONE_BG: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  late: "bg-late",
  crit: "bg-crit",
  idle: "bg-mist-500",
  gps: "bg-gps",
  signal: "bg-signal",
};

export const TONE_SOFT: Record<Tone, string> = {
  ok: "bg-ok/10 text-ok border-ok/30",
  warn: "bg-warn/10 text-warn border-warn/30",
  late: "bg-late/10 text-late border-late/30",
  crit: "bg-crit/10 text-crit border-crit/30",
  idle: "bg-mist-500/10 text-mist-400 border-mist-500/30",
  gps: "bg-gps/10 text-gps border-gps/30",
  signal: "bg-signal/10 text-signal border-signal/30",
};

export function Dot({ tone, pulse = false, s = 8 }: { tone: Tone; pulse?: boolean; s?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: s, height: s }}>
      {pulse && <span className={`pulse-ring absolute inset-0 rounded-full ${TONE_BG[tone]}`} />}
      <span className={`relative inline-block rounded-full ${TONE_BG[tone]}`} style={{ width: s, height: s }} />
    </span>
  );
}

export function Badge({ tone = "idle", children, pulse = false }: { tone?: Tone; children: ReactNode; pulse?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider ${TONE_SOFT[tone]}`}>
      <Dot tone={tone} pulse={pulse} s={6} />
      {children}
    </span>
  );
}

export function Btn({
  children, onClick, tone = "outline", size = "md", className = "", disabled = false, title,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "primary" | "outline" | "ghost" | "danger" | "ok" | "gps";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const tones = {
    primary: "bg-signal text-ink-950 hover:bg-[#ffbd45] border border-signal font-semibold shadow-[0_0_18px_rgba(245,165,36,0.22)]",
    outline: "border border-ink-600 text-mist-200 hover:border-mist-500 hover:text-mist-100 bg-ink-800/40",
    ghost: "text-mist-400 hover:text-mist-100 border border-transparent hover:border-ink-600",
    danger: "border border-crit/40 text-crit hover:bg-crit/10",
    ok: "border border-ok/40 text-ok hover:bg-ok/10",
    gps: "border border-gps/40 text-gps hover:bg-gps/10",
  }[tone];
  const sizes = {
    sm: "px-2.5 py-1 text-[12px] gap-1.5",
    md: "px-3.5 py-1.5 text-[13px] gap-2",
    lg: "px-4 py-2.5 text-[14px] gap-2",
    xl: "px-5 py-3.5 text-[15px] gap-2.5",
  }[size];
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none ${tones} ${sizes} ${className}`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title, icon, right, children, className = "", pad = true, live = false,
}: {
  title?: ReactNode;
  icon?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  pad?: boolean;
  live?: boolean;
}) {
  return (
    <section className={`panel overflow-hidden ${className}`}>
      {title !== undefined && (
        <header className="flex items-center justify-between gap-3 border-b border-ink-700/80 px-4 py-2.5">
          <div className="flex items-center gap-2">
            {icon && <I n={icon} s={15} c="text-signal" />}
            <h3 className="label !text-mist-300">{title}</h3>
            {live && <Dot tone="ok" pulse s={6} />}
          </div>
          {right && <div className="flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={pad ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function Seg({
  options, value, onChange,
}: {
  options: { id: string; label: string; count?: number }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-ink-700 bg-ink-900/70 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-all duration-150 ${
            value === o.id ? "bg-ink-600 text-mist-100 shadow-sm" : "text-mist-400 hover:text-mist-200"
          }`}
        >
          {o.label}
          {o.count !== undefined && (
            <span className={`ml-1.5 font-mono text-[10.5px] ${value === o.id ? "text-signal" : "text-mist-500"}`}>{o.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open, onClose, title, children, width = "max-w-lg", tone = "signal",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  width?: string;
  tone?: "signal" | "crit" | "ok";
}) {
  if (!open) return null;
  const bar = tone === "crit" ? "bg-crit" : tone === "ok" ? "bg-ok" : "bg-signal";
  return (
    <div className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-3 backdrop-blur-[3px] sm:items-center" onClick={onClose}>
      <div
        className={`toast-in w-full ${width} panel-flat overflow-hidden shadow-2xl shadow-black/60`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className={`h-[3px] w-full ${bar}`} />
        <header className="flex items-center justify-between border-b border-ink-700 px-4 py-3">
          <h3 className="font-display text-[19px] font-semibold uppercase tracking-wide text-mist-100">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-mist-400 transition hover:bg-ink-700 hover:text-mist-100" aria-label="Close">
            <I n="x" s={16} />
          </button>
        </header>
        <div className="max-h-[78vh] overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-mist-500">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-ink-600 bg-ink-900/80 px-3 py-2 text-[13.5px] text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-signal/70 focus:ring-2 focus:ring-signal/15";

export function KV({ k, v, mono = false }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink-700/60 py-1.5 last:border-0">
      <span className="text-[12px] text-mist-500">{k}</span>
      <span className={`text-right text-[12.5px] text-mist-200 ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}

/* controlled status → tone/label mapping */

export function tripChip(status: string): { tone: Tone; label: string } {
  switch (status) {
    case "scheduled": return { tone: "idle", label: "SCHEDULED" };
    case "started":
    case "in_progress": return { tone: "gps", label: status === "started" ? "STARTED" : "IN PROGRESS" };
    case "completed": return { tone: "ok", label: "COMPLETED" };
    case "cancelled": return { tone: "crit", label: "CANCELLED" };
    case "incident": return { tone: "crit", label: "INCIDENT" };
    default: return { tone: "idle", label: status.toUpperCase() };
  }
}

export function paxChip(status: string): { tone: Tone; label: string } {
  switch (status) {
    case "confirmed": return { tone: "ok", label: "CONFIRMED" };
    case "boarded": return { tone: "gps", label: "BOARDED" };
    case "pending": return { tone: "warn", label: "PENDING" };
    case "cancelled": return { tone: "late", label: "CANCELLED" };
    case "no_show": return { tone: "crit", label: "NO-SHOW" };
    default: return { tone: "idle", label: status.toUpperCase() };
  }
}

export function uberChip(status: string): { tone: Tone; label: string } {
  switch (status) {
    case "requested": return { tone: "warn", label: "REQUESTED" };
    case "pending_approval": return { tone: "warn", label: "PENDING APPROVAL" };
    case "approved": return { tone: "ok", label: "APPROVED" };
    case "rejected": return { tone: "crit", label: "REJECTED" };
    case "receipt_pending": return { tone: "warn", label: "RECEIPT PENDING" };
    case "receipt_submitted": return { tone: "gps", label: "RECEIPT SUBMITTED" };
    case "validated": return { tone: "ok", label: "VALIDATED" };
    case "finance_approved": return { tone: "ok", label: "FINANCE APPROVED" };
    case "paid": return { tone: "ok", label: "PAID · CLOSED" };
    case "unauthorized": return { tone: "crit", label: "UNAUTHORIZED" };
    default: return { tone: "idle", label: status.toUpperCase() };
  }
}

export function sevChip(sev: string): { tone: Tone; label: string } {
  switch (sev) {
    case "P1": return { tone: "crit", label: "P1 · CRITICAL" };
    case "P2": return { tone: "late", label: "P2 · MAJOR" };
    case "P3": return { tone: "warn", label: "P3 · OPERATIONAL" };
    default: return { tone: "idle", label: "P4 · INFO" };
  }
}

export function validationChip(v: string | null): { tone: Tone; label: string } {
  if (v === "valid") return { tone: "ok", label: "VALID" };
  if (v === "exception") return { tone: "warn", label: "EXCEPTION" };
  if (v === "invalid") return { tone: "crit", label: "INVALID" };
  return { tone: "idle", label: "—" };
}

export function ProgressBar({ value, tone = "gps", h = 6 }: { value: number; tone?: Tone; h?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-ink-700" style={{ height: h }}>
      <div className={`h-full rounded-full ${TONE_BG[tone]} transition-all duration-700`} style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}
