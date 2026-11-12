// Workshop-themed building blocks: gears, a gauge, a license plate.
// All inline SVG/CSS, so they follow the theme and cost no image requests.
import { useEffect, useState } from "react";

// SVG path of a gear with `teeth` trapezoid teeth and a center hole.
function gearPath(teeth, outer, root, hole) {
  const step = (Math.PI * 2) / teeth;
  const pts = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    // root -> rise -> top -> fall, each tooth takes one step
    pts.push([root, a], [outer, a + step * 0.2], [outer, a + step * 0.5], [root, a + step * 0.7]);
  }
  const d = pts
    .map(([r, a], i) => `${i ? "L" : "M"}${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`)
    .join(" ");
  // hole drawn the other way round, so fill-rule evenodd leaves it empty
  return `${d} Z M${hole} 0 A${hole} ${hole} 0 1 0 ${-hole} 0 A${hole} ${hole} 0 1 0 ${hole} 0 Z`;
}

export function Gear({ teeth = 12, size = 100, className = "", style }) {
  const outer = 50;
  const root = outer - Math.max(6, 60 / teeth + 3);
  return (
    <svg viewBox="-50 -50 100 100" width={size} height={size} className={className} style={style} aria-hidden="true" focusable="false">
      <path d={gearPath(teeth, outer, root, root * 0.42)} fillRule="evenodd" fill="currentColor" />
      <circle r={root * 0.62} fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
    </svg>
  );
}

// Two meshing gears turning in opposite directions; the small one turns
// faster, in proportion to the tooth counts. Decorative only.
export function GearCluster({ className = "", size = 260 }) {
  const big = size;
  const small = size * 0.55;
  return (
    <div className={`gh-gears ${className}`} aria-hidden="true">
      <Gear teeth={16} size={big} className="gh-gear gh-gear-cw" style={{ "--gh-gear-dur": "28s" }} />
      <Gear
        teeth={9}
        size={small}
        className="gh-gear gh-gear-ccw"
        style={{ "--gh-gear-dur": `${(28 * 9) / 16}s`, left: big * 0.82, top: big * 0.58 }}
      />
    </div>
  );
}

// Loading indicator: a small spinning gear.
export function GearSpinner({ size = 18, className = "" }) {
  return <Gear teeth={8} size={size} className={`gh-gear-spin ${className}`} />;
}

// A speedometer-style gauge. `value` 0..1; the needle sweeps up on mount.
export function Gauge({ value = 0, size = 72, className = "", label }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShown(Math.min(Math.max(value || 0, 0), 1)), 60);
    return () => clearTimeout(t);
  }, [value]);
  const r = 40;
  const arc = Math.PI * r; // half circle
  const angle = -90 + shown * 180;
  return (
    <svg viewBox="-50 -50 100 58" width={size} height={size * 0.58} className={`gh-gauge ${className}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : "true"}>
      <path d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`} className="gh-gauge-track" />
      <path
        d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`}
        className="gh-gauge-value"
        style={{ strokeDasharray: arc, strokeDashoffset: arc * (1 - shown) }}
      />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
        const a = Math.PI * (1 - t);
        return (
          <line
            key={t}
            x1={(r - 12) * Math.cos(a)}
            y1={-(r - 12) * Math.sin(a)}
            x2={(r - 7) * Math.cos(a)}
            y2={-(r - 7) * Math.sin(a)}
            className="gh-gauge-tick"
          />
        );
      })}
      <g className="gh-gauge-needle" style={{ transform: `rotate(${angle}deg)` }}>
        <line x1="0" y1="4" x2="0" y2={-(r - 10)} />
      </g>
      <circle r="4.5" className="gh-gauge-hub" />
    </svg>
  );
}

// A vehicle's plate number styled as a small license plate.
export function Plate({ children }) {
  if (!children) return null;
  return <span className="gh-plate">{children}</span>;
}
