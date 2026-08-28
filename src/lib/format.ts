const pad = (n: number) => String(n).padStart(2, "0");

export function hhmm(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function hhmmss(ts: number): string {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function dayLabel(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

export function fullStamp(ts: number): string {
  return `${dayLabel(ts)} ${hhmmss(ts)}`;
}

export function ago(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m ago`;
}

export function inMin(ts: number, now: number): number {
  return Math.round((ts - now) / 60000);
}

export function minsBetween(a: number, b: number): number {
  return Math.round((b - a) / 60000);
}

export function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

let seq = 400;
export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}-${seq}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

/** Interpolate a point at fraction t (0..1) along a polyline, by arc length. */
export function pointAt(pts: [number, number][], t: number): [number, number] {
  if (pts.length === 0) return [0, 0];
  if (pts.length === 1) return pts[0];
  const dists: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    dists.push(dists[i - 1] + Math.hypot(x2 - x1, y2 - y1));
  }
  const total = dists[dists.length - 1];
  const target = clamp(t, 0, 1) * total;
  for (let i = 1; i < pts.length; i++) {
    if (target <= dists[i]) {
      const seg = dists[i] - dists[i - 1];
      const k = seg > 0 ? (target - dists[i - 1]) / seg : 0;
      const [x1, y1] = pts[i - 1];
      const [x2, y2] = pts[i];
      return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];
    }
  }
  return pts[pts.length - 1];
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
