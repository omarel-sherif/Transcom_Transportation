const AX = "#31465F";
const GRID = "#1A2636";
const TXT = "#7E93AB";

export function GroupBars({
  labels, a, b, aLabel, bLabel, aColor = "#45C8E0", bColor = "#F5A524", unit = "",
}: {
  labels: string[];
  a: number[];
  b: number[];
  aLabel: string;
  bLabel: string;
  aColor?: string;
  bColor?: string;
  unit?: string;
}) {
  const W = 560;
  const H = 210;
  const padL = 36;
  const padB = 24;
  const padT = 10;
  const max = Math.max(...a, ...b) * 1.15;
  const bw = (W - padL - 10) / labels.length;
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={W - 4} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
            <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9.5" fill={TXT} fontFamily="IBM Plex Mono">
              {Math.round(t)}{unit}
            </text>
          </g>
        ))}
        {labels.map((lb, i) => {
          const x0 = padL + i * bw;
          const h1 = H - padB - y(a[i]);
          const h2 = H - padB - y(b[i]);
          return (
            <g key={lb}>
              <rect x={x0 + bw * 0.18} y={y(a[i])} width={bw * 0.26} height={h1} fill={aColor} rx="2" className="bar-grow" style={{ animationDelay: `${i * 40}ms` }} />
              <rect x={x0 + bw * 0.5} y={y(b[i])} width={bw * 0.26} height={h2} fill={bColor} rx="2" className="bar-grow" style={{ animationDelay: `${i * 40 + 60}ms` }} />
              <text x={x0 + bw / 2} y={H - 8} textAnchor="middle" fontSize="9.5" fill={TXT} fontFamily="IBM Plex Mono">
                {lb}
              </text>
            </g>
          );
        })}
        <line x1={padL} x2={W - 4} y1={H - padB} y2={H - padB} stroke={AX} strokeWidth="1" />
      </svg>
      <div className="mt-1 flex items-center gap-4 px-1">
        <span className="flex items-center gap-1.5 text-[11px] text-mist-400">
          <span className="h-2 w-2 rounded-sm" style={{ background: aColor }} /> {aLabel}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-mist-400">
          <span className="h-2 w-2 rounded-sm" style={{ background: bColor }} /> {bLabel}
        </span>
      </div>
    </div>
  );
}

export function HBars({
  items, color = "#F5A524", unit = "", maxOverride,
}: {
  items: { label: string; value: number; hint?: string }[];
  color?: string;
  unit?: string;
  maxOverride?: number;
}) {
  const max = maxOverride ?? Math.max(...items.map((i) => i.value)) * 1.08;
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <div key={it.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="text-[12px] text-mist-300">{it.label}</span>
            <span className="font-mono text-[11.5px] text-mist-200">
              {unit === "%" ? `${it.value}%` : unit === "$" ? `$${it.value.toLocaleString()}` : it.value}
              {it.hint && <span className="ml-1.5 text-mist-500">{it.hint}</span>}
            </span>
          </div>
          <div className="h-[7px] overflow-hidden rounded-full bg-ink-700">
            <div
              className="hbar-grow h-full rounded-full"
              style={{ width: `${(it.value / max) * 100}%`, background: color, animationDelay: `${i * 60}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Donut({
  value, label, sub, color = "#F5A524", size = 132,
}: {
  value: number;
  label: string;
  sub?: string;
  color?: string;
  size?: number;
}) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (value / 100) * c;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#1A2636" strokeWidth="13" />
        <circle
          cx="66" cy="66" r={r} fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`} transform="rotate(-90 66 66)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.2,0.7,0.3,1)" }}
        />
        <text x="66" y="63" textAnchor="middle" fontSize="30" fontWeight="600" fill="#E6EEF7" fontFamily="Barlow Condensed">
          {value}%
        </text>
        <text x="66" y="82" textAnchor="middle" fontSize="10" fill={TXT} fontFamily="IBM Plex Mono" letterSpacing="1.5">
          {label.toUpperCase()}
        </text>
      </svg>
      {sub && <p className="max-w-[170px] text-[12px] leading-relaxed text-mist-400">{sub}</p>}
    </div>
  );
}

export function SegDonut({ parts, size = 132 }: { parts: { label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  const r = 52;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 132 132">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#1A2636" strokeWidth="13" />
        {parts.map((p) => {
          const frac = p.value / total;
          const dash = `${frac * c} ${c - frac * c}`;
          const off = -acc * c;
          acc += frac;
          return (
            <circle
              key={p.label} cx="66" cy="66" r={r} fill="none" stroke={p.color} strokeWidth="13"
              strokeDasharray={dash} strokeDashoffset={off} transform="rotate(-90 66 66)"
            />
          );
        })}
        <text x="66" y="64" textAnchor="middle" fontSize="27" fontWeight="600" fill="#E6EEF7" fontFamily="Barlow Condensed">
          {total}
        </text>
        <text x="66" y="82" textAnchor="middle" fontSize="9.5" fill={TXT} fontFamily="IBM Plex Mono" letterSpacing="1.2">
          30-DAY TOTAL
        </text>
      </svg>
      <ul className="space-y-1.5">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-[12px] text-mist-300">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
            {p.label}
            <span className="font-mono text-mist-500">{p.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Heat({
  rows, cols, values,
}: {
  rows: string[];
  cols: string[];
  values: number[][];
}) {
  const cell = 34;
  const padL = 40;
  const padT = 18;
  const W = padL + cols.length * cell + 6;
  const H = padT + rows.length * (cell * 0.62) + 6;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {cols.map((cl, j) => (
        <text key={cl} x={padL + j * cell + cell / 2} y={11} textAnchor="middle" fontSize="8.5" fill={TXT} fontFamily="IBM Plex Mono">
          {cl}
        </text>
      ))}
      {rows.map((rw, i) => (
        <g key={rw}>
          <text x={padL - 6} y={padT + i * (cell * 0.62) + 13} textAnchor="end" fontSize="8.5" fill={TXT} fontFamily="IBM Plex Mono">
            {rw}
          </text>
          {values[i].map((v, j) => (
            <rect
              key={j}
              x={padL + j * cell + 1.5}
              y={padT + i * (cell * 0.62) + 1.5}
              width={cell - 3}
              height={cell * 0.62 - 3}
              rx="3"
              fill={`rgba(245,165,36,${0.06 + v * 0.8})`}
              stroke={v > 0.85 ? "#F5A524" : "transparent"}
              strokeWidth="1"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

export function Spark({ data, color = "#45C8E0", w = 120, h = 34 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.9;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={color} opacity="0.09" />
    </svg>
  );
}
