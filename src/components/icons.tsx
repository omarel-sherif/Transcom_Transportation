import type { ReactNode } from "react";

const P: Record<string, ReactNode> = {
  bus: (
    <>
      <rect x="3" y="4" width="18" height="13" rx="2.2" />
      <path d="M3 12.5h18" />
      <path d="M7.5 7.5h9" />
      <circle cx="7.6" cy="19.2" r="1.6" />
      <circle cx="16.4" cy="19.2" r="1.6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21.2S5.5 15.6 5.5 11a6.5 6.5 0 1 1 13 0c0 4.6-6.5 10.2-6.5 10.2z" />
      <circle cx="12" cy="10.8" r="2.3" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 12l5.6-5.6" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7v5.2l3.4 2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
      <circle cx="16.8" cy="9.5" r="2.5" />
      <path d="M15.6 14.6c2.4.2 4.3 1.8 4.9 4.4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.6" />
      <path d="M5 20c.8-3.8 3.5-5.8 7-5.8s6.2 2 7 5.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 2.5v5.2c0 4.6-2.9 8.2-7 10-4.1-1.8-7-5.4-7-10V5.5z" />
      <path d="M9 11.6l2.1 2.1 4-4.2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.6L2.8 19.4h18.4z" />
      <path d="M12 9.5v4.6" />
      <circle cx="12" cy="16.9" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  phone: (
    <>
      <path d="M5.5 4h3l1.5 4-2 1.5a12.5 12.5 0 0 0 6.5 6.5L16 14l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 6.2 2 2 0 0 1 5.5 4z" />
    </>
  ),
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
      <path d="M9 12h6M9 15.5h6" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  taxi: (
    <>
      <path d="M4 16.5v-3l1.7-4.4A2 2 0 0 1 7.6 7.8h8.8a2 2 0 0 1 1.9 1.3L20 13.5v3" />
      <path d="M4 13.5h16" />
      <path d="M10 7.8V5.6h4v2.2" />
      <circle cx="7.4" cy="18.4" r="1.5" />
      <circle cx="16.6" cy="18.4" r="1.5" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="18" r="2.3" />
      <circle cx="18" cy="6" r="2.3" />
      <path d="M8.2 16.6c4.4-2 1.6-6.8 7.4-9" />
    </>
  ),
  gauge: (
    <>
      <path d="M4 16.5a8.5 8.5 0 1 1 16 0" />
      <path d="M12 14.5l3.8-4.6" />
      <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  bell: (
    <>
      <path d="M6 16v-5.5a6 6 0 1 1 12 0V16l1.5 2.5h-15z" />
      <path d="M10 21a2.2 2.2 0 0 0 4 0" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7" />
    </>
  ),
  doc: (
    <>
      <path d="M5 3.5h14v17H5z" />
      <path d="M8 8h8M8 11.5h8M8 15h5" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v10" />
      <path d="M8 10.5l4 4 4-4" />
      <path d="M5 19.5h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 14V4" />
      <path d="M8 7.5l4-4 4 4" />
      <path d="M5 19.5h14" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15.2 15.2L20 20" />
    </>
  ),
  chevron: <path d="M9 5.5l6.5 6.5L9 18.5" />,
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="M14 6.5l5.5 5.5-5.5 5.5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11l-2.5 3.5L17 12H6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  wrench: (
    <>
      <path d="M14.5 7.5a4 4 0 0 1 5-5l-3 3 .8 2.7 2.7.8 3-3a4 4 0 0 1-5 5L8.5 20.5a2 2 0 0 1-3-3z" transform="scale(0.92) translate(0.6,0.6)" />
    </>
  ),
  radio: (
    <>
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M6 18a8.5 8.5 0 0 1 0-12M18 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <path d="M6.5 14.5h4" />
    </>
  ),
  power: (
    <>
      <path d="M12 3.5v8" />
      <path d="M6.8 6.8a7.5 7.5 0 1 0 10.4 0" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5l9 4.5-9 4.5-9-4.5z" />
      <path d="M3.5 12.5L12 16.8l8.5-4.3" />
      <path d="M3.5 16.5L12 20.8l8.5-4.3" />
    </>
  ),
  map: (
    <>
      <path d="M9 4.5L3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  pulse: <path d="M3 12h4l2.2-5.5 3.6 11L15 12h6" />,
  swap: (
    <>
      <path d="M7 4.5L3.5 8 7 11.5" />
      <path d="M3.5 8h13" />
      <path d="M17 12.5l3.5 3.5-3.5 3.5" />
      <path d="M20.5 16h-13" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="10.5" width="13" height="9.5" rx="1.8" />
      <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  play: <path d="M8 5.5v13l10-6.5z" />,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="1.5" />,
  list: (
    <>
      <path d="M8.5 6h12M8.5 12h12M8.5 18h12" />
      <circle cx="4.5" cy="6" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5L3.5 10.2l6.8 2.6 2.6 7.7z" />
      <path d="M20.5 3.5L10.3 12.8" />
    </>
  ),
  history: (
    <>
      <path d="M4.5 6v4h4" />
      <path d="M4.8 10A8 8 0 1 1 4 13.5" />
      <path d="M12 8v4.3l3 1.8" />
    </>
  ),
  sos: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.5v5.5" />
      <circle cx="12" cy="16.3" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
};

export type IconName = keyof typeof P;

export function I({ n, s = 16, c = "", w = 1.7 }: { n: string; s?: number; c?: string; w?: number }) {
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={c}
      aria-hidden="true"
    >
      {P[n] ?? null}
    </svg>
  );
}
