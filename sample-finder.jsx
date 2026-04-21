import { useState, useEffect, useRef } from "react";

// ── THEME ─────────────────────────────────────────────────────────────────────
const BRAND = "linear-gradient(135deg, #A855F7 0%, #EC4899 50%, #F97316 100%)";
const BRAND_S = "0 6px 20px rgba(168,85,247,0.38)";
const ACCENT = "#A855F7";
const SF = "-apple-system,BlinkMacSystemFont,'SF Pro Display','SF Pro Text',Helvetica Neue,Helvetica,Arial,sans-serif";
const BAR_C = ["#A855F7", "#EC4899", "#F97316", "#6B5CE7"];

// ── XP SYSTEM ────────────────────────────────────────────────────────────────
const XP_PER_SAMPLE = 25;
const MAX_LEVEL = 100;

// Level 1-10: kolay, rahat atlarsın (her level ~4-8 sample)
// Level 11-20: zorluk belirgin artar (~15-50 sample/level)
// Level 30-50: ciddi efor gerekir (~100-300 sample/level)
// Level 70+: gerçek adanmışlık (~600-1500 sample/level)
// Level 90+: efsane statüsü (~2000+ sample/level)
function xpForLevel(level) {
  if (level <= 1) return 0;
  if (level <= 10) {
    // İlk 10 level: yumuşak doğrusal artış
    return Math.floor(100 * (level - 1) + 10 * Math.pow(level - 1, 2));
  }
  // Level 10'daki eşik: 1710 XP
  const xpAt10 = 1710;
  const beyond = level - 10;
  // Polinom eğri: yavaş başlayıp giderek sertleşen + base offset per level
  return Math.floor(xpAt10 + 80 * Math.pow(beyond, 2.5) + 200 * beyond);
}
function getLevel(totalXP) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && totalXP >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}
function getLevelProgress(totalXP) {
  const lvl = getLevel(totalXP);
  if (lvl >= MAX_LEVEL) return 1;
  const curr = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return (totalXP - curr) / (next - curr);
}
function samplesToNext(totalXP) {
  const lvl = getLevel(totalXP);
  if (lvl >= MAX_LEVEL) return 0;
  const remaining = xpForLevel(lvl + 1) - totalXP;
  return Math.ceil(remaining / XP_PER_SAMPLE);
}
const TITLES = [
  [1, "Listener"], [3, "Digger"], [6, "Crate Diver"], [10, "Sample Hound"],
  [15, "Vinyl Archaeologist"], [20, "Beat Geologist"], [25, "Groove Cartographer"],
  [30, "Sound Alchemist"], [35, "Rhythm Shaman"], [40, "Wax Sage"],
  [50, "Frequency Oracle"], [60, "Echo Architect"], [70, "Sonic Mythmaker"],
  [80, "Groove Eternal"], [90, "Timeless Ear"], [100, "Sample God"],
];
function getTitle(level) {
  let t = TITLES[0][1];
  for (const [minLvl, title] of TITLES) { if (level >= minLvl) t = title; }
  return t;
}

// ── LEVEL ICON SYSTEM ────────────────────────────────────────────────────────
const ICON_TIERS = [
  { name: "LISTENER", range: [1, 10], accent: "#AEAEB2" },
  { name: "DIGGER", range: [11, 20], accent: "#A1A1A6" },
  { name: "CRATE DIVER", range: [21, 30], accent: "#8E8E93" },
  { name: "SAMPLE HOUND", range: [31, 40], accent: "#B4B8C0" },
  { name: "BEAT GEOLOGIST", range: [41, 50], accent: "#C8CCD4" },
  { name: "SOUND ALCHEMIST", range: [51, 60], accent: "#D4A853" },
  { name: "SONIC MYTHMAKER", range: [61, 70], accent: "#D4A853" },
  { name: "GROOVE ETERNAL", range: [71, 80], accent: "#C9A84C" },
  { name: "TIMELESS EAR", range: [81, 90], accent: "#A78BFA" },
  { name: "SAMPLE GOD", range: [91, 100], accent: "#FFD700" },
];
function _pc(cx, cy, r, deg) { const rad = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; }
function _arc(cx, cy, r, s, e) { const [sx, sy] = _pc(cx, cy, r, s); const [ex, ey] = _pc(cx, cy, r, e); return `M${sx},${sy} A${r},${r} 0 ${e - s > 180 ? 1 : 0} 1 ${ex},${ey}`; }

function LevelIcon({ level, size = 64 }) {
  const g = `li${level}`, C = 32;

  // L1-10 LISTENER
  if (level <= 10) {
    const bars = Math.min(level, 5), barH = 6 + (level <= 5 ? level * 1.8 : 9 + (level - 5) * 1.2);
    const dotR = 2.5 + level * 0.2, barW = level <= 5 ? 2.8 : 3.2, gap = level <= 5 ? 6 : 5.5;
    const glowOp = 0.08 + level * 0.025, extraBars = level > 5 ? level - 5 : 0;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={`${g}r`} x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#C7C7CC" /><stop offset="100%" stopColor="#8E8E93" /></linearGradient>
          <linearGradient id={`${g}bar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#BEBEC3" /><stop offset="100%" stopColor="#7C7C82" /></linearGradient>
          <radialGradient id={`${g}glow`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#AEAEB2" stopOpacity={glowOp} /><stop offset="100%" stopColor="#AEAEB2" stopOpacity="0" /></radialGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="30" fill={`url(#${g}glow)`} />
        <circle cx={C} cy={C} r="28" stroke={`url(#${g}r)`} strokeWidth="1.8" opacity={0.4 + level * 0.05} />
        {level >= 3 && <circle cx={C} cy={C} r="20" stroke={`url(#${g}r)`} strokeWidth="0.7" opacity={0.15 + level * 0.03} />}
        {level >= 6 && Array.from({ length: 4 + extraBars }).map((_, i) => { const a = (360 / (4 + extraBars)) * i - 90; const [x1, y1] = _pc(C, C, 26, a); const [x2, y2] = _pc(C, C, 28, a); return <line key={`t${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#AEAEB2" strokeWidth="1.2" strokeLinecap="round" opacity={0.3 + level * 0.03} />; })}
        {Array.from({ length: bars }).map((_, i) => { const x = C - ((bars - 1) * gap) / 2 + i * gap; const h = barH * (1 - Math.abs(i - (bars - 1) / 2) * 0.2); return <rect key={i} x={x - barW / 2} y={C - h / 2} width={barW} height={h} rx="1.4" fill={`url(#${g}bar)`} opacity={0.6 + level * 0.035} />; })}
        <circle cx={C} cy={C} r={dotR} fill={`url(#${g}r)`} opacity={0.7 + level * 0.025} filter={level >= 5 ? `url(#${g}gl)` : undefined} />
      </svg>
    );
  }

  // L11-20 DIGGER
  if (level <= 20) {
    const rank = level - 10, arcs = Math.ceil(rank / 2), outerR = 27, innerR = 16;
    const arcLen = 35 + rank * 4, eqBars = 3 + Math.min(rank, 4), glowOp = 0.1 + rank * 0.025;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={`${g}o`} x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#C7C7CC" /><stop offset="100%" stopColor="#86868B" /></linearGradient>
          <linearGradient id={`${g}arc`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D1D1D6" /><stop offset="100%" stopColor="#A1A1A6" /></linearGradient>
          <linearGradient id={`${g}bar`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B0B0B8" /><stop offset="100%" stopColor="#6E6E73" /></linearGradient>
          <radialGradient id={`${g}glow`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#AEAEB2" stopOpacity={glowOp} /><stop offset="100%" stopColor="#AEAEB2" stopOpacity="0" /></radialGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="1.8" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="31" fill={`url(#${g}glow)`} />
        <circle cx={C} cy={C} r={outerR} stroke={`url(#${g}o)`} strokeWidth="1.4" opacity={0.35 + rank * 0.04} />
        <circle cx={C} cy={C} r={innerR} stroke={`url(#${g}o)`} strokeWidth="1" opacity={0.4 + rank * 0.03} />
        {rank >= 5 && <circle cx={C} cy={C} r={22} stroke={`url(#${g}o)`} strokeWidth="0.6" opacity={0.2 + rank * 0.02} />}
        {Array.from({ length: arcs }).map((_, i) => { const startA = (360 / arcs) * i; return <path key={i} d={_arc(C, C, outerR, startA, startA + arcLen)} stroke={`url(#${g}arc)`} strokeWidth="2.8" strokeLinecap="round" opacity={0.5 + rank * 0.04} filter={rank >= 4 ? `url(#${g}gl)` : undefined} />; })}
        {rank >= 3 && Array.from({ length: Math.min(arcs, 3) }).map((_, i) => { const startA = (360 / Math.min(arcs, 3)) * i + 45; return <path key={`ia${i}`} d={_arc(C, C, innerR, startA, startA + 25 + rank * 2)} stroke="#A1A1A6" strokeWidth="1.5" strokeLinecap="round" opacity={0.3 + rank * 0.03} fill="none" />; })}
        {Array.from({ length: eqBars }).map((_, i) => { const x = C - ((eqBars - 1) * 3.5) / 2 + i * 3.5; const h = [4, 7, 10, 8, 5, 9, 6][i % 7] * (0.6 + rank * 0.05); return <rect key={`b${i}`} x={x - 1.2} y={C - h / 2} width="2.4" height={h} rx="1.2" fill={`url(#${g}bar)`} opacity={0.5 + rank * 0.035} />; })}
        <circle cx={C} cy={C} r={3 + rank * 0.15} fill={`url(#${g}o)`} opacity={0.65 + rank * 0.03} filter={`url(#${g}gl)`} />
        {rank >= 7 && Array.from({ length: rank - 4 }).map((_, i) => { const a = (360 / (rank - 4)) * i; const [dx, dy] = _pc(C, C, outerR, a); return <circle key={`d${i}`} cx={dx} cy={dy} r="1.2" fill="#C7C7CC" opacity={0.4 + rank * 0.03} />; })}
      </svg>
    );
  }

  // L21-30 CRATE DIVER
  if (level <= 30) {
    const rank = level - 20, crowns = Math.ceil(rank / 2);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={`${g}m`} x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#8E8E93" /><stop offset="100%" stopColor="#58585D" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="28" stroke="#8E8E93" strokeWidth="0.8" opacity="0.25" />
        <circle cx={C} cy={C} r="22" stroke="#8E8E93" strokeWidth="0.9" opacity="0.35" />
        <circle cx={C} cy={C} r="16" stroke="#8E8E93" strokeWidth="1" opacity="0.45" />
        {Array.from({ length: crowns }).map((_, i) => { const spread = 25 + rank * 2; const startA = 270 - spread + i * (spread * 2 / Math.max(crowns - 1, 1)); const arcR = 31 + i * 0.5; return <path key={i} d={_arc(C, C, arcR, crowns === 1 ? 270 - 15 : startA, (crowns === 1 ? 270 + 15 : startA) + 20)} stroke={`url(#${g}m)`} strokeWidth="2" strokeLinecap="round" opacity={0.6 + rank * 0.025} filter={rank > 5 ? `url(#${g}gl)` : undefined} />; })}
        <circle cx={C} cy={C} r={3 + rank * 0.1} fill="#58585D" />
        {Array.from({ length: 5 }).map((_, i) => { const x = C - 10 + i * 5; const h = [4, 7, 10, 6, 3][i] * (0.6 + rank * 0.04); return <rect key={`w${i}`} x={x - 0.8} y={C - h / 2} width="1.6" height={h} rx="0.8" fill="#58585D" opacity={0.4 + rank * 0.03} />; })}
      </svg>
    );
  }

  // L31-40 SAMPLE HOUND
  if (level <= 40) {
    const rank = level - 30, shimmer = 0.04 + rank * 0.02;
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={`${g}sh`} x1="16" y1="6" x2="48" y2="58"><stop offset="0%" stopColor="#D1D1D6" /><stop offset="50%" stopColor="#B4B8C0" /><stop offset="100%" stopColor="#8E8E93" /></linearGradient>
          <linearGradient id={`${g}hi`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="white" stopOpacity={shimmer} /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="1.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <path d="M32 6L52 18V38C52 48 42 56 32 60C22 56 12 48 12 38V18L32 6Z" fill={`url(#${g}sh)`} opacity={0.2 + rank * 0.06} />
        <path d="M32 6L52 18V38C52 48 42 56 32 60C22 56 12 48 12 38V18L32 6Z" fill={`url(#${g}hi)`} />
        <path d="M32 6L52 18V38C52 48 42 56 32 60C22 56 12 48 12 38V18L32 6Z" fill="none" stroke="#B4B8C0" strokeWidth="1.2" opacity={0.4 + rank * 0.04} />
        <circle cx={C} cy={C + 2} r={12 + rank * 0.3} stroke="#8E8E93" strokeWidth="0.8" opacity="0.4" />
        {Array.from({ length: Math.min(rank, 4) }).map((_, i) => (<path key={i} d={_arc(C, C + 2, 6 + i * 2.5, 200 + i * 15, 340 - i * 15)} stroke="#6E6E73" strokeWidth="1.5" strokeLinecap="round" opacity={0.5 + rank * 0.03} filter={rank > 6 ? `url(#${g}gl)` : undefined} />))}
        <circle cx={C} cy={C + 2} r={2.2} fill="#6E6E73" />
      </svg>
    );
  }

  // L41-50 BEAT GEOLOGIST
  if (level <= 50) {
    const rank = level - 40, facets = 4 + Math.floor(rank / 2);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id={`${g}gem`} x1="0" y1="0" x2="64" y2="64"><stop offset="0%" stopColor="#E5E5EA" /><stop offset="40%" stopColor="#C8CCD4" /><stop offset="100%" stopColor="#A1A1A6" /></linearGradient>
          <linearGradient id={`${g}face`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="white" stopOpacity="0.15" /><stop offset="100%" stopColor="white" stopOpacity="0" /></linearGradient>
        </defs>
        <path d="M32 4L54 20L54 44L32 60L10 44L10 20Z" fill={`url(#${g}gem)`} opacity={0.15 + rank * 0.04} />
        <path d="M32 4L54 20L54 44L32 60L10 44L10 20Z" fill="none" stroke="#C8CCD4" strokeWidth="1" opacity={0.5 + rank * 0.03} />
        {Array.from({ length: facets }).map((_, i) => { const a = (360 / facets) * i; const [x1, y1] = _pc(C, C, 10 + rank * 0.5, a); const [x2, y2] = _pc(C, C, 18 + rank * 0.3, a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#A1A1A6" strokeWidth="0.6" opacity={0.3 + rank * 0.03} />; })}
        <circle cx={C} cy={C} r={10 + rank * 0.5} fill={`url(#${g}face)`} stroke="#B0B0B8" strokeWidth="0.8" opacity="0.6" />
        {Array.from({ length: 7 }).map((_, i) => { const x = C - 9 + i * 3; const h = [3, 5, 8, 10, 7, 4, 2][i] * (0.5 + rank * 0.06); return <rect key={`w${i}`} x={x - 0.7} y={C - h / 2} width="1.4" height={h} rx="0.7" fill="#3A3A3C" opacity={0.4 + rank * 0.04} />; })}
      </svg>
    );
  }

  // L51-60 SOUND ALCHEMIST
  if (level <= 60) {
    const rank = level - 50, orbits = 2 + Math.floor(rank / 3);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`${g}core`} cx="40%" cy="35%" r="60%"><stop offset="0%" stopColor="#E8E8ED" /><stop offset="100%" stopColor="#A1A1A6" /></radialGradient>
          <linearGradient id={`${g}gold`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#D4A853" /><stop offset="100%" stopColor="#B8922E" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        {Array.from({ length: orbits }).map((_, i) => { const tilt = -20 + i * (50 / orbits); return <ellipse key={i} cx={C} cy={C} rx={24 + i * 1.5} ry={10 + i * 2} transform={`rotate(${tilt},${C},${C})`} stroke={i === orbits - 1 ? `url(#${g}gold)` : "#8E8E93"} strokeWidth={i === orbits - 1 ? "1.2" : "0.7"} opacity={0.3 + rank * 0.04 + (i === orbits - 1 ? 0.15 : 0)} fill="none" />; })}
        <circle cx={C} cy={C} r={9 + rank * 0.2} fill={`url(#${g}core)`} opacity={0.4 + rank * 0.04} />
        <circle cx={C} cy={C} r={9 + rank * 0.2} fill="none" stroke="#C8CCD4" strokeWidth="0.8" opacity="0.6" />
        <circle cx={C - 2} cy={C - 2} r={3} fill="white" opacity={0.08 + rank * 0.01} />
        <circle cx={C} cy={C} r={2} fill={`url(#${g}gold)`} opacity={0.5 + rank * 0.04} filter={`url(#${g}gl)`} />
      </svg>
    );
  }

  // L61-70 SONIC MYTHMAKER
  if (level <= 70) {
    const rank = level - 60, petals = 6 + Math.floor(rank / 2);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`${g}halo`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#D4A853" stopOpacity={0.15 + rank * 0.02} /><stop offset="100%" stopColor="#D4A853" stopOpacity="0" /></radialGradient>
          <linearGradient id={`${g}petal`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D4A853" /><stop offset="100%" stopColor="#8B7535" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="30" fill={`url(#${g}halo)`} />
        <circle cx={C} cy={C} r="27" stroke="#D4A853" strokeWidth="0.6" opacity={0.2 + rank * 0.03} />
        {Array.from({ length: petals }).map((_, i) => { const a = (360 / petals) * i; const [x1, y1] = _pc(C, C, 6, a); const [x2, y2] = _pc(C, C, 18 + rank * 0.6, a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${g}petal)`} strokeWidth={1 + rank * 0.06} strokeLinecap="round" opacity={0.35 + rank * 0.04} />; })}
        {Array.from({ length: 3 }).map((_, i) => (<path key={`a${i}`} d={_arc(C, C, 10 + i * 3, i * 120, i * 120 + 60 + rank * 4)} stroke="#D4A853" strokeWidth="1.2" strokeLinecap="round" opacity={0.3 + rank * 0.04} filter={`url(#${g}gl)`} fill="none" />))}
        <circle cx={C} cy={C} r={3.5} fill="#D4A853" opacity={0.6 + rank * 0.03} filter={`url(#${g}gl)`} />
      </svg>
    );
  }

  // L71-80 GROOVE ETERNAL
  if (level <= 80) {
    const rank = level - 70, segments = 8 + rank, crownPts = 3 + Math.floor(rank / 2);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`${g}ob`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#2C2C2E" /><stop offset="100%" stopColor="#0A0A0C" /></radialGradient>
          <linearGradient id={`${g}au`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#E8C84A" /><stop offset="50%" stopColor="#C9A84C" /><stop offset="100%" stopColor="#A08030" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="26" fill={`url(#${g}ob)`} opacity={0.6 + rank * 0.03} />
        <circle cx={C} cy={C} r="26" fill="none" stroke="#C9A84C" strokeWidth="0.8" opacity={0.3 + rank * 0.04} />
        {Array.from({ length: segments }).map((_, i) => { const segLen = 360 / segments - 3; const startA = (360 / segments) * i; return <path key={i} d={_arc(C, C, 22, startA, startA + segLen)} stroke={`url(#${g}au)`} strokeWidth="1.5" strokeLinecap="round" opacity={0.4 + rank * 0.04} fill="none" />; })}
        {Array.from({ length: crownPts }).map((_, i) => { const a = (360 / crownPts) * i - 90; const [ox, oy] = _pc(C, C, 26, a); const [tx, ty] = _pc(C, C, 30 + rank * 0.3, a); return <line key={`c${i}`} x1={ox} y1={oy} x2={tx} y2={ty} stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" opacity={0.5 + rank * 0.04} filter={`url(#${g}gl)`} />; })}
        <circle cx={C} cy={C} r={8} fill="none" stroke="#C9A84C" strokeWidth="0.6" opacity="0.35" />
        <circle cx={C} cy={C} r={3} fill={`url(#${g}au)`} opacity={0.7 + rank * 0.02} filter={`url(#${g}gl)`} />
        {Array.from({ length: 5 }).map((_, i) => { const x = C - 6 + i * 3; const h = [3, 5, 7, 4, 2][i] * (0.8 + rank * 0.04); return <rect key={`w${i}`} x={x - 0.6} y={C - h / 2} width="1.2" height={h} rx="0.6" fill="#C9A84C" opacity={0.5 + rank * 0.03} />; })}
      </svg>
    );
  }

  // L81-90 TIMELESS EAR
  if (level <= 90) {
    const rank = level - 80, rays = 10 + rank;
    const auroraC = ["#A78BFA", "#818CF8", "#67E8F9", "#6EE7B7", "#FCD34D"];
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`${g}aur`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#A78BFA" stopOpacity={0.12 + rank * 0.02} /><stop offset="60%" stopColor="#818CF8" stopOpacity="0.06" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="30" fill={`url(#${g}aur)`} />
        {Array.from({ length: rays }).map((_, i) => { const a = (360 / rays) * i; const c = auroraC[i % 5]; const [x1, y1] = _pc(C, C, 8, a); const [x2, y2] = _pc(C, C, 24 + rank * 0.4, a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={0.8 + rank * 0.05} strokeLinecap="round" opacity={0.2 + rank * 0.03} />; })}
        {Array.from({ length: 4 }).map((_, i) => { const c = auroraC[i]; const r = 14 + i * 4; const s = i * 40 + rank * 8; return <path key={`ar${i}`} d={_arc(C, C, r, s, s + 50 + rank * 5)} stroke={c} strokeWidth="1.3" strokeLinecap="round" opacity={0.25 + rank * 0.04} filter={`url(#${g}gl)`} fill="none" />; })}
        <circle cx={C} cy={C} r={5} fill="none" stroke="#A78BFA" strokeWidth="1" opacity={0.5 + rank * 0.04} filter={`url(#${g}gl)`} />
        <circle cx={C} cy={C} r={2.5} fill="#A78BFA" opacity={0.6 + rank * 0.03} filter={`url(#${g}gl)`} />
      </svg>
    );
  }

  // L91-100 SAMPLE GOD
  {
    const rank = level - 90, mp = 12 + rank, outerRays = 16 + rank * 2, innerRings = 3 + Math.floor(rank / 3);
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <defs>
          <radialGradient id={`${g}glow`} cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFD700" stopOpacity={0.2 + rank * 0.025} /><stop offset="40%" stopColor="#FFD700" stopOpacity="0.08" /><stop offset="100%" stopColor="transparent" /></radialGradient>
          <linearGradient id={`${g}au`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#FFE066" /><stop offset="50%" stopColor="#FFD700" /><stop offset="100%" stopColor="#B8860B" /></linearGradient>
          <filter id={`${g}gl`}><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id={`${g}gl2`}><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <circle cx={C} cy={C} r="31" fill={`url(#${g}glow)`} />
        {Array.from({ length: outerRays }).map((_, i) => { const a = (360 / outerRays) * i; const len = i % 2 === 0 ? 28 + rank * 0.2 : 24; const [x1, y1] = _pc(C, C, 20, a); const [x2, y2] = _pc(C, C, len, a); return <line key={`r${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`url(#${g}au)`} strokeWidth={i % 2 === 0 ? 1.2 : 0.6} strokeLinecap="round" opacity={0.3 + rank * 0.04} />; })}
        {Array.from({ length: mp }).map((_, i) => { const a = (360 / mp) * i; const r = 14; const pl = 7 + rank * 0.3; const [sx, sy] = _pc(C, C, r - pl / 2, a); const [ex, ey] = _pc(C, C, r + pl / 2, a); return <line key={`p${i}`} x1={sx} y1={sy} x2={ex} y2={ey} stroke="#FFD700" strokeWidth="1.8" strokeLinecap="round" opacity={0.35 + rank * 0.04} filter={`url(#${g}gl)`} />; })}
        {Array.from({ length: innerRings }).map((_, i) => (<circle key={`ir${i}`} cx={C} cy={C} r={5 + i * 3} fill="none" stroke="#FFD700" strokeWidth={0.5 + (innerRings - i) * 0.15} opacity={0.2 + rank * 0.03 + i * 0.05} />))}
        <circle cx={C} cy={C} r={4} fill={`url(#${g}au)`} opacity={0.7 + rank * 0.025} filter={`url(#${g}gl2)`} />
        <circle cx={C} cy={C} r={2} fill="#FFF5CC" opacity={0.8 + rank * 0.02} />
      </svg>
    );
  }
}

// ── BACKEND API ───────────────────────────────────────────────────────────────
const API_URL = "http://localhost:3001";

const api = {
  async post(path, body, token) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async get(path, token) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return res.json();
  },
  async patch(path, body, token) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return res.json();
  },
};

const LIGHT = {
  bg: "#F2F2F7", card: "#FFFFFF", text: "#1C1C1E", sub: "#8E8E93",
  border: "#E5E5EA", sep: "#F2F2F7", navBg: "#FFFFFF", detailBg: "#FFFFFF",
};
const DARK = {
  bg: "#0D1B2A", card: "#112240", text: "#E8F0FE", sub: "#6B8CAE",
  border: "#1E3A5F", sep: "#1E3A5F", navBg: "#0A1628", detailBg: "#112240",
};

const T = {
  tr: {
    appName: "SampleHunt",
    discover: "Keşfet", library: "Kütüphane", discoveries: "Keşifler", profile: "Profil",
    discoverNew: "✦ Yeni Sample Keşfet", filters: "Filtreler", applyFilter: "Filtre Uygula", clearFilter: "Temizle",
    recentDiscoveries: "Son Keşifler", noResults: "Keşfetmeye başlamak için butona dokun",
    save: "Kaydet", comments: "Yorumlar", writeComment: "Yorum yaz...", addComment: "Yorum Ekle", noComments: "Henüz yorum yok", views: "görüntüleme",
    sampleMap: "Sample Haritası", samplePoints: "Sample Noktaları", productionNote: "Prodüksiyon Notu",
    lastDiscovery: "Son Keşif", artist: "Artist", releaseYear: "Çıkış Yılı", channel: "Kanal", viewsCount: "İzlenme", country: "Ülke", copyright: "Copyright",
    myLibrary: "Kütüphanem", noSavedSamples: "Henüz sample kaydetmedin.", tapToSave: "Kartlardaki 💾 ikonuna bas.",
    login: "Giriş Yap", register: "Hesap Oluştur", logout: "Çıkış", email: "E-posta", password: "Şifre", username: "Kullanıcı adı",
    loginTitle: "SampleHunt'a hoş geldin", registerTitle: "Keşfetmeye başla",
    noAccount: "Hesabın yok mu?", hasAccount: "Zaten hesabın var mı?",
    cancel: "Vazgeç", loading: "Yükleniyor...",
    loginSuccess: "Giriş başarılı", loginError: "Giriş başarısız.", connectionError: "Sunucuya bağlanılamadı.",
    darkMode: "Karanlık Mod", on: "Açık", off: "Kapalı", version: "Versiyon", totalDiscoveries: "Toplam Keşif", libraryCount: "Kütüphane",
    settings: "Ayarlar", close: "Kapat",
    trackNotFound: "Müzik bulunamadı", somethingWrong: "Bir şeyler ters gitti. Tekrar dene.",
    startExplore: "butona dokun", tapSaveIcon: "Kartlardaki 💾 ikonuna bas.",
    bpm: "BPM", key: "GAM", vibe: "VİBE", quality: "Kalite",
    excellent: "Mükemmel", veryGood: "Çok İyi", good: "İyi",
    intro: "İntro melodi", outroBreakdown: "Kapanış breakdown", loopPoint: "Loop noktası",
    instrumentalSection: "Enstrümantal bölüm", vocalCut: "Vokal kesme noktası", bassLine: "Bass hattı", orchestraIntro: "Orkestra girişi",
    loopIdeal: "Loop için ideal", breathRoom: "Nefes alma payı var", separatedInstruments: "Enstrümanlar ayrı",
    minimalProduction: "Minimal prodüksiyon", noDynamicChange: "Dinamik değişim yok", naturalFadeOut: "Doğal fade-out", melodyNotable: "Melodi dikkat çekici",
    productionNoteDefault: "Bu parça sample olarak kullanılabilecek niteliklere sahip. Özellikle melodi ve ritim bölümleri ilginç.",
    genre: "Tür", region: "Bölge", country: "Ülke", keyLabel: "Gam / Key", tempo: "Tempo (BPM)", yearRange: "Yıl Aralığı",
    tracks: "track", language: "Dil",
  },
  en: {
    appName: "SampleHunt",
    discover: "Discover", library: "Library", discoveries: "Discoveries", profile: "Profile",
    discoverNew: "✦ Discover New Sample", filters: "Filters", applyFilter: "Apply Filter", clearFilter: "Clear",
    recentDiscoveries: "Recent Discoveries", noResults: "Tap the button to start exploring",
    save: "Save", comments: "Comments", writeComment: "Write a comment...", addComment: "Add Comment", noComments: "No comments yet", views: "views",
    sampleMap: "Sample Map", samplePoints: "Sample Points", productionNote: "Production Note",
    lastDiscovery: "Last Discovery", artist: "Artist", releaseYear: "Release Year", channel: "Channel", viewsCount: "Views", country: "Country", copyright: "Copyright",
    myLibrary: "My Library", noSavedSamples: "No samples saved yet.", tapToSave: "Tap the 💾 icon on cards.",
    login: "Log In", register: "Sign Up", logout: "Logout", email: "Email", password: "Password", username: "Username",
    loginTitle: "Welcome to SampleHunt", registerTitle: "Start exploring",
    noAccount: "Don't have an account?", hasAccount: "Already have an account?",
    cancel: "Cancel", loading: "Loading...",
    loginSuccess: "Login successful", loginError: "Login failed.", connectionError: "Could not connect to server.",
    darkMode: "Dark Mode", on: "On", off: "Off", version: "Version", totalDiscoveries: "Total Discoveries", libraryCount: "Library",
    settings: "Settings", close: "Close",
    trackNotFound: "No music found", somethingWrong: "Something went wrong. Try again.",
    startExplore: "tap the button", tapSaveIcon: "Tap the 💾 icon on cards.",
    bpm: "BPM", key: "KEY", vibe: "VIBE", quality: "Quality",
    excellent: "Excellent", veryGood: "Very Good", good: "Good",
    intro: "Intro melody", outroBreakdown: "Outro breakdown", loopPoint: "Loop point",
    instrumentalSection: "Instrumental section", vocalCut: "Vocal cut point", bassLine: "Bass line", orchestraIntro: "Orchestra intro",
    loopIdeal: "Ideal for looping", breathRoom: "Breathing room", separatedInstruments: "Instruments separated",
    minimalProduction: "Minimal production", noDynamicChange: "No dynamic change", naturalFadeOut: "Natural fade-out", melodyNotable: "Melody notable",
    productionNoteDefault: "This track has qualities that make it suitable for sampling. Especially melody and rhythm sections are interesting.",
    genre: "Genre", region: "Region", country: "Country", keyLabel: "Key", tempo: "Tempo (BPM)", yearRange: "Year Range",
    tracks: "tracks", language: "Language",
  },
  es: {
    appName: "SampleHunt",
    discover: "Descubrir", library: "Biblioteca", profile: "Perfil",
    discoverNew: "✦ Descubrir Sample", filters: "Filtros", applyFilter: "Aplicar Filtro", clearFilter: "Limpiar",
    recentDiscoveries: "Descubrimientos Recientes", noResults: "Toca el botón para empezar",
    save: "Guardar", comments: "Comentarios", writeComment: "Escribe un comentario...", addComment: "Agregar Comentario", noComments: "Sin comentarios", views: "vistas",
    sampleMap: "Mapa de Sample", samplePoints: "Puntos de Sample", productionNote: "Nota de Producción",
    lastDiscovery: "Último Descubrimiento", artist: "Artista", releaseYear: "Año de Lanzamiento", channel: "Canal", viewsCount: "Vistas", country: "País", copyright: "Copyright",
    myLibrary: "Mi Biblioteca", noSavedSamples: "Aún no has guardado samples.", tapToSave: "Toca el icono 💾 en las tarjetas.",
    login: "Iniciar Sesión", register: "Registrarse", logout: "Cerrar Sesión", email: "Correo", password: "Contraseña", username: "Usuario",
    loginTitle: "Bienvenido a SampleHunt", registerTitle: "Empieza a explorar",
    noAccount: "¿No tienes cuenta?", hasAccount: "¿Ya tienes cuenta?",
    cancel: "Cancelar", loading: "Cargando...",
    loginSuccess: "Sesión iniciada", loginError: "Error de sesión.", connectionError: "No se pudo conectar al servidor.",
    darkMode: "Modo Oscuro", on: "Activado", off: "Desactivado", version: "Versión", totalDiscoveries: "Descubrimientos Totales", libraryCount: "Biblioteca",
    settings: "Ajustes", close: "Cerrar",
    trackNotFound: "No se encontró música", somethingWrong: "Algo salió mal. Intenta de nuevo.",
    startExplore: "toca el botón", tapSaveIcon: "Toca el icono 💾 en las tarjetas.",
    bpm: "BPM", key: "TONO", vibe: "VIBRA", quality: "Calidad",
    excellent: "Excelente", veryGood: "Muy Bueno", good: "Bueno",
    intro: "Melodía de intro", outroBreakdown: "Breakdown final", loopPoint: "Punto de loop",
    instrumentalSection: "Sección instrumental", vocalCut: "Punto de corte vocal", bassLine: "Línea de bajo", orchestraIntro: "Intro de orquesta",
    loopIdeal: "Ideal para loop", breathingRoom: "Espacio para respirar", separatedInstruments: "Instrumentos separados",
    minimalProduction: "Producción minimal", noDynamicChange: "Sin cambio dinámico", naturalFadeOut: "Fade-out natural", melodyNotable: "Melodía notable",
    productionNoteDefault: "Esta pista tiene cualidades que la hacen adecuada para sampling. Especialmente las secciones de melodía y ritmo son interesantes.",
    genre: "Género", region: "Región", country: "País", keyLabel: "Tono", tempo: "Tempo (BPM)", yearRange: "Rango de Año",
    tracks: "pistas", language: "Idioma",
  },
  de: {
    appName: "SampleHunt",
    discover: "Entdecken", library: "Bibliothek", profile: "Profil",
    discoverNew: "✦ Neues Sample Entdecken", filters: "Filter", applyFilter: "Filter Anwenden", clearFilter: "Löschen",
    recentDiscoveries: "Letzte Entdeckungen", noResults: "Tippe auf den Button zum Starten",
    save: "Speichern", comments: "Kommentare", writeComment: "Kommentar schreiben...", addComment: "Kommentieren", noComments: "Keine Kommentare", views: "Aufrufe",
    sampleMap: "Sample Map", samplePoints: "Sample Punkte", productionNote: "Produktionsnotiz",
    lastDiscovery: "Letzte Entdeckung", artist: "Künstler", releaseYear: "Erscheinungsjahr", channel: "Kanal", viewsCount: "Aufrufe", country: "Land", copyright: "Copyright",
    myLibrary: "Meine Bibliothek", noSavedSamples: "Noch keine Samples gespeichert.", tapToSave: "Tippe auf das 💾 Symbol.",
    login: "Anmelden", register: "Registrieren", logout: "Abmelden", email: "E-Mail", password: "Passwort", username: "Benutzername",
    loginTitle: "Willkommen bei SampleHunt", registerTitle: "Entdecke jetzt",
    noAccount: "Kein Konto?", hasAccount: "Hast du ein Konto?",
    cancel: "Abbrechen", loading: "Lädt...",
    loginSuccess: "Erfolgreich angemeldet", loginError: "Anmeldung fehlgeschlagen.", connectionError: "Serververbindung fehlgeschlagen.",
    darkMode: "Dunkelmodus", on: "An", off: "Aus", version: "Version", totalDiscoveries: "Gesamte Entdeckungen", libraryCount: "Bibliothek",
    settings: "Einstellungen", close: "Schließen",
    trackNotFound: "Keine Musik gefunden", somethingWrong: "Etwas ist schief gelaufen. Versuche es erneut.",
    startExplore: "tippe auf den Button", tapSaveIcon: "Tippe auf das 💾 Symbol.",
    bpm: "BPM", key: "TONART", vibe: "VIBE", quality: "Qualität",
    excellent: "Ausgezeichnet", veryGood: "Sehr Gut", good: "Gut",
    intro: "Intro Melodie", outroBreakdown: "Outro Breakdown", loopPoint: "Loop Punkt",
    instrumentalSection: "Instrumentaler Abschnitt", vocalCut: "Vokal Schnittpunkt", bassLine: "Basslinie", orchestraIntro: "Orchester Intro",
    loopIdeal: "Ideal zum Loopen", breathRoom: "Atemraum", separatedInstruments: "Instrumente getrennt",
    minimalProduction: "Minimale Produktion", noDynamikänderung: "Keine Dynamikänderung", naturalFadeOut: "Natürliches Fade-out", melodyNotable: "Melodie bemerkenswert",
    productionNoteDefault: "Dieser Track hat Qualitäten, die ihn für Sampling geeignet machen. Besonders Melodie- und Rhythmusabschnitte sind interessant.",
    genre: "Genre", region: "Region", country: "Land", keyLabel: "Tonart", tempo: "Tempo (BPM)", yearRange: "Jahresbereich",
    tracks: "Tracks", language: "Sprache",
  },
  fr: {
    appName: "SampleHunt",
    discover: "Découvrir", library: "Bibliothèque", profile: "Profil",
    discoverNew: "✦ Découvrir Nouveau Sample", filters: "Filtres", applyFilter: "Appliquer Filtre", clearFilter: "Effacer",
    recentDiscoveries: "Découvertes Récentes", noResults: "Appuyez sur le bouton pour commencer",
    save: "Sauvegarder", comments: "Commentaires", writeComment: "Écrire un commentaire...", addComment: "Ajouter", noComments: "Pas de commentaires", views: "vues",
    sampleMap: "Carte Sample", samplePoints: "Points Sample", productionNote: "Note de Production",
    lastDiscovery: "Dernière Découverte", artist: "Artiste", releaseYear: "Année de Sortie", channel: "Chaîne", viewsCount: "Vues", country: "Pays", copyright: "Copyright",
    myLibrary: "Ma Bibliothèque", noSavedSamples: "Pas encore de samples sauvegardés.", tapToSave: "Appuyez sur l'icône 💾.",
    login: "Connexion", register: "S'inscrire", logout: "Déconnexion", email: "E-mail", password: "Mot de passe", username: "Nom d'utilisateur",
    loginTitle: "Bienvenue sur SampleHunt", registerTitle: "Commencez à explorer",
    noAccount: "Pas de compte?", hasAccount: "Déjà un compte?",
    cancel: "Annuler", loading: "Chargement...",
    loginSuccess: "Connexion réussie", loginError: "Échec de connexion.", connectionError: "Connexion au serveur impossible.",
    darkMode: "Mode Sombre", on: "Activé", off: "Désactivé", version: "Version", totalDiscoveries: "Découvertes Totales", libraryCount: "Bibliothèque",
    settings: "Paramètres", close: "Fermer",
    trackNotFound: "Aucune musique trouvée", somethingWrong: "Quelque chose s'est mal passé. Réessayez.",
    startExplore: "appuyez sur le bouton", tapSaveIcon: "Appuyez sur l'icône 💾.",
    bpm: "BPM", key: "TONALITÉ", vibe: "VIBE", quality: "Qualité",
    excellent: "Excellent", veryGood: "Très Bon", good: "Bon",
    intro: "Mélodie d'intro", outroBreakdown: "Breakdown final", loopPoint: "Point de loop",
    instrumentalSection: "Section instrumentale", vocalCut: "Point de coupe vocal", bassLine: "Ligne de basse", orchestraIntro: "Intro orchestre",
    loopIdeal: "Idéal pour loop", breathRoom: "Respiration", separatedInstruments: " Instruments séparés",
    minimalProduction: "Production minimale", noDynamicChange: "Pas de changement dynamique", naturalFadeOut: "Fade-out naturel", melodyNotable: "Mélodie remarquable",
    productionNoteDefault: "Ce track a des qualités qui le rendent adapté pour le sampling. Surtout les sections mélodie et rythme sont intéressantes.",
    genre: "Genre", region: "Région", country: "Pays", keyLabel: "Tonalité", tempo: "Tempo (BPM)", yearRange: "Période",
    tracks: "pistes", language: "Langue",
  },
  it: {
    appName: "SampleHunt",
    discover: "Scopri", library: "Libreria", profile: "Profilo",
    discoverNew: "✦ Scopri Nuovo Sample", filters: "Filtri", applyFilter: "Applica Filtro", clearFilter: "Cancella",
    recentDiscoveries: "Scoperte Recenti", noResults: "Tocca il pulsante per iniziare",
    save: "Salva", comments: "Commenti", writeComment: "Scrivi un commento...", addComment: "Aggiungi", noComments: "Nessun commento", views: "visualizzazioni",
    sampleMap: "Mappa Sample", samplePoints: "Punti Sample", productionNote: "Nota di Produzione",
    lastDiscovery: "Ultima Scoperta", artist: "Artista", releaseYear: "Anno di Uscita", channel: "Canale", viewsCount: "Visualizzazioni", country: "Paese", copyright: "Copyright",
    myLibrary: "La mia Libreria", noSavedSamples: "Nessun sample salvato.", tapToSave: "Tocca l'icona 💾.",
    login: "Accedi", register: "Registrati", logout: "Esci", email: "Email", password: "Password", username: "Nome utente",
    loginTitle: "Benvenuto in SampleHunt", registerTitle: "Inizia a esplorare",
    noAccount: "Non hai un account?", hasAccount: "Hai già un account?",
    cancel: "Annulla", loading: "Caricamento...",
    loginSuccess: "Accesso riuscito", loginError: "Accesso fallito.", connectionError: "Connessione al server impossibile.",
    darkMode: "Modalità Scura", on: "Acceso", off: "Spento", version: "Versione", totalDiscoveries: "Scoperte Totali", libraryCount: "Libreria",
    settings: "Impostazioni", close: "Chiudi",
    trackNotFound: "Nessuna musica trovata", somethingWrong: "Qualcosa è andato storto. Riprova.",
    startExplore: "tocca il pulsante", tapSaveIcon: "Tocca l'icona 💾.",
    bpm: "BPM", key: "TONO", vibe: "VIBRA", quality: "Qualità",
    excellent: "Eccellente", veryGood: "Molto Buono", good: "Buono",
    intro: "Melodia intro", outroBreakdown: "Breakdown finale", loopPoint: "Punto di loop",
    instrumentalSection: "Sezione strumentale", vocalCut: "Punto di taglio vocale", bassLine: "Linea basso", orchestraIntro: "Intro orchestra",
    loopIdeal: "Ideale per場 loop", breathRoom: "Spazio di respiro", separatedInstruments: "Strumenti separati",
    minimalProduction: "Produzione minimale", noDynamicChange: "Nessun cambiamento dinamico", naturalFadeOut: "Fade-out naturale", melodyNotable: "Melodia notevole",
    productionNoteDefault: "Questo brano ha qualità che lo rendono adatto per il sampling. Specialmente le sezioni melodia e ritmo sono interessanti.",
    genre: "Genere", region: "Regione", country: "Paese", keyLabel: "Tono", tempo: "Tempo (BPM)", yearRange: "Periodo",
    tracks: "tracce", language: "Lingua",
  },
  nl: {
    appName: "SampleHunt",
    discover: "Ontdekken", library: "Bibliotheek", profile: "Profiel",
    discoverNew: "✦ Ontdek Nieuw Sample", filters: "Filters", applyFilter: "Filter Toepassen", clearFilter: "Wissen",
    recentDiscoveries: "Recente Ontdekkingen", noResults: "Tik op de knop om te beginnen",
    save: "Opslaan", comments: "Reacties", writeComment: "Schrijf een reactie...", addComment: "Toevoegen", noComments: "Geen reacties", views: "weergaven",
    sampleMap: "Sample Map", samplePoints: "Sample Punten", productionNote: "Productie Notitie",
    lastDiscovery: "Laatste Ontdekking", artist: "Artiest", releaseYear: "Release Jaar", channel: "Kanaal", viewsCount: "Weergaven", country: "Land", copyright: "Copyright",
    myLibrary: "Mijn Bibliotheek", noSavedSamples: "Nog geen samples opgeslagen.", tapToSave: "Tik op het 💾 icoon.",
    login: "Inloggen", register: "Registreren", logout: "Uitloggen", email: "E-mail", password: "Wachtwoord", username: "Gebruikersnaam",
    loginTitle: "Welkom bij SampleHunt", registerTitle: "Begin met ontdekken",
    noAccount: "Geen account?", hasAccount: "Heb je al een account?",
    cancel: "Annuleren", loading: "Laden...",
    loginSuccess: "Succesvol ingelogd", loginError: "Inloggen mislukt.", connectionError: "Verbinding met server misluk.",
    darkMode: "Donkere Modus", on: "Aan", off: "Uit", version: "Versie", totalDiscoveries: "Totale Ontdekkingen", libraryCount: "Bibliotheek",
    settings: "Instellingen", close: "Sluiten",
    trackNotFound: "Geen muziek gevonden", somethingWrong: "Er ging iets mis. Probeer opnieuw.",
    startExplore: "tik op de knop", tapSaveIcon: "Tik op het 💾 icoon.",
    bpm: "BPM", key: "TOON", vibe: "VIBE", quality: "Kwaliteit",
    excellent: "Uitstekend", veryGood: "Zeer Goed", good: "Goed",
    intro: "Intro melodie", outroBreakdown: "Outro breakdown", loopPoint: "Loop punt",
    instrumentalSection: "Instrumentale sectie", vocalCut: "Vocale snijpunt", bassLine: "Basslijn", orchestraIntro: "Orkest intro",
    loopIdeal: "Ideaal voor loop", breathRoom: "Ademruimte", separatedInstruments: "Instrumenten gescheiden",
    minimalProduction: "Minimale productie", noDynamicChange: "Geen dynamische verandering", naturalFadeOut: "Natuurlijke fade-out", melodyNotable: "Melodie opmerkelijk",
    productionNoteDefault: "Deze track heeft kwaliteiten die hem geschikt maken voor sampling. Vooral melodie en ritme secties zijn interessant.",
    genre: "Genre", region: "Regio", country: "Land", keyLabel: "Toon", tempo: "Tempo (BPM)", yearRange: "Jaar bereik",
    tracks: "tracks", language: "Taal",
  },
  sr: {
    appName: "SampleHunt",
    discover: "Откриј", library: "Библиотека", profile: "Профил",
    discoverNew: "✦ Откриј Нови Sample", filters: "Филтери", applyFilter: "Примени Филтер", clearFilter: "Очисти",
    recentDiscoveries: "Недавна Открића", noResults: "Додирните дугме да почнете",
    save: "Сачувај", comments: "Коментари", writeComment: "Напиши коментар...", addComment: "Додај", noComments: "Без коментара", views: "прегледа",
    sampleMap: "Мапа Sample-а", samplePoints: "Тачке Sample-а", productionNote: "Продукциона Белешка",
    lastDiscovery: "Последње Откриће", artist: "Уметник", releaseYear: "Година Издавања", channel: "Канал", viewsCount: "Прегледи", country: "Земља", copyright: "Copyright",
    myLibrary: "Моја Библиотека", noSavedSamples: "Још увек немате сачуваних sample-ова.", tapToSave: "Додирните 💾 икону.",
    login: "Пријава", register: "Регистрација", logout: "Одјава", email: "Е-пошта", password: "Лозинка", username: "Корисничко име",
    loginTitle: "Добродошли у SampleHunt", registerTitle: "Почните да истражујете",
    noAccount: "Немате налог?", hasAccount: "Већ имате налог?",
    cancel: "Откажи", loading: "Учитавање...",
    loginSuccess: "Успешна пријава", loginError: "Пријава неуспешна.", connectionError: "Не могу да се повежем са сервером.",
    darkMode: "Мрачан Режим", on: "Укључен", off: "Искључен", version: "Верзија", totalDiscoveries: "Укупна Открића", libraryCount: "Библиотека",
    settings: "Подешавања", close: "Затвори",
    trackNotFound: "Музика није пронађена", somethingWrong: "Нешто је пошло наопако. Покушајте поново.",
    startExplore: "додирните дугме", tapSaveIcon: "Додирните 💾 икону.",
    bpm: "BPM", key: "ТОН", vibe: "ВИБЕ", quality: "Квалитет",
    excellent: "Одлично", veryGood: "Врло Добро", good: "Добро",
    intro: "Интро мелодија", outroBreakdown: "Оутро breakdown", loopPoint: "Тачка за loop",
    instrumentalSection: "Инструментална секција", vocalCut: "Тачка сечења вокала", bassLine: "Бас линија", orchestraIntro: "Оркестарски увод",
    loopIdeal: "Идеално за loop", breathRoom: "Простор за дисање", separatedInstruments: "Инструменти одвојени",
    minimalProduction: "Минимална продукција", noDynamicChange: "Без динамичке промене", naturalFadeOut: "Природни fade-out", melodyNotable: "Мелодија упечатљива",
    productionNoteDefault: "Овај track има квалитете који га чине погодним за sampling. Нарочито су занимљиве секције мелодије и ритма.",
    genre: "Жанр", region: "Регион", country: "Земља", keyLabel: "Тон", tempo: "Темпо (BPM)", yearRange: "Опсег Године",
    tracks: "траке", language: "Језик",
  },
  ar: {
    appName: "SampleHunt",
    discover: "اكتشف", library: "المكتبة", profile: "الملف الشخصي",
    discoverNew: "✦ اكتشف Sample جديد", filters: "الفلاتر", applyFilter: "تطبيق الفلتر", clearFilter: "مسح",
    recentDiscoveries: "اكتشافات حديثة", noResults: "اضغط على الزر للبدء",
    save: "حفظ", comments: "تعليقات", writeComment: "اكتب تعليق...", addComment: "إضافة", noComments: "لا توجد تعليقات", views: "مشاهدات",
    sampleMap: "خريطة Sample", samplePoints: "نقاط Sample", productionNote: "ملاحظة الإنتاج",
    lastDiscovery: "آخر اكتشاف", artist: "الفنان", releaseYear: "سنة الإصدار", channel: "القناة", viewsCount: "المشاهدات", country: "البلد", copyright: "حقوق النشر",
    myLibrary: "مكتبتي", noSavedSamples: "لم تحفظ أي samples بعد.", tapToSave: "اضغط على أيقونة 💾.",
    login: "تسجيل الدخول", register: "إنشاء حساب", logout: "تسجيل الخروج", email: "البريد الإلكتروني", password: "كلمة المرور", username: "اسم المستخدم",
    loginTitle: "مرحباً بك في SampleHunt", registerTitle: "ابدأ الاستكشاف",
    noAccount: "ليس لديك حساب؟", hasAccount: "لديك حساب بالفعل؟",
    cancel: "إلغاء", loading: "جاري التحميل...",
    loginSuccess: "تم تسجيل الدخول بنجاح", loginError: "فشل تسجيل الدخول.", connectionError: "تعذر الاتصال بالخادم.",
    darkMode: "الوضع المظلم", on: "مفعل", off: "معطل", version: "الإصدار", totalDiscoveries: "إجمالي الاكتشافات", libraryCount: "المكتبة",
    settings: "الإعدادات", close: "إغلاق",
    trackNotFound: "لم يتم العثور على موسيقى", somethingWrong: "حدث خطأ ما. حاول مرة أخرى.",
    startExplore: "اضغط على الزر", tapSaveIcon: "اضغط على أيقونة 💾.",
    bpm: "BPM", key: "درجة", vibe: "أجواء", quality: "الجودة",
    excellent: "ممتاز", veryGood: "جيد جداً", good: "جيد",
    intro: "مقدمة موسيقية", outroBreakdown: "نهاية متكسرة", loopPoint: "نقطة التكرار",
    instrumentalSection: "جزء آلي", vocalCut: "نقطة قطع الصوت", bassLine: "خط الباس", orchestraIntro: "مقدمة الأوركسترا",
    loopIdeal: "مثالي للتكرار", breathRoom: "مساحة للتنفس", separatedInstruments: "آلات منفصلة",
    minimalProduction: "إنتاج بسيط", noDynamicChange: "لا تغيير ديناميكي", naturalFadeOut: "تلاشي طبيعي", melodyNotable: "اللحن بارز",
    productionNoteDefault: "هذا المسار له صفات تجعله مناسباً لأخذ عينات منه. especialmente أقسام اللحن والإيقاع مثيرة للاهتمام.",
    genre: "النوع", region: "المنطقة", country: "البلد", keyLabel: "الدرجة", tempo: "Tempo (BPM)", yearRange: "نطاق السنة",
    tracks: "مسارات", language: "اللغة",
  },
  zh: {
    appName: "SampleHunt",
    discover: "发现", library: "资料库", profile: "个人资料",
    discoverNew: "✦ 发现新 Sample", filters: "筛选", applyFilter: "应用筛选", clearFilter: "清除",
    recentDiscoveries: "最近发现", noResults: "点击按钮开始",
    save: "保存", comments: "评论", writeComment: "写评论...", addComment: "添加评论", noComments: "暂无评论", views: "观看次数",
    sampleMap: "Sample 地图", samplePoints: "Sample 点位", productionNote: "制作笔记",
    lastDiscovery: "最后发现", artist: "艺术家", releaseYear: "发行年份", channel: "频道", viewsCount: "观看次数", country: "国家", copyright: "版权",
    myLibrary: "我的资料库", noSavedSamples: "尚未保存任何 samples。", tapToSave: "点击卡片上的 💾 图标。",
    login: "登录", register: "注册", logout: "退出", email: "电子邮件", password: "密码", username: "用户名",
    loginTitle: "欢迎使用 SampleHunt", registerTitle: "开始探索",
    noAccount: "没有账户？", hasAccount: "已有账户？",
    cancel: "取消", loading: "加载中...",
    loginSuccess: "登录成功", loginError: "登录失败。", connectionError: "无法连接到服务器。",
    darkMode: "深色模式", on: "开启", off: "关闭", version: "版本", totalDiscoveries: "总发现数", libraryCount: "资料库",
    settings: "设置", close: "关闭",
    trackNotFound: "未找到音乐", somethingWrong: "出了点问题。请重试。",
    startExplore: "点击按钮", tapSaveIcon: "点击 💾 图标。",
    bpm: "BPM", key: "调号", vibe: "氛围", quality: "质量",
    excellent: "优秀", veryGood: "非常好", good: "良好",
    intro: "前奏旋律", outroBreakdown: "结尾 breakdown", loopPoint: "循环点",
    instrumentalSection: "器乐段落", vocalCut: "人声切点", bassLine: "贝斯线", orchestraIntro: "管弦乐前奏",
    loopIdeal: "适合循环", breathRoom: "呼吸空间", separatedInstruments: "乐器分离",
    minimalProduction: "简约制作", noDynamicChange: "无动态变化", naturalFadeOut: "自然淡出", melodyNotable: "旋律突出",
    productionNoteDefault: "这个音轨具有适合采样的特质。特别是旋律和节奏部分很有趣。",
    genre: "流派", region: "地区", country: "国家", keyLabel: "调号", tempo: "Tempo (BPM)", yearRange: "年份范围",
    tracks: "音轨", language: "语言",
  },
};

const FILTER_DEFS = [
  { key: "genre", label: "Tür / Genre", multi: true, opts: ["Blues", "Classic", "Electronic", "Folk", "Funk/Soul", "Hip Hop", "Jazz", "Latin", "Pop", "Reggae", "Rock"] },
  { key: "country", label: "Bölge", multi: true, opts: ["ABD", "Türkiye", "Brezilya", "Japonya", "Nijerya", "Küba", "Etiyopya", "Fransa", "İngiltere", "Jamaika", "Kolombiya", "Hindistan", "Gana", "Senegal", "Meksika", "Arjantin", "İspanya", "İtalya", "Almanya", "Portekiz", "Yunanistan", "Polonya", "Rusya", "Çin", "Güney Kore", "Endonezya", "Avustralya", "Yeni Zelanda", "Kanada"] },
  { key: "key", label: "Gam / Key", multi: true, opts: ["C Major", "C Minor", "D Major", "D Minor", "E Minor", "F Major", "F Minor", "G Major", "G Minor", "A Minor", "Bb Major", "Bb Minor"] },
  { key: "tempo", label: "Tempo (BPM)", multi: false, opts: ["60–80", "80–100", "100–120", "120–140", "140+"] },
  { key: "year", label: "Yıl Aralığı", multi: false, opts: ["1950–1969", "1970–1979", "1980–1989", "1990–1999", "2000–2009", "2010–Bugün"] },
];

async function fetchTrack(filters = {}, existingIds = []) {
  console.log("fetchTrack called, existingIds:", existingIds);

  try {
    const params = new URLSearchParams();

    if (filters.genre?.length > 0) {
      params.set("genre", filters.genre.join(","));
    }
    if (filters.country?.length > 0) {
      params.set("country", filters.country.join(","));
    }
    if (filters.key?.length > 0) {
      params.set("key", filters.key.join(","));
    }
    if (filters.tempo) {
      params.set("tempo", filters.tempo);
    }
    if (filters.year) {
      params.set("year", filters.year);
    }
    if (existingIds.length > 0) {
      params.set("seen", existingIds.join(","));
    }

    const url = `${API_URL}/api/tracks/random?${params.toString()}`;
    console.log("Fetching from:", url);

    const res = await fetch(url, {
      headers: { "ngrok-skip-browser-warning": "true" }
    });
    const data = await res.json();

    if (data.success && data.data) {
      console.log("Fetched track from API:", data.data);
      return data.data;
    }

    console.log("No track returned from API, trying direct search...");
    return null;
  } catch (e) {
    console.error("fetchTrack error:", e);
    return null;
  }
}

const fmtViews = n => { if (!n) return "?"; if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}B`; return `${n}`; };
const toSec = t => { if (!t) return 0; const [m, s] = t.split(":").map(Number); return m * 60 + (s || 0); };
const Q_STYLE = { "Mükemmel": { bg: "#F5EDFF", text: "#7C3AED" }, "Çok İyi": { bg: "#FDE8F5", text: "#BE185D" }, "İyi": { bg: "#FFF3E0", text: "#C07A00" } };

function countActive(f) {
  let n = 0;
  for (const { key, multi } of FILTER_DEFS) {
    const v = f[key]; if (!v) continue;
    if (multi && Array.isArray(v)) n += v.length; else if (!multi && v) n++;
  }
  return n;
}

// ── APP ICON ──────────────────────────────────────────────────────────────────
function AppIcon({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      <defs>
        <linearGradient id="bgG" x1="0" y1="0" x2="120" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9333EA" /><stop offset="45%" stopColor="#EC4899" /><stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <radialGradient id="lblG" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#FBBF24" /><stop offset="60%" stopColor="#F97316" /><stop offset="100%" stopColor="#EA580C" />
        </radialGradient>
        <radialGradient id="lnsG" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="0.18" /><stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="hdlG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EC4899" /><stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <rect width="120" height="120" rx="26" fill="url(#bgG)" />
      <g clipPath="url(#rcc)"><clipPath id="rcc"><rect width="120" height="120" rx="26" /></clipPath>
        <ellipse cx="60" cy="112" rx="68" ry="30" fill="#1a1020" opacity="0.88" />
      </g>
      <circle cx="62" cy="50" r="32" fill="#111" />
      <circle cx="62" cy="50" r="30" fill="none" stroke="#1e1e1e" strokeWidth="1.2" />
      <circle cx="62" cy="50" r="26" fill="none" stroke="#1e1e1e" strokeWidth="0.8" />
      <circle cx="62" cy="50" r="22" fill="none" stroke="#222" strokeWidth="0.8" />
      <circle cx="62" cy="50" r="18" fill="none" stroke="#222" strokeWidth="0.7" />
      <circle cx="62" cy="50" r="14" fill="#1a1a1a" />
      <circle cx="62" cy="50" r="11" fill="url(#lblG)" />
      <ellipse cx="58" cy="46" rx="4" ry="3" fill="white" opacity="0.2" />
      <circle cx="62" cy="50" r="3" fill="#111" /><circle cx="62" cy="50" r="1.5" fill="#333" />
      <circle cx="62" cy="50" r="34" fill="none" stroke="white" strokeWidth="6" opacity="0.95" />
      <circle cx="62" cy="50" r="34" fill="url(#lnsG)" />
      <line x1="36" y1="76" x2="20" y2="96" stroke="#00000040" strokeWidth="11" strokeLinecap="round" />
      <line x1="36" y1="74" x2="20" y2="94" stroke="url(#hdlG)" strokeWidth="9" strokeLinecap="round" />
      <line x1="37" y1="74" x2="22" y2="93" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" />
      <path d="M95 18 L97.5 25.5 L105 28 L97.5 30.5 L95 38 L92.5 30.5 L85 28 L92.5 25.5 Z" fill="white" opacity="0.95" />
      <path d="M107 12 L108 15 L111 16 L108 17 L107 20 L106 17 L103 16 L106 15 Z" fill="white" opacity="0.6" />
    </svg>
  );
}

// ── TAB ICONS — Apple SF Symbols style ────────────────────────────────────────
const TG_ACTIVE = "#5B6EF5";
const TG_INACTIVE = "#9CA3AF";

function IcoHome({ active }) {
  const c = active ? TG_ACTIVE : TG_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="homeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? "#818CF8" : "#D1D5DB"} />
          <stop offset="100%" stopColor={active ? "#6366F1" : "#9CA3AF"} />
        </linearGradient>
      </defs>
      <path d="M12 3.5L3 11V20.5C3 21.05 3.45 21.5 4 21.5H9V15.5H15V21.5H20C20.55 21.5 21 21.05 21 20.5V11L12 3.5Z"
        fill={active ? "url(#homeGrad)" : "none"} stroke={active ? "url(#homeGrad)" : c} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IcoLib({ active }) {
  const c = active ? TG_ACTIVE : TG_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="libGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? "#A78BFA" : "#D1D5DB"} />
          <stop offset="100%" stopColor={active ? "#8B5CF6" : "#9CA3AF"} />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="8" height="8" rx="2.5" fill={active ? "url(#libGrad)" : "none"} stroke={active ? "url(#libGrad)" : c} strokeWidth="1.4" />
      <rect x="13" y="3" width="8" height="8" rx="2.5" fill={active ? "url(#libGrad)" : "none"} stroke={active ? "url(#libGrad)" : c} strokeWidth="1.4" />
      <rect x="3" y="13" width="8" height="8" rx="2.5" fill={active ? "url(#libGrad)" : "none"} stroke={active ? "url(#libGrad)" : c} strokeWidth="1.4" />
      <rect x="13" y="13" width="8" height="8" rx="2.5" fill={active ? "url(#libGrad)" : "none"} stroke={active ? "url(#libGrad)" : c} strokeWidth="1.4" />
    </svg>
  );
}
function IcoDisc({ active }) {
  const c = active ? TG_ACTIVE : TG_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="discGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? "#F472B6" : "#D1D5DB"} />
          <stop offset="100%" stopColor={active ? "#DB2777" : "#9CA3AF"} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9.5" stroke={active ? "url(#discGrad2)" : c} strokeWidth="1.5" />
      <polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88" fill={active ? "url(#discGrad2)" : c} opacity={active ? 1 : 0.7} />
      <circle cx="12" cy="12" r="1.5" fill={active ? "white" : c} stroke={active ? "url(#discGrad2)" : c} strokeWidth="0.5" />
    </svg>
  );
}
function IcoSearch({ active }) {
  const c = active ? TG_ACTIVE : TG_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="searchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? "#60A5FA" : "#D1D5DB"} />
          <stop offset="100%" stopColor={active ? "#3B82F6" : "#9CA3AF"} />
        </linearGradient>
      </defs>
      <circle cx="11" cy="11" r="6" fill={active ? "url(#searchGrad)" : "none"} stroke={active ? "url(#searchGrad)" : c} strokeWidth="1.5" />
      <path d="M15.5 15.5L20 20" stroke={active ? "url(#searchGrad)" : c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function IcoPro({ active }) {
  const c = active ? TG_ACTIVE : TG_INACTIVE;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="proGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={active ? "#F472B6" : "#D1D5DB"} />
          <stop offset="100%" stopColor={active ? "#EC4899" : "#9CA3AF"} />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="4" fill={active ? "url(#proGrad)" : "none"} stroke={active ? "url(#proGrad)" : c} strokeWidth="1.5" />
      <path d="M5.5 20.5C5.5 17.74 8.13 15.5 12 15.5C15.87 15.5 18.5 17.74 18.5 20.5" stroke={active ? "url(#proGrad)" : c} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// ── TOGGLE SWITCH ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{
      width: "51px", height: "31px", borderRadius: "20px",
      background: on ? BRAND : "#E5E5EA",
      position: "relative", cursor: "pointer",
      transition: "background .25s ease",
      flexShrink: 0,
    }}>
      <div style={{
        position: "absolute",
        top: "3px", left: on ? "23px" : "3px",
        width: "25px", height: "25px", borderRadius: "50%",
        backgroundColor: "white",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        transition: "left .25s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </div>
  );
}

// ── WAVEFORM ──────────────────────────────────────────────────────────────────
function Waveform() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "22px" }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          flex: 1,
          borderRadius: "2px",
          background: `linear-gradient(180deg, #A855F7 0%, #EC4899 100%)`,
          opacity: 0.4 + Math.sin(i * .5) * 0.35,
          height: `${30 + Math.sin(i * .7 + 1) * 50}%`,
          transition: "height .3s ease"
        }} />
      ))}
    </div>
  );
}

// ── SKELETON ──────────────────────────────────────────────────────────────────
function SkeletonCard({ th }) {
  const sh = { background: `linear-gradient(90deg,${th.sep} 25%,${th.border} 50%,${th.sep} 75%)`, backgroundSize: "400px 100%", animation: "shimmer 1.3s infinite", borderRadius: "8px" };
  return (
    <div style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: th.card, border: `1px solid ${th.border}`, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
      <div style={{ aspectRatio: "16/9", ...sh, borderRadius: 0 }} />
      <div style={{ padding: "10px" }}>
        <div style={{ height: "13px", width: "75%", marginBottom: "7px", ...sh }} />
        <div style={{ height: "11px", width: "50%", ...sh }} />
      </div>
    </div>
  );
}

// ── SAVE BUTTON (Vibrant Apple-style animation) ───────────────────────────────
const SAVE_PARTICLES = [
  { angle: 0, dist: 2.2, w: 5, h: 5, color: "#A855F7", delay: 0 },
  { angle: 30, dist: 1.9, w: 3, h: 8, color: "#EC4899", delay: 0.03 },
  { angle: 60, dist: 2.4, w: 5, h: 5, color: "#F97316", delay: 0.01 },
  { angle: 90, dist: 2.0, w: 3, h: 9, color: "#A855F7", delay: 0.04 },
  { angle: 120, dist: 2.3, w: 6, h: 6, color: "#EC4899", delay: 0.02 },
  { angle: 150, dist: 1.8, w: 3, h: 7, color: "#F97316", delay: 0.05 },
  { angle: 180, dist: 2.2, w: 5, h: 5, color: "#9333EA", delay: 0 },
  { angle: 210, dist: 2.0, w: 3, h: 8, color: "#DB2777", delay: 0.03 },
  { angle: 240, dist: 2.5, w: 6, h: 6, color: "#EA580C", delay: 0.01 },
  { angle: 270, dist: 1.9, w: 3, h: 7, color: "#7C3AED", delay: 0.04 },
  { angle: 300, dist: 2.3, w: 5, h: 5, color: "#BE185D", delay: 0.02 },
  { angle: 330, dist: 2.0, w: 4, h: 9, color: "#C2410C", delay: 0.05 },
];
function SaveBookmarkBtn({ onSave, track, size = 20, showLabel = true, th, tr, uid = "", isSaved = false }) {
  const [phase, setPhase] = useState(isSaved ? "saved" : "idle"); // idle | burst | saved
  const handleSave = (e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (phase !== "idle") return;
    setPhase("burst");
    onSave(track);
    setTimeout(() => setPhase("saved"), 680);
  };
  const bursting = phase === "burst";
  const saved = phase !== "idle";
  const gid = `bmg${uid}`;
  const hgid = `bmh${uid}`;
  const rgid = `bmr${uid}`;
  return (
    <div onClick={handleSave} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", cursor: "pointer", position: "relative", userSelect: "none" }}>

      {/* ── Outer ripple 1 ── */}
      {bursting && (
        <svg style={{ position: "absolute", top: "50%", left: "50%", overflow: "visible", pointerEvents: "none", zIndex: 8, transform: "translate(-50%,-60%)" }} width={size} height={size} viewBox="0 0 24 24">
          <defs>
            <linearGradient id={rgid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="100%" stopColor="#F97316" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="11" fill="none" stroke={`url(#${rgid})`} strokeWidth="2"
            style={{ animation: "saveRipple1 0.65s cubic-bezier(0.2,0,0,1) forwards", transformOrigin: "12px 12px" }} />
          <circle cx="12" cy="12" r="11" fill="none" stroke={`url(#${rgid})`} strokeWidth="1"
            style={{ animation: "saveRipple2 0.75s cubic-bezier(0.2,0,0,1) 0.08s forwards", transformOrigin: "12px 12px" }} />
        </svg>
      )}

      {/* ── Halo glow behind icon ── */}
      {bursting && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: `${size * 3.2}px`, height: `${size * 3.2}px`,
          marginTop: `${-size * 1.6}px`, marginLeft: `${-size * 1.6}px`,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(168,85,247,0.55) 0%, rgba(236,72,153,0.28) 40%, transparent 70%)`,
          animation: "saveHalo 0.7s cubic-bezier(0.2,0,0,1) forwards",
          pointerEvents: "none", zIndex: 7
        }} />
      )}

      {/* ── Particles ── */}
      {bursting && SAVE_PARTICLES.map((p, i) => {
        const rad = p.angle * Math.PI / 180;
        const tx = Math.round(Math.cos(rad) * size * p.dist);
        const ty = Math.round(Math.sin(rad) * size * p.dist);
        const rot = p.angle + 90;
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: `${p.w}px`, height: `${p.h}px`,
            marginTop: `${-p.h / 2}px`, marginLeft: `${-p.w / 2}px`,
            borderRadius: `${Math.min(p.w, p.h) / 2}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 6px 1px ${p.color}99`,
            transform: `rotate(${rot}deg)`,
            animation: `saveParticle 0.6s cubic-bezier(0.22,1,0.36,1) ${p.delay}s forwards`,
            "--tx": `${tx}px`, "--ty": `${ty}px`,
            pointerEvents: "none", zIndex: 12
          }} />
        );
      })}

      {/* ── Bookmark icon ── */}
      <div style={{
        position: "relative",
        animation: bursting ? "savePop 0.6s cubic-bezier(0.34,1.72,0.64,1) forwards" : undefined,
        filter: saved ? `drop-shadow(0 0 ${size * 0.3}px rgba(168,85,247,0.7)) drop-shadow(0 0 ${size * 0.6}px rgba(236,72,153,0.4))` : "none",
        transition: "filter 0.4s ease",
      }}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" overflow="visible">
          <defs>
            <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={saved ? "#A855F7" : "#C4B5FD"} />
              <stop offset="50%" stopColor={saved ? "#EC4899" : "#E9A8C8"} />
              <stop offset="100%" stopColor={saved ? "#F97316" : "#FBD5A8"} />
            </linearGradient>
            <linearGradient id={hgid} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>
          {/* Shadow under bookmark */}
          {saved && <ellipse cx="12" cy="22" rx="6" ry="1.5" fill="rgba(168,85,247,0.25)" style={{ animation: bursting ? "saveShadow 0.6s ease forwards" : "none" }} />}
          {/* Main bookmark shape */}
          <path
            d="M5 3H19C19.55 3 20 3.45 20 4V21L12 17L4 21V4C4 3.45 4.45 3 5 3Z"
            fill={saved ? `url(#${gid})` : "none"}
            stroke={`url(#${gid})`}
            strokeWidth={saved ? "0" : "1.8"}
            strokeLinejoin="round"
            style={{ transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}
          />
          {/* Inner sheen on saved */}
          {saved && (
            <path d="M5 3H19C19.55 3 20 3.45 20 4V21L12 17L4 21V4C4 3.45 4.45 3 5 3Z" fill={`url(#${hgid})`} />
          )}
          {/* Checkmark */}
          {saved && (
            <polyline
              points="8.5,12.5 11,15 15.5,9.5"
              fill="none" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="22" strokeDashoffset="22"
              style={{ animation: bursting ? "saveCheck 0.45s cubic-bezier(0.22,1,0.36,1) 0.15s forwards" : "none", strokeDashoffset: bursting ? undefined : "0" }}
            />
          )}
        </svg>
      </div>

      {/* ── Label ── */}
      {showLabel && (
        <span style={{
          fontSize: "9px",
          fontFamily: SF,
          fontWeight: saved ? 700 : 500,
          color: saved ? "#A855F7" : th.sub,
          letterSpacing: saved ? "0.2px" : "0px",
          transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          animation: bursting ? "saveLabelPop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s forwards" : undefined,
          textShadow: saved ? "0 0 8px rgba(168,85,247,0.5)" : "none",
        }}>
          {saved ? "✦ Saved" : tr("save")}
        </span>
      )}
    </div>
  );
}

function TrackCard({ track, onSelect, onSave, index, th, tr, library = [] }) {
  const thumb = `https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`;
  const [imgError, setImgError] = useState(false);
  const isSaved = library.some(x => x.videoId === track.videoId);
  return (
    <div onClick={() => onSelect(track)} style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: th.card, boxShadow: "0 2px 14px rgba(0,0,0,0.1)", cursor: "pointer", animation: `fadeUp .4s ease ${index * .06}s forwards`, opacity: 0, border: `1px solid ${th.border}` }}>
      <div style={{ position: "relative", aspectRatio: "16/9", backgroundColor: "#1C1C1E", overflow: "hidden" }}>
        {!imgError ? (
          <img src={thumb} alt={track.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={() => setImgError(true)} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <defs>
                <linearGradient id="playGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="20" stroke="url(#playGrad)" strokeWidth="2" opacity="0.6" />
              <path d="M20 16L32 24L20 32V16Z" fill="url(#playGrad)" opacity="0.8" />
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)" }} />
        {track.duration && <div style={{ position: "absolute", bottom: "6px", right: "6px", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: "5px", padding: "2px 6px", fontSize: "10px", fontWeight: 600, color: "#FFF", fontFamily: SF }}>{track.duration}</div>}
      </div>
      <div style={{ padding: "10px 10px 8px" }}>
        <div style={{ fontSize: "13px", fontWeight: 600, color: th.text, fontFamily: SF, letterSpacing: "-0.2px", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
        <div style={{ fontSize: "11px", color: th.sub, fontFamily: SF, marginBottom: "7px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.artist}{track.year ? ` · ${track.year}` : ""}</div>
        <div style={{ marginBottom: "8px" }}><Waveform /></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <SaveBookmarkBtn onSave={onSave} track={track} size={20} showLabel={true} th={th} tr={tr} uid={`card_${track.videoId}`} isSaved={isSaved} />
          </div>
          <div style={{ fontSize: "10px", color: th.sub, fontFamily: SF }}>{fmtViews(track.viewCount)} {tr("views")}</div>
        </div>
      </div>
    </div>
  );
}



// ── TRACK DETAIL CARD (bottom of home) ───────────────────────────────────────
function TrackDetailCard({ track, th, tr }) {
  if (!track) return null;
  const icons = {
    artist: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="micGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EC4899" /><stop offset="100%" stopColor="#F97316" /></linearGradient></defs><circle cx="12" cy="10" r="5" stroke="url(#micGrad)" strokeWidth="2" /><path d="M12 15V21M8 21H16" stroke="url(#micGrad)" strokeWidth="2" strokeLinecap="round" /></svg>,
    year: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs><rect x="3" y="4" width="18" height="18" rx="3" stroke="url(#calGrad)" strokeWidth="2" /><path d="M3 9H21M8 2V6M16 2V6" stroke="url(#calGrad)" strokeWidth="2" strokeLinecap="round" /></svg>,
    channel: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="tvGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs><rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#tvGrad)" strokeWidth="2" /><path d="M8 5L12 9L16 5" stroke="url(#tvGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
    views: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#6366F1" /></linearGradient></defs><path d="M12 15C15.866 15 19 12 19 8C19 4 15.866 1 12 1C8.134 1 5 4 5 8C5 12 8.134 15 12 15Z" stroke="url(#eyeGrad)" strokeWidth="2" /><circle cx="12" cy="8" r="3" stroke="url(#eyeGrad)" strokeWidth="2" /></svg>,
    country: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#059669" /></linearGradient></defs><circle cx="12" cy="12" r="10" stroke="url(#globeGrad)" strokeWidth="2" /><path d="M2 12H22M12 2C14 5 15.5 8.5 16 12C15.5 15.5 14 19 12 22C10 19 8.5 15.5 8 12C8.5 8.5 10 5 12 2Z" stroke="url(#globeGrad)" strokeWidth="2" /></svg>,
    copyright: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="copyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#D97706" /></linearGradient></defs><circle cx="12" cy="12" r="10" stroke="url(#copyGrad)" strokeWidth="2" /><path d="M12 8V12L15 15" stroke="url(#copyGrad)" strokeWidth="2" strokeLinecap="round" /></svg>,
  };
  const rows = [
    { icon: icons.artist, label: tr("artist"), val: track.artist || "—" },
    { icon: icons.year, label: tr("releaseYear"), val: track.year || "—" },
    { icon: icons.channel, label: tr("channel"), val: track.channelName || "—" },
    { icon: icons.views, label: tr("viewsCount"), val: track.viewCount ? `${fmtViews(track.viewCount)} ${tr("views")}` : "—" },
    { icon: icons.country, label: tr("country"), val: track.country || "—" },
    { icon: icons.copyright, label: tr("copyright"), val: track.copyright || "—" },
  ];
  return (
    <div style={{ margin: "16px 0 0", borderRadius: "18px", overflow: "hidden", backgroundColor: th.card, boxShadow: `0 2px 16px rgba(0,0,0,${th === DARK ? "0.3" : "0.07"})`, border: `1px solid ${th.border}`, animation: "fadeUp .4s ease forwards" }}>
      {/* Header */}
      <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${th.sep}` }}>
        <div style={{ fontSize: "11px", fontWeight: 700, color: ACCENT, fontFamily: SF, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "4px" }}>{tr("lastDiscovery")}</div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: th.text, fontFamily: SF, letterSpacing: "-0.3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{track.title}</div>
      </div>
      {/* Rows */}
      <div>
        {rows.map(({ icon, label, val }, i) => (
          <div key={label} style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderBottom: i < rows.length - 1 ? `1px solid ${th.sep}` : "none", gap: "12px" }}>
            <span style={{ flexShrink: 0, width: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
            <div style={{ fontSize: "12px", color: th.sub, fontFamily: SF, width: "80px", flexShrink: 0 }}>{label}</div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: th.text, fontFamily: SF, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AUTH INPUT ───────────────────────────────────────────────────────────────
function AuthInput({ id, placeholder, type = "text", th }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div style={{ position: "relative", marginBottom: "12px" }}>
      <input
        id={id}
        type={isPassword ? (showPw ? "text" : "password") : type}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "14px", paddingRight: isPassword ? "48px" : "14px", borderRadius: "12px",
          border: `1.5px solid ${th.border}`,
          backgroundColor: th.bg,
          color: th.text,
          fontSize: "15px", fontFamily: SF,
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPw(p => !p)}
          style={{
            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", padding: "4px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: th.sub,
          }}
          tabIndex={-1}
        >
          {showPw ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// ── SEARCH LIST ──────────────────────────────────────────────────────────────
function SearchList({ tracks, onSelect, onSave, th }) {
  const [q, setQ] = useState("");
  const results = q.trim()
    ? tracks.filter(t =>
      t.title?.toLowerCase().includes(q.toLowerCase()) ||
      t.artist?.toLowerCase().includes(q.toLowerCase()) ||
      t.country?.toLowerCase().includes(q.toLowerCase()) ||
      t.tags?.some(tag => tag.toLowerCase().includes(q.toLowerCase()))
    )
    : tracks;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", backgroundColor: th.card, borderRadius: "14px", padding: "11px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", marginBottom: "16px" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="6" stroke={th.sub} strokeWidth="2" />
          <path d="M15.5 15.5L20 20" stroke={th.sub} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Sanatçı, şarkı, tür, ülke..." style={{ flex: 1, border: "none", outline: "none", fontSize: "15px", color: th.text, fontFamily: SF, backgroundColor: "transparent" }} />
        {q && <span onClick={() => setQ("")} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "18px", height: "18px", borderRadius: "9px", backgroundColor: th.border, cursor: "pointer" }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke={th.card} strokeWidth="1.5" strokeLinecap="round" /></svg>
        </span>}
      </div>
      {results.length === 0 ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: "0 auto 10px" }}>
            <defs>
              <linearGradient id="musicGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9CA3AF" />
                <stop offset="100%" stopColor="#6B7280" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="20" stroke="url(#musicGrad2)" strokeWidth="2" opacity="0.4" />
            <path d="M20 32V18L32 14V28" stroke="url(#musicGrad2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="18" cy="32" r="3" fill="url(#musicGrad2)" />
            <circle cx="30" cy="28" r="3" fill="url(#musicGrad2)" />
          </svg>
          <div style={{ fontSize: "14px", color: th.sub, fontFamily: SF }}>Sonuç bulunamadı.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {results.map((t, i) => (
            <div key={t.videoId + i} onClick={() => onSelect(t)} style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: th.card, borderRadius: "14px", padding: "10px 12px", cursor: "pointer", border: `1px solid ${th.border}`, animation: `fadeUp .3s ease ${i * .04}s forwards`, opacity: 0 }}>
              <img src={`https://img.youtube.com/vi/${t.videoId}/mqdefault.jpg`} alt={t.title} style={{ width: "54px", height: "38px", objectFit: "cover", borderRadius: "8px", flexShrink: 0, backgroundColor: "#111" }} onError={e => { e.target.style.backgroundColor = "#333"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: th.text, fontFamily: SF, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                <div style={{ fontSize: "12px", color: th.sub, fontFamily: SF, marginTop: "2px" }}>{t.artist}{t.year ? ` · ${t.year}` : ""}{t.country ? ` · ${t.country}` : ""}</div>
              </div>
              {t.bpm && (
                <div style={{ fontSize: "11px", fontWeight: 700, color: TG_ACTIVE, backgroundColor: th.bg === "#0D1B2A" ? "rgba(91,110,245,0.15)" : "rgba(91,110,245,0.08)", padding: "3px 8px", borderRadius: "8px", flexShrink: 0, fontFamily: SF }}>
                  {t.bpm}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PLAYER MODAL ──────────────────────────────────────────────────────────────
function PlayerModal({ track, onClose, onSave, th, tr, library = [] }) {
  const [comments, setComments] = useState([]);
  useEffect(() => { setComments([]); }, [track?.videoId]);
  if (!track) return null;
  const isSaved = library.some(x => x.videoId === track.videoId);

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s ease" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px", margin: "0 auto", backgroundColor: th.card, borderRadius: "24px 24px 0 0", maxHeight: "92vh", overflowY: "auto", animation: "slideUp .32s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}><div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: th.border }} /></div>

        {/* VIDEO PLAYER — YouTube Embed */}
        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ borderRadius: "16px", overflow: "hidden", backgroundColor: "#000", position: "relative", aspectRatio: "16/9" }}>
            <iframe
              src={`https://www.youtube.com/embed/${track.videoId}?autoplay=1&rel=0`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={track.title}
            />
          </div>
        </div>

        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "19px", fontWeight: 700, color: th.text, letterSpacing: "-0.4px", fontFamily: SF }}>{track.title}</div>
              <div style={{ fontSize: "14px", color: th.sub, fontFamily: SF, marginTop: "2px" }}>{track.artist}{track.year ? ` · ${track.year}` : ""}{track.country ? ` · ${track.country}` : ""}</div>
            </div>
            <div style={{ padding: "0 0 0 10px" }}>
              <SaveBookmarkBtn onSave={onSave} track={track} size={24} showLabel={false} th={th} tr={tr} uid={`modal_${track.videoId}`} isSaved={isSaved} />
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <textarea id="commentInput" placeholder={tr("writeComment")} style={{ width: "100%", minHeight: "80px", border: `1px solid ${th.border}`, borderRadius: "12px", padding: "12px", fontSize: "13px", fontFamily: SF, resize: "none", backgroundColor: th.bg, color: th.text, outline: "none" }} />
            <button onClick={() => { const el = document.getElementById("commentInput"); if (el?.value.trim()) { const newComment = { id: Date.now(), text: el.value.trim(), date: new Date().toISOString() }; setComments(prev => [newComment, ...prev]); el.value = ""; } }} style={{ marginTop: "8px", padding: "10px 20px", borderRadius: "12px", border: "none", background: BRAND, color: "#FFF", fontSize: "13px", fontWeight: 600, fontFamily: SF, cursor: "pointer", boxShadow: BRAND_S }}>{tr("addComment")}</button>
          </div>
          {comments.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: th.sub, fontSize: "13px" }}>{tr("noComments")}</div>}
          {comments.map(c => (
            <div key={c.id} style={{ backgroundColor: th.bg, borderRadius: "12px", padding: "12px", marginBottom: "8px" }}>
              <div style={{ fontSize: "12px", color: th.sub, marginBottom: "4px" }}>{new Date(c.date).toLocaleDateString()}</div>
              <div style={{ fontSize: "13px", color: th.text, fontFamily: SF }}>{c.text}</div>
            </div>
          ))}
        </div>
        <div style={{ height: "36px" }} />
      </div>
    </div>
  );
}

// ── FILTER SHEET ──────────────────────────────────────────────────────────────
// ── FILTER MODAL (Search + Vertical List) ────────────────────────────────────
function FilterModal({ categoryKey, categoryLabel, options, selected, onSelect, onClose, th, tr }) {
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const placeholderMap = {
    genre: tr("genre") + "...",
    country: tr("region") + "...",
    key: tr("keyLabel") + "...",
    tempo: tr("tempo") + "...",
    year: tr("yearRange") + "...",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
      zIndex: 2100, display: "flex", alignItems: "flex-end",
      animation: "fadeIn .2s ease"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: "390px", margin: "0 auto",
        backgroundColor: th.card, borderRadius: "24px 24px 0 0",
        maxHeight: "86vh", display: "flex", flexDirection: "column",
        animation: "slideUpModal .32s cubic-bezier(0.4,0,0.2,1)"
      }}>
        <div style={{ paddingTop: "12px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: th.border }} />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 16px 12px", borderBottom: `1px solid ${th.sep}`
        }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: th.text, fontFamily: SF }}>
            {categoryLabel}
          </div>
          <button onClick={onClose} style={{
            border: "none", background: "none", cursor: "pointer",
            padding: "6px", borderRadius: "8px", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M6 6L18 18M6 18L18 6" stroke={th.text} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${th.sep}`, flexShrink: 0 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            backgroundColor: th.bg, borderRadius: "12px", padding: "10px 14px"
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L16.5 16.5M19 11A8 8 0 1 1 11 3a8 8 0 0 1 8 8z"
                stroke={th.sub} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={placeholderMap[categoryKey] || categoryLabel + "..."}
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: "14px", color: th.text, fontFamily: SF,
                outline: "none"
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                border: "none", background: "none", cursor: "pointer", padding: "2px"
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6L18 18M6 18L18 6" stroke={th.sub} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", paddingBottom: "24px" }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px", color: th.sub,
              fontSize: "14px", fontFamily: SF
            }}>
              Sonuç bulunamadı
            </div>
          ) : (
            filtered.map(opt => {
              const isSelected = selected.includes(opt);
              return (
                <div
                  key={opt}
                  onClick={() => { onSelect(opt); onClose(); }}
                  style={{
                    display: "flex", alignItems: "center",
                    padding: "14px 20px", cursor: "pointer",
                    borderBottom: `1px solid ${th.sep}`,
                    backgroundColor: isSelected ? `${ACCENT}15` : "transparent",
                    transition: "background-color .15s ease"
                  }}
                >
                  <div style={{
                    flex: 1, fontSize: "15px", color: th.text, fontFamily: SF,
                    fontWeight: isSelected ? 600 : 400
                  }}>
                    {opt}
                  </div>
                  {isSelected && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13L9 17L19 7" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── FILTER SHEET ───────────────────────────────────────────────────────────────
function FilterSheet({ filters, onChange, onClose, onApply, th, tr }) {
  const [local, setLocal] = useState({ ...filters });
  const [activeModal, setActiveModal] = useState(null);
  const toggle = (key, val, multi) => {
    if (multi) { const cur = local[key] || []; setLocal(p => ({ ...p, [key]: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val] })); }
    else { setLocal(p => ({ ...p, [key]: p[key] === val ? null : val })); }
  };
  const isOn = (key, val) => { const v = local[key]; if (!v) return false; return Array.isArray(v) ? v.includes(val) : v === val; };
  const total = countActive(local);

  const handleChipClick = (key, multi) => {
    setActiveModal(key);
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 2000, display: "flex", alignItems: "flex-end", animation: "fadeIn .2s ease" }} onClick={onClose}>
        <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px", margin: "0 auto", backgroundColor: th.card, borderRadius: "24px 24px 0 0", maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "slideUp .32s cubic-bezier(0.4,0,0.2,1)" }}>
          <div style={{ flexShrink: 0, paddingTop: "12px", display: "flex", justifyContent: "center" }}><div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: th.border }} /></div>
          <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 12px" }}>
            <div style={{ fontSize: "20px", fontWeight: 700, color: th.text, fontFamily: SF, letterSpacing: "-0.4px" }}>{tr("filters")}</div>
            <button onClick={() => setLocal({})} style={{ border: "none", background: "none", fontSize: "14px", color: ACCENT, fontWeight: 600, fontFamily: SF, cursor: "pointer", padding: 0 }}>{tr("clearFilter")}</button>
          </div>
          <div style={{ height: "1px", backgroundColor: th.sep, flexShrink: 0 }} />
          <div className="filter-options-container">
            {FILTER_DEFS.map(({ key, label, multi, opts }, si) => {
              const selected = multi ? (local[key] || []) : (local[key] ? [local[key]] : []);
              return (
                <div key={key} className="filter-section">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 0 10px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: th.text, fontFamily: SF }}>{label}</div>
                    {selected.length > 0 && <div style={{ fontSize: "11px", fontWeight: 600, color: ACCENT, fontFamily: SF }}>{selected.length} seçili</div>}
                  </div>
                  <div style={{ display: "flex", gap: "10px", overflowX: "auto", scrollbarWidth: "none", paddingBottom: "6px", marginBottom: "4px" }}>
                    {opts.map(opt => {
                      const on = isOn(key, opt);
                      return (
                        <button
                          key={opt}
                          onClick={() => handleChipClick(key, multi)}
                          style={{
                            flexShrink: 0, padding: "8px 16px", borderRadius: "20px",
                            border: on ? "none" : `1.5px solid ${th.border}`,
                            background: on ? BRAND : "transparent",
                            color: on ? "#FFF" : th.text,
                            fontSize: "13px", fontWeight: on ? 700 : 400,
                            fontFamily: SF, cursor: "pointer",
                            boxShadow: on ? "0 3px 10px rgba(168,85,247,0.3)" : "none",
                            transition: "all .2s ease", whiteSpace: "nowrap"
                          }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {si < FILTER_DEFS.length - 1 && <div style={{ height: "1px", backgroundColor: th.sep, marginTop: "14px" }} />}
                </div>
              );
            })}
            <div style={{ height: "16px" }} />
          </div>
          <div style={{ flexShrink: 0, padding: "12px 20px 32px", borderTop: `1px solid ${th.sep}` }}>
            <button onClick={() => { onChange(local); onApply(local); onClose(); }} style={{ width: "100%", padding: "15px", borderRadius: "16px", border: "none", background: BRAND, color: "#FFF", fontSize: "16px", fontWeight: 700, fontFamily: SF, cursor: "pointer", boxShadow: BRAND_S, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {total > 0 ? `${total} ${tr("applyFilter")}` : tr("applyFilter")}
            </button>
          </div>
        </div>
      </div>
      {activeModal && (
        <FilterModal
          categoryKey={activeModal}
          categoryLabel={FILTER_DEFS.find(f => f.key === activeModal)?.label || activeModal}
          options={FILTER_DEFS.find(f => f.key === activeModal)?.opts || []}
          selected={local[activeModal] || []}
          onSelect={opt => {
            const def = FILTER_DEFS.find(f => f.key === activeModal);
            if (def.multi) {
              const cur = local[activeModal] || [];
              setLocal(p => ({ ...p, [activeModal]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] }));
            } else {
              setLocal(p => ({ ...p, [activeModal]: local[activeModal] === opt ? null : opt }));
            }
          }}
          onClose={() => setActiveModal(null)}
          th={th}
          tr={tr}
        />
      )}
    </>
  );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function SampleHunt() {
  const [activeTab, setActiveTab] = useState("home");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selTrack, setSelTrack] = useState(null);
  const [latestTrack, setLatest] = useState(null);
  const [error, setError] = useState(null);
  const [seenIds, setSeenIds] = useState([]);
  const [library, setLibrary] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowF] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSettings, setShowSet] = useState(false);
  const [settingsClosing, setSettingsClosing] = useState(false);
  const [language, setLanguage] = useState(() => { try { return localStorage.getItem("sh_lang") || "tr"; } catch { return "tr"; } });

  // ── AUTH STATE ──────────────────────────────────────────────────────────────
  const [authScreen, setAuthScreen] = useState(null); // null | "login" | "register"
  const [authClosing, setAuthClosing] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => { try { return localStorage.getItem("sh_token") || null; } catch { return null; } });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const th = darkMode ? DARK : LIGHT;
  const afc = countActive(filters);
  const tr = (key) => T[language]?.[key] || T.tr[key] || key;

  const doFetch = async (f = filters) => {
    console.log("doFetch called, filters:", f, "seenIds:", seenIds);
    setLoading(true); setError(null);
    try {
      const track = await fetchTrack(f, seenIds);
      console.log("Fetched track:", track);
      if (track?.videoId) {
        console.log("Setting track state...");
        setSeenIds(p => [...p, track.videoId]);
        setTracks(p => [track, ...p].slice(0, 30));
        setLatest(track);
        setSelTrack(track);
        console.log("Track state set successfully");
      } else {
        console.log("No videoId in track:", track);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      setError(tr("somethingWrong") + " (" + (e.message || "Unknown error") + ")");
    }
    finally { setLoading(false); }
  };

  const saveLib = async (t) => {
    setLibrary(p => p.find(x => x.videoId === t.videoId) ? p : [t, ...p]);
    // Save to backend if logged in
    if (authToken) {
      try {
        await api.post("/api/samples", {
          title: t.title, artist: t.artist, year: t.year ? parseInt(t.year) : null,
          bpm: t.bpm, key: t.key, mood: t.mood,
          genre: t.tags || [], country: t.country,
          source_type: "youtube",
          source_url: `https://www.youtube.com/watch?v=${t.videoId}`,
          duration: t.duration, channel_name: t.channelName,
          copyright: t.copyright,
        }, authToken);
      } catch (e) { /* silent fail */ }
    }
  };

  useEffect(() => { doFetch({}); }, []);

  useEffect(() => {
    if (authToken) {
      api.get("/api/auth/me", authToken).then(res => {
        if (res.success) setAuthUser(res.data);
        else { setAuthToken(null); localStorage.removeItem("sh_token"); }
      }).catch(() => { });
    }
  }, [authToken]);

  useEffect(() => {
    if (authClosing) {
      const t = setTimeout(() => {
        setAuthScreen(null);
        setAuthClosing(false);
        setAuthError("");
      }, 400);
      return () => clearTimeout(t);
    }
  }, [authClosing]);

  useEffect(() => {
    if (settingsClosing) {
      const t = setTimeout(() => {
        setShowSet(false);
        setSettingsClosing(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [settingsClosing]);

  const handleLogin = async (email, password) => {
    if (email === "admin" && password === "admin") {
      setAuthUser({ username: "admin", email: "admin" });
      setAuthToken("admin-token");
      localStorage.setItem("sh_token", "admin-token");
      setAuthScreen(null);
      return;
    }
    setAuthLoading(true); setAuthError("");
    try {
      const res = await api.post("/api/auth/login", { email, password });
      if (res.success) {
        setAuthToken(res.data.token);
        setAuthUser(res.data.user);
        localStorage.setItem("sh_token", res.data.token);
        setAuthScreen(null);
      } else {
        setAuthError(res.message || tr("loginError"));
      }
    } catch { setAuthError(tr("connectionError")); }
    finally { setAuthLoading(false); }
  };

  const handleRegister = async (username, email, password) => {
    setAuthLoading(true); setAuthError("");
    try {
      const res = await api.post("/api/auth/register", { username, email, password });
      if (res.success) {
        setAuthToken(res.data.token);
        setAuthUser(res.data.user);
        localStorage.setItem("sh_token", res.data.token);
        setAuthScreen(null);
      } else {
        setAuthError(res.message || tr("loginError"));
      }
    } catch { setAuthError(tr("connectionError")); }
    finally { setAuthLoading(false); }
  };

  const handleLogout = () => {
    setAuthToken(null); setAuthUser(null);
    localStorage.removeItem("sh_token");
  };

  const NAV = [
    { id: "home", label: tr("discover"), Icon: IcoHome },
    { id: "library", label: tr("library"), Icon: IcoLib },
    { id: "discoveries", label: tr("discoveries"), Icon: IcoDisc },
    { id: "profile", label: tr("profile"), Icon: IcoPro },
  ];

  return (
    <div style={{ backgroundColor: th.bg, minHeight: "100vh", maxWidth: "390px", margin: "0 auto", fontFamily: SF, overflowX: "hidden", transition: "background-color .3s ease" }}>
      <style>{`
        @keyframes fadeUp  {from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes fadeOut {from{opacity:1}to{opacity:0}}
        @keyframes slideUp {from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes slideDown {from{transform:translateY(0)}to{transform:translateY(100%)}}
        @keyframes spin    {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes shimmer {0%{background-position:-400px 0}100%{background-position:400px 0}}
        @keyframes slideRight {from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes vinylSpin  {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes savePop {
          0%   {transform:scale(1)}
          12%  {transform:scale(0.6)}
          50%  {transform:scale(1.45)}
          72%  {transform:scale(0.9)}
          88%  {transform:scale(1.08)}
          100% {transform:scale(1)}
        }
        @keyframes saveRipple1 {
          0%   {transform:scale(0.5);opacity:1;stroke-width:3}
          100% {transform:scale(3.2);opacity:0;stroke-width:0.5}
        }
        @keyframes saveRipple2 {
          0%   {transform:scale(0.5);opacity:0.7;stroke-width:2}
          100% {transform:scale(4.0);opacity:0;stroke-width:0.3}
        }
        @keyframes saveParticle {
          0%   {transform:rotate(var(--rot,0deg)) translate(0,0) scale(1);opacity:1}
          70%  {opacity:0.8}
          100% {transform:rotate(var(--rot,0deg)) translate(var(--tx),var(--ty)) scale(0);opacity:0}
        }
        @keyframes saveHalo {
          0%   {opacity:0;transform:scale(0.3)}
          35%  {opacity:1;transform:scale(1)}
          100% {opacity:0;transform:scale(1.8)}
        }
        @keyframes saveCheck {
          0%   {stroke-dashoffset:22}
          100% {stroke-dashoffset:0}
        }
        @keyframes saveShadow {
          0%   {opacity:0;transform:scaleX(0.3)}
          100% {opacity:1;transform:scaleX(1)}
        }
        @keyframes saveLabelPop {
          0%   {opacity:0;transform:scale(0.7) translateY(3px)}
          60%  {transform:scale(1.15) translateY(-1px)}
          100% {opacity:1;transform:scale(1) translateY(0)}
        }
        *{box-sizing:border-box}::-webkit-scrollbar{display:none}
      `}</style>

      <div style={{ height: "48px" }} />

      {/* ══ HOME ══════════════════════════════════════════════════════════ */}
      {activeTab === "home" && (
        <div style={{ paddingBottom: "100px" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", padding: "4px 20px 20px", gap: "14px" }}>
            <div style={{ borderRadius: "20px", boxShadow: "0 8px 24px rgba(168,85,247,0.45)", flexShrink: 0, overflow: "hidden", lineHeight: 0 }}>
              <AppIcon size={52} />
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: th.text, letterSpacing: "-0.7px", fontFamily: SF }}>{tr("appName")}</div>
          </div>

          {/* Active filter chips */}
          {afc > 0 && (
            <div style={{ display: "flex", gap: "6px", padding: "0 20px 12px", overflowX: "auto" }}>
              {FILTER_DEFS.map(({ key, multi }) => {
                const v = filters[key]; if (!v) return null;
                const items = multi && Array.isArray(v) ? v : (v ? [v] : []);
                return items.map(item => (
                  <div key={key + item} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "5px", background: BRAND, borderRadius: "20px", padding: "5px 8px 5px 12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#FFF", fontFamily: SF }}>{item}</span>
                    <span onClick={() => setFilters(p => { const nx = { ...p }; if (multi && Array.isArray(nx[key])) nx[key] = nx[key].filter(x => x !== item); else delete nx[key]; return nx; })} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.2)", cursor: "pointer" }}>
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </span>
                  </div>
                ));
              }).filter(Boolean)}
            </div>
          )}

          {/* Buttons */}
          <div style={{ padding: "0 20px 16px", display: "flex", gap: "10px" }}>
            <button onClick={() => doFetch(filters)} disabled={loading} style={{ flex: 1, padding: "15px", borderRadius: "16px", border: "none", background: loading ? "#E5E5EA" : BRAND, color: loading ? "#999" : "#FFF", fontSize: "15px", fontWeight: 700, fontFamily: SF, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", boxShadow: loading ? "none" : BRAND_S, transition: "all .2s" }}>
              {loading ? <><div style={{ width: "17px", height: "17px", border: "2.5px solid #DDDDE0", borderTopColor: "#AEAEB2", borderRadius: "50%", animation: "spin .75s linear infinite" }} />{tr("loading")}</> : "✦ " + tr("discoverNew")}
            </button>
            <button onClick={() => setShowF(true)} style={{ position: "relative", width: "52px", height: "52px", borderRadius: "16px", border: "none", backgroundColor: afc > 0 ? "#F5EDFF" : th.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: `0 2px 10px rgba(0,0,0,0.1)`, flexShrink: 0, transition: "all .18s" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="filterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={afc > 0 ? "#A855F7" : "#9CA3AF"} />
                    <stop offset="100%" stopColor={afc > 0 ? "#EC4899" : "#9CA3AF"} />
                  </linearGradient>
                </defs>
                <path d="M4 6H20M6 12H18M8 18H16" stroke="url(#filterGrad)" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="8" cy="6" r="2.5" fill="url(#filterGrad)" />
                <circle cx="12" cy="12" r="2.5" fill="url(#filterGrad)" />
                <circle cx="16" cy="18" r="2.5" fill="url(#filterGrad)" />
              </svg>
              {afc > 0 && <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#FFF", fontFamily: SF, border: `2px solid ${th.bg}` }}>{afc}</div>}
            </button>
          </div>

          {error && <div style={{ fontSize: "12px", color: "#FF3B30", textAlign: "center", marginBottom: "10px", fontFamily: SF }}>{error}</div>}

          {/* Grid */}
          <div style={{ padding: "0 20px" }}>
            <div style={{ fontSize: "17px", fontWeight: 700, color: th.text, letterSpacing: "-0.3px", marginBottom: "12px" }}>{tr("recentDiscoveries")}</div>
            {loading && tracks.length === 0
              ? <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{[0, 1, 2, 3].map(i => <SkeletonCard key={i} th={th} />)}</div>
              : tracks.length === 0
                ? <div style={{ padding: "56px 0", textAlign: "center" }}>
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ margin: "0 auto 12px" }}>
                    <defs>
                      <linearGradient id="musicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#F97316" />
                      </linearGradient>
                    </defs>
                    <circle cx="28" cy="28" r="24" fill="url(#musicGrad)" opacity="0.12" />
                    <path d="M22 38V20L38 16V34" stroke="url(#musicGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="20" cy="38" r="4" fill="url(#musicGrad)" />
                    <circle cx="36" cy="34" r="4" fill="url(#musicGrad)" />
                  </svg>
                  <div style={{ fontSize: "15px", color: th.sub, fontFamily: SF }}>{tr("noResults")}</div><div style={{ fontSize: "15px", color: ACCENT, fontWeight: 600, fontFamily: SF }}>{tr("startExplore")}</div></div>
                : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{tracks.map((t, i) => <TrackCard key={t.videoId + i} track={t} index={i} onSelect={setSelTrack} onSave={saveLib} th={th} tr={tr} library={library} />)}</div>
            }
          </div>

          {/* ── Track Detail Card ── */}
          <TrackDetailCard track={latestTrack} th={th} tr={tr} />
          <div style={{ height: "20px" }} />
        </div>
      )}

      {/* ══ LIBRARY ═══════════════════════════════════════════════════════ */}
      {activeTab === "library" && (
        <div style={{ padding: "0 20px 104px" }}>
          <div style={{ fontSize: "30px", fontWeight: 800, color: th.text, letterSpacing: "-0.6px", marginBottom: "16px", paddingTop: "4px" }}>{tr("myLibrary")}</div>
          {library.length === 0
            ? <div style={{ padding: "80px 0", textAlign: "center" }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: "0 auto 16px" }}>
                <defs>
                  <linearGradient id="folderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <path d="M6 16C6 13.79 7.79 12 10 12H26L32 18H54C56.21 18 58 19.79 58 22V48C58 50.21 56.21 52 54 52H10C7.79 52 6 50.21 6 48V16Z" fill="url(#folderGrad)" opacity="0.15" />
                <path d="M6 16C6 13.79 7.79 12 10 12H26L32 18H54C56.21 18 58 19.79 58 22V48C58 50.21 56.21 52 54 52H10C7.79 52 6 50.21 6 48V16Z" stroke="url(#folderGrad)" strokeWidth="2.5" strokeLinejoin="round" />
                <path d="M26 28H38V40H26V28Z" stroke="url(#folderGrad)" strokeWidth="2" strokeLinejoin="round" />
                <path d="M32 34V28M29 31H35" stroke="url(#folderGrad)" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: "15px", color: th.sub, fontFamily: SF }}>{tr("noSavedSamples")}</div><div style={{ fontSize: "14px", color: ACCENT, fontWeight: 600, fontFamily: SF, marginTop: "4px" }}>{tr("tapSaveIcon")}</div></div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{library.map((t, i) => <TrackCard key={t.videoId + i} track={t} index={i} onSelect={setSelTrack} onSave={saveLib} th={th} tr={tr} library={library} />)}</div>
          }
        </div>
      )}

      {/* ══ DISCOVERIES ═══════════════════════════════════════════════════════ */}
      {activeTab === "discoveries" && (
        <div style={{ padding: "0 20px 104px" }}>
          <div style={{ fontSize: "30px", fontWeight: 800, color: th.text, letterSpacing: "-0.6px", marginBottom: "16px", paddingTop: "4px" }}>{tr("discoveries")}</div>
          {tracks.length === 0
            ? <div style={{ padding: "80px 0", textAlign: "center" }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ margin: "0 auto 16px" }}>
                <defs>
                  <linearGradient id="discGradEmpty" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="32" r="24" stroke="url(#discGradEmpty)" strokeWidth="2.5" opacity="0.4" />
                <circle cx="32" cy="32" r="8" fill="url(#discGradEmpty)" opacity="0.4" />
              </svg>
              <div style={{ fontSize: "15px", color: th.sub, fontFamily: SF }}>{tr("noResults")}</div><div style={{ fontSize: "14px", color: ACCENT, fontWeight: 600, fontFamily: SF, marginTop: "4px" }}>{tr("startExplore")}</div></div>
            : <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>{tracks.map((t, i) => <TrackCard key={t.videoId + i} track={t} index={i} onSelect={setSelTrack} onSave={saveLib} th={th} tr={tr} library={library} />)}</div>
          }
        </div>
      )}

      {/* ══ AUTH MODAL ════════════════════════════════════════════════════ */}
      {authScreen && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 4000, display: "flex", alignItems: "flex-end", animation: authClosing ? "fadeOut .35s ease forwards" : "fadeIn .3s ease" }} onClick={() => setAuthClosing(true)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px", margin: "0 auto", backgroundColor: th.card, borderRadius: "24px 24px 0 0", padding: "24px 24px 36px", animation: authClosing ? "slideDown .4s cubic-bezier(0.4,0,0.2,1) forwards" : "slideUp .4s cubic-bezier(0.4,0,0.2,1) forwards" }}>
            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: th.border }} />
            </div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: th.text, fontFamily: SF, letterSpacing: "-0.5px", marginBottom: "6px" }}>
              {authScreen === "login" ? tr("login") : tr("register")}
            </div>
            <div style={{ fontSize: "14px", color: th.sub, fontFamily: SF, marginBottom: "24px" }}>
              {authScreen === "login" ? tr("loginTitle") : tr("registerTitle")}
            </div>

            {authError && (
              <div style={{ backgroundColor: "#FFF0F0", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: "#CC0000", fontFamily: SF }}>
                {authError}
              </div>
            )}

            {authScreen === "register" && (
              <AuthInput id="reg_username" placeholder={tr("username")} th={th} />
            )}
            <AuthInput id="auth_email" placeholder={tr("email")} type="email" th={th} />
            <AuthInput id="auth_password" placeholder={tr("password")} type="password" th={th} />

            <button
              onClick={() => {
                const email = document.getElementById("auth_email")?.value;
                const password = document.getElementById("auth_password")?.value;
                if (authScreen === "login") {
                  handleLogin(email, password);
                } else {
                  const username = document.getElementById("reg_username")?.value;
                  handleRegister(username, email, password);
                }
              }}
              disabled={authLoading}
              style={{ width: "100%", padding: "15px", borderRadius: "14px", border: "none", background: authLoading ? "#E5E5EA" : BRAND, color: authLoading ? "#999" : "#FFF", fontSize: "16px", fontWeight: 700, fontFamily: SF, cursor: authLoading ? "not-allowed" : "pointer", boxShadow: authLoading ? "none" : BRAND_S, marginBottom: "14px", transition: "all .2s" }}
            >
              {authLoading ? tr("loading") : authScreen === "login" ? tr("login") : tr("register")}
            </button>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: "14px", color: th.sub, fontFamily: SF }}>
                {authScreen === "login" ? tr("noAccount") : tr("hasAccount") + " "}
              </span>
              <span
                onClick={() => { setAuthError(""); setAuthScreen(authScreen === "login" ? "register" : "login"); }}
                style={{ fontSize: "14px", color: ACCENT, fontWeight: 600, fontFamily: SF, cursor: "pointer" }}
              >
                {authScreen === "login" ? tr("register") : tr("login")}
              </span>
            </div>

            <button onClick={() => setAuthClosing(true)} style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "none", background: "none", color: th.sub, fontSize: "14px", fontFamily: SF, cursor: "pointer", marginTop: "8px" }}>
              {tr("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* ══ PROFILE ═══════════════════════════════════════════════════════ */}
      {activeTab === "profile" && (
        <div style={{ padding: "0 20px 104px" }}>
          {/* Profile Header with settings button */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px", marginBottom: "20px" }}>
            <div style={{ fontSize: "30px", fontWeight: 800, color: th.text, letterSpacing: "-0.6px", fontFamily: SF }}>{tr("profile")}</div>
            <button onClick={() => setShowSet(true)} style={{
              width: "38px", height: "38px", borderRadius: "12px", border: "none",
              backgroundColor: th.card,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: `0 2px 8px rgba(0,0,0,${darkMode ? "0.3" : "0.08"})`,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={ACCENT} />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="3" fill="url(#gearGrad)" />
                <path d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93" stroke="url(#gearGrad)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Auth card */}
          {!authUser ? (
            <div style={{ backgroundColor: th.card, borderRadius: "20px", padding: "24px 20px", marginBottom: "14px", boxShadow: `0 2px 12px rgba(0,0,0,${darkMode ? "0.25" : "0.06"})` }}>
              <div style={{ fontSize: "18px", fontWeight: 700, color: th.text, fontFamily: SF, marginBottom: "6px" }}>{tr("login")}</div>
              <div style={{ fontSize: "14px", color: th.sub, fontFamily: SF, marginBottom: "16px" }}>Sample'larını kaydet ve senkronize et.</div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setAuthScreen("login")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: BRAND, color: "#FFF", fontSize: "14px", fontWeight: 700, fontFamily: SF, cursor: "pointer", boxShadow: BRAND_S }}>
                  {tr("login")}
                </button>
                <button onClick={() => setAuthScreen("register")} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: `1.5px solid ${th.border}`, background: "none", color: th.text, fontSize: "14px", fontWeight: 600, fontFamily: SF, cursor: "pointer" }}>
                  {tr("register")}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: BRAND, borderRadius: "20px", padding: "24px 20px", marginBottom: "14px", display: "flex", alignItems: "center", gap: "16px", boxShadow: BRAND_S }}>
              <div style={{ flexShrink: 0, width: "62px", height: "62px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "16px", background: "rgba(0,0,0,0.25)" }}>
                {(() => {
                  const totalXP = tracks.length * XP_PER_SAMPLE;
                  const lvl = getLevel(totalXP);
                  return <LevelIcon level={lvl} size={52} />;
                })()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "19px", fontWeight: 700, color: "#FFF", fontFamily: SF }}>@{authUser.username}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", fontFamily: SF, marginBottom: "8px" }}>{authUser.email}</div>
                {/* ── Level Progress ── */}
                {(() => {
                  const totalXP = tracks.length * XP_PER_SAMPLE;
                  const lvl = getLevel(totalXP);
                  const prog = getLevelProgress(totalXP);
                  const title = getTitle(lvl);
                  const needed = samplesToNext(totalXP);
                  return (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{
                            background: "rgba(255,255,255,0.2)", borderRadius: "6px",
                            padding: "2px 7px", fontSize: "11px", fontWeight: 800, color: "#FFF",
                          }}>
                            LVL {lvl}
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: SF }}>{title}</span>
                        </div>
                        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontFamily: SF, fontWeight: 600 }}>{totalXP} XP</span>
                      </div>
                      <div style={{ height: "5px", borderRadius: "3px", backgroundColor: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "3px",
                          background: "rgba(255,255,255,0.85)",
                          width: `${Math.max(prog * 100, 2)}%`,
                          transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </div>
                      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontFamily: SF, marginTop: "3px", fontWeight: 500 }}>
                        {lvl < MAX_LEVEL ? `${needed} sample sonraki seviye` : "Maksimum seviye"}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "10px", padding: "8px 12px", color: "#FFF", fontSize: "12px", fontFamily: SF, fontWeight: 600, cursor: "pointer", flexShrink: 0, alignSelf: "flex-start" }}>
                {tr("logout")}
              </button>
            </div>
          )}

          <div style={{ backgroundColor: th.card, borderRadius: "16px", overflow: "hidden", boxShadow: `0 2px 12px rgba(0,0,0,${darkMode ? "0.25" : "0.06"})` }}>
            {([
              [<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="discIco" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs><circle cx="12" cy="12" r="10" stroke="url(#discIco)" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="url(#discIco)" /></svg>, tr("totalDiscoveries"), `${tracks.length}`],
              [<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="libIco" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs><path d="M5 5H19V19H5V5Z" stroke="url(#libIco)" strokeWidth="2" strokeLinejoin="round" /><path d="M9 9H15V15H9V9Z" stroke="url(#libIco)" strokeWidth="2" strokeLinejoin="round" /></svg>, tr("libraryCount"), `${library.length}`],
              [<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="filtIco" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F97316" /><stop offset="100%" stopColor="#EC4899" /></linearGradient></defs><path d="M4 6H20M6 12H18M8 18H16" stroke="url(#filtIco)" strokeWidth="2.5" strokeLinecap="round" /><circle cx="8" cy="6" r="2" fill="url(#filtIco)" /><circle cx="12" cy="12" r="2" fill="url(#filtIco)" /><circle cx="16" cy="18" r="2" fill="url(#filtIco)" /></svg>, tr("filters"), `${afc}`],
              ...(authUser ? [[<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="cloudIco" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs><path d="M18 10H19C20.1 10 21 10.9 21 12C21 13.1 20.1 14 19 14H18V10Z" fill="url(#cloudIco)" /><path d="M6 10C4.9 10 4 10.9 4 12C4 13.1 4.9 14 6 14H18V18H6V10Z" fill="url(#cloudIco)" /><path d="M8 18L6 20M16 18L18 20" stroke="url(#cloudIco)" strokeWidth="2" strokeLinecap="round" /></svg>, "Sunucuda Kayıtlı", authUser.sample_count ?? "—"]] : []),
            ]).map(([icon, lbl, val], i, arr) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${th.sep}` : "none" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}><span style={{ display: "flex" }}>{icon}</span><span style={{ fontSize: "15px", color: th.text, fontFamily: SF }}>{lbl}</span></div>
                <span style={{ fontSize: "15px", fontWeight: 700, color: ACCENT, fontFamily: SF }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ FLOATING TAB BAR ════════════════════════════════════════════════ */}
      <div style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 40px)",
        maxWidth: "350px",
        backgroundColor: darkMode ? "rgba(10,22,40,0.85)" : "rgba(255,255,255,0.82)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderRadius: "28px",
        padding: "8px",
        zIndex: 100,
        display: "flex",
        gap: "6px",
        boxShadow: darkMode
          ? "0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)"
          : "0 12px 40px rgba(0,0,0,0.13), 0 0 0 1px rgba(255,255,255,0.6)",
        transition: "background-color .3s ease",
      }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: active ? 1.6 : 1,
                border: "none",
                cursor: "pointer",
                borderRadius: "20px",
                padding: "10px 0",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: active ? "7px" : "0",
                background: active ? BRAND : "transparent",
                boxShadow: active ? BRAND_S : "none",
                transition: "all .3s cubic-bezier(0.4,0,0.2,1)",
                transform: active ? "scale(1.02)" : "scale(1)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <Icon active={active} />
              {active && (
                <span style={{
                  fontSize: "13px",
                  fontFamily: SF,
                  fontWeight: 700,
                  color: "white",
                  letterSpacing: "-0.2px",
                  whiteSpace: "nowrap",
                  animation: "fadeIn .2s ease",
                }}>
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ SETTINGS PANEL ════════════════════════════════════════════════ */}
      {showSettings && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "flex-end", animation: settingsClosing ? "fadeOut .35s ease forwards" : "fadeIn .3s ease" }} onClick={() => setSettingsClosing(true)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "390px", margin: "0 auto", backgroundColor: th.card, borderRadius: "24px 24px 0 0", maxHeight: "85vh", overflowY: "auto", animation: settingsClosing ? "slideDown .4s cubic-bezier(0.4,0,0.2,1) forwards" : "slideUp .4s cubic-bezier(0.4,0,0.2,1) forwards" }}>

            {/* Handle */}
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
              <div style={{ width: "36px", height: "4px", borderRadius: "2px", backgroundColor: th.border }} />
            </div>

            {/* Settings header */}
            <div style={{ padding: "16px 20px 14px", borderBottom: `1px solid ${th.sep}` }}>
              <div style={{ fontSize: "22px", fontWeight: 700, color: th.text, fontFamily: SF, letterSpacing: "-0.4px" }}>{tr("settings")}</div>
            </div>

            {/* Dark mode row */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ backgroundColor: th.bg, borderRadius: "16px", overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: darkMode ? "#1E3A5F" : "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {darkMode ?
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FDE68A" /><stop offset="100%" stopColor="#F59E0B" /></linearGradient></defs><path d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 12 17 12 15 8C13 4 9 3 12 3Z" fill="url(#moonGrad)" /></svg> :
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FCD34D" /><stop offset="100%" stopColor="#F97316" /></linearGradient></defs><circle cx="12" cy="12" r="5" fill="url(#sunGrad)" /><path d="M12 2V5M12 19V22M22 12H19M5 12H2M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="url(#sunGrad)" strokeWidth="2" strokeLinecap="round" /></svg>
                      }
                    </div>
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: th.text, fontFamily: SF }}>{tr("darkMode")}</div>
                      <div style={{ fontSize: "12px", color: th.sub, fontFamily: SF, marginTop: "1px" }}>{darkMode ? tr("on") : tr("off")}</div>
                    </div>
                  </div>
                  <Toggle on={darkMode} onChange={v => { setDarkMode(v); }} />
                </div>
              </div>
            </div>

            {/* Language row */}
            <div style={{ padding: "0 20px 16px" }}>
              <div style={{ fontSize: "13px", fontWeight: 600, color: th.sub, fontFamily: SF, marginBottom: "10px", paddingLeft: "4px" }}>{tr("language")}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
                  { code: "en", label: "English", flag: "🇬🇧" },
                  { code: "es", label: "Español", flag: "🇪🇸" },
                  { code: "de", label: "Deutsch", flag: "🇩🇪" },
                  { code: "fr", label: "Français", flag: "🇫🇷" },
                  { code: "it", label: "Italiano", flag: "🇮🇹" },
                  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
                  { code: "sr", label: "Ср标志", flag: "🇷🇸" },
                  { code: "ar", label: "العربية", flag: "🇸🇦" },
                  { code: "zh", label: "中文", flag: "🇨🇳" },
                ].map(({ code, label, flag }) => (
                  <div key={code} onClick={() => { setLanguage(code); localStorage.setItem("sh_lang", code); }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", borderRadius: "12px", border: `1.5px solid ${language === code ? ACCENT : th.border}`, background: language === code ? `${ACCENT}15` : "transparent", cursor: "pointer", transition: "all .2s" }}>
                    <span style={{ fontSize: "18px" }}>{flag}</span>
                    <span style={{ fontSize: "13px", fontWeight: language === code ? 600 : 400, color: language === code ? ACCENT : th.text, fontFamily: SF }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* App info */}
            <div style={{ padding: "0 20px 24px" }}>
              <div style={{ backgroundColor: th.bg, borderRadius: "16px", overflow: "hidden" }}>
                {([
                  [<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="pkgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#8B5CF6" /></linearGradient></defs><path d="M12 2L4 6V12C4 16.4 7.4 20.4 12 22C16.6 20.4 20 16.4 20 12V6L12 2Z" stroke="url(#pkgGrad)" strokeWidth="2" strokeLinejoin="round" /><path d="M12 8V12M12 16H12.01" stroke="url(#pkgGrad)" strokeWidth="2" strokeLinecap="round" /></svg>, tr("version"), "1.0.0"],
                  [<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="discGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#EC4899" /><stop offset="100%" stopColor="#F97316" /></linearGradient></defs><circle cx="12" cy="12" r="10" stroke="url(#discGrad)" strokeWidth="2" /><circle cx="12" cy="12" r="3" fill="url(#discGrad)" /></svg>, tr("totalDiscoveries"), `${tracks.length}`],
                  [<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><defs><linearGradient id="libGrad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs><path d="M5 5H19V19H5V5Z" stroke="url(#libGrad2)" strokeWidth="2" strokeLinejoin="round" /><path d="M9 9H15V15H9V9Z" stroke="url(#libGrad2)" strokeWidth="2" strokeLinejoin="round" /></svg>, tr("libraryCount"), `${library.length} ${tr("tracks")}`]
                ]).map(([icon, lbl, val], i, arr) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: i < arr.length - 1 ? `1px solid ${th.sep}` : "none" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ display: "flex" }}>{icon}</span>
                      <span style={{ fontSize: "14px", color: th.text, fontFamily: SF }}>{lbl}</span>
                    </div>
                    <span style={{ fontSize: "14px", color: th.sub, fontFamily: SF }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Close button */}
            <div style={{ padding: "0 20px 32px" }}>
              <button onClick={() => setSettingsClosing(true)} style={{ width: "100%", padding: "15px", borderRadius: "16px", border: `1.5px solid ${th.border}`, background: "none", color: th.text, fontSize: "15px", fontWeight: 600, fontFamily: SF, cursor: "pointer" }}>
                {tr("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {selTrack && <PlayerModal track={selTrack} onClose={() => setSelTrack(null)} onSave={saveLib} th={th} tr={tr} library={library} />}
      {showFilters && <FilterSheet filters={filters} onChange={setFilters} onApply={f => { setTracks([]); setSeenIds([]); doFetch(f); }} onClose={() => setShowF(false)} th={th} tr={tr} />}
    </div>
  );
}
