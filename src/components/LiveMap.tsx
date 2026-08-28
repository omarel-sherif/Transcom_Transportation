import type { Trip } from "../lib/types";
import { POINTS, ROUTES, SITE_A, routeById } from "../lib/data";
import { pointAt } from "../lib/format";

export function LiveMap({
  trips, focus, onFocus, now,
}: {
  trips: Trip[];
  focus: string | null;
  onFocus: (id: string | null) => void;
  now: number;
}) {
  const moving = trips.filter((t) => ["in_progress", "started", "incident"].includes(t.status));

  return (
    <svg viewBox="0 0 800 540" className="w-full select-none" role="img" aria-label="Live operations map">
      <defs>
        <pattern id="mgrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#141d2b" strokeWidth="1" />
        </pattern>
        <radialGradient id="glowA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(245,165,36,0.14)" />
          <stop offset="100%" stopColor="rgba(245,165,36,0)" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="800" height="540" fill="#0A1017" />
      <rect x="0" y="0" width="800" height="540" fill="url(#mgrid)" />

      {/* city blocks for texture */}
      {[
        [70, 210, 120, 90], [230, 60, 140, 70], [420, 60, 130, 60], [560, 220, 100, 90],
        [120, 330, 110, 70], [330, 350, 90, 60], [600, 400, 120, 80], [60, 60, 90, 60],
      ].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="6" fill="#0D1520" stroke="#182434" strokeWidth="1" />
      ))}
      {/* river */}
      <path d="M-10 520 C 180 470, 300 540, 470 495 S 720 470, 810 500 L 810 545 L -10 545 Z" fill="#0D1B26" opacity="0.9" />
      <path d="M-10 512 C 180 462, 300 532, 470 487 S 720 462, 810 492" fill="none" stroke="#17303F" strokeWidth="2" />

      {/* routes */}
      {ROUTES.map((r) => {
        const d = r.path.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
        const isFocus = focus ? routeById(focusRoute(trips, focus))?.id === r.id : false;
        return (
          <g key={r.id}>
            <path d={d} fill="none" stroke={r.color} strokeOpacity={isFocus ? 0.9 : focus ? 0.16 : 0.34} strokeWidth={isFocus ? 3 : 2} strokeLinecap="round" />
            {isFocus && (
              <path d={d} fill="none" stroke="#E6EEF7" strokeOpacity="0.85" strokeWidth="1.4" strokeDasharray="3 23" className="dash-anim" strokeLinecap="round" />
            )}
          </g>
        );
      })}

      {/* pickup points */}
      {Object.values(POINTS).map((p) => (
        <g key={p.id}>
          <rect x={p.x - 3.5} y={p.y - 3.5} width="7" height="7" rx="1.5" fill="#0E1520" stroke="#5D7189" strokeWidth="1.2" transform={`rotate(45 ${p.x} ${p.y})`} />
        </g>
      ))}

      {/* site */}
      <g>
        <circle cx={SITE_A.x} cy={SITE_A.y} r="30" fill="url(#glowA)" />
        <rect x={SITE_A.x - 9} y={SITE_A.y - 9} width="18" height="18" rx="3" fill="#F5A524" />
        <path d={`M${SITE_A.x - 4.5} ${SITE_A.y + 4} v-6 l4.5 -3.5 4.5 3.5 v6 z`} fill="#0B1118" />
        <text x={SITE_A.x - 4} y={SITE_A.y + 30} fontSize="9.5" fill="#F5A524" fontFamily="IBM Plex Mono" letterSpacing="1.5">
          {SITE_A.label}
        </text>
      </g>

      {/* vehicles */}
      {moving.map((t) => {
        const route = routeById(t.routeId);
        if (!route) return null;
        const [x, y] = t.status === "incident" ? [route.path[0][0] + 14, route.path[0][1] + 6] : pointAt(route.path, t.progress);
        const sel = focus === t.id;
        const ring =
          t.gps.state === "live" ? "#45C8E0" : t.gps.state === "stale" ? "#FF8A3D" : "#FF5C5C";
        const ageS = Math.max(0, Math.round((now - t.gps.lastUpdate) / 1000));
        return (
          <g key={t.id} onClick={() => onFocus(sel ? null : t.id)} className="cursor-pointer">
            {t.gps.state === "live" && <circle cx={x} cy={y} r="9" fill={ring} opacity="0.5" className="pulse-ring" />}
            {sel && <circle cx={x} cy={y} r="16" fill="none" stroke="#E6EEF7" strokeWidth="1.2" strokeDasharray="3 4" />}
            <circle cx={x} cy={y} r="9.5" fill="#0E1520" stroke={ring} strokeWidth="2.2" />
            <rect x={x - 4.5} y={y - 3.5} width="9" height="7" rx="1.4" fill={ring} />
            <line x1={x - 3} y1={y - 1} x2={x + 3} y2={y - 1} stroke="#0E1520" strokeWidth="1.1" />
            {t.status === "incident" && (
              <g transform={`translate(${x + 9}, ${y - 16})`}>
                <path d="M0 10 L5.5 0 L11 10 Z" fill="#FF5C5C" />
                <text x="5.5" y="8.6" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#0B1118">!</text>
              </g>
            )}
            <g transform={`translate(${x + 13}, ${y + 4})`}>
              <rect x="0" y="-10" width="74" height="16" rx="3" fill="#0B1118" stroke={sel ? ring : "#24344A"} strokeWidth="1" opacity="0.95" />
              <text x="6" y="1.5" fontSize="9" fill="#E6EEF7" fontFamily="IBM Plex Mono">
                {t.id}
                <tspan fill={ring}> {t.gps.state === "live" ? `·LIVE ${ageS}s` : t.gps.state === "stale" ? `·STALE` : "·GPS OFF"}</tspan>
              </text>
            </g>
            {t.delayMin > 0 && t.status !== "incident" && (
              <text x={x - 14} y={y - 14} fontSize="10" fontWeight="700" fill={t.delayMin >= 20 ? "#FF8A3D" : "#FFD84D"} fontFamily="IBM Plex Mono">
                +{t.delayMin}m
              </text>
            )}
          </g>
        );
      })}

      {/* legend */}
      <g transform="translate(14, 470)">
        <rect x="0" y="0" width="176" height="58" rx="6" fill="#0B1118" stroke="#1F2D40" opacity="0.95" />
        <circle cx="14" cy="14" r="4" fill="#45C8E0" />
        <text x="24" y="17.5" fontSize="9" fill="#A6B7CA" fontFamily="IBM Plex Mono">GPS LIVE (&lt;2m)</text>
        <circle cx="100" cy="14" r="4" fill="#FF8A3D" />
        <text x="110" y="17.5" fontSize="9" fill="#A6B7CA" fontFamily="IBM Plex Mono">STALE</text>
        <circle cx="14" cy="30" r="4" fill="#FF5C5C" />
        <text x="24" y="33.5" fontSize="9" fill="#A6B7CA" fontFamily="IBM Plex Mono">GPS OFF / INCIDENT</text>
        <rect x="103" y="26.5" width="7" height="7" rx="1.5" fill="#0E1520" stroke="#5D7189" transform="rotate(45 106.5 30)" />
        <text x="116" y="33.5" fontSize="9" fill="#A6B7CA" fontFamily="IBM Plex Mono">PICKUP</text>
        <text x="14" y="49" fontSize="8.5" fill="#5D7189" fontFamily="IBM Plex Mono">Stale ≠ live position. Last fix shown.</text>
      </g>
    </svg>
  );
}

function focusRoute(trips: Trip[], focusId: string): string {
  return trips.find((t) => t.id === focusId)?.routeId ?? "";
}
