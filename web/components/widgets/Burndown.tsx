// Burndown — port of project/home.jsx `BurndownMini` (lines 391-417).
// Simple SVG sprint burndown chart: ideal line + actual line + today marker.
//
// API:
//   <Burndown />                            // uses default mock points
//   <Burndown pointsLeft={16} />            // overrides today-marker label
//
// Server-safe; no client state. Reused by:
//   - app/(app)/home (Wave 2A)              // small mini chart
//   - app/(app)/dashboards/sprint           // larger sprint dashboard chart
//
// If Wave 2C wants a different layout it can extend the props rather than fork.

export interface BurndownProps {
  pointsLeft?: number;
  height?: number;
}

export function Burndown({ pointsLeft = 16, height = 100 }: BurndownProps) {
  return (
    <svg viewBox="0 0 260 100" style={{ width: "100%", height }}>
      <defs>
        <linearGradient id="burnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4F46E5" stopOpacity="0.2" />
          <stop offset="1" stopColor="#4F46E5" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid */}
      {[20, 40, 60, 80].map((y) => (
        <line key={y} x1="20" x2="250" y1={y} y2={y} stroke="#F1F5F9" />
      ))}
      {/* ideal */}
      <line
        x1="20"
        y1="20"
        x2="250"
        y2="80"
        stroke="#CBD5E1"
        strokeDasharray="3 3"
        strokeWidth="1.2"
      />
      {/* actual */}
      <polyline
        fill="none"
        stroke="#4F46E5"
        strokeWidth="2"
        points="20,20 60,28 100,34 140,42 180,54"
      />
      <polyline
        fill="url(#burnFill)"
        stroke="none"
        points="20,20 60,28 100,34 140,42 180,54 180,80 20,80"
      />
      {/* today marker */}
      <line
        x1="180"
        y1="15"
        x2="180"
        y2="80"
        stroke="#4F46E5"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <text x="186" y="22" fontSize="9" fill="#4F46E5" fontFamily="Inter">
        Today · {pointsLeft} pts left
      </text>
      {/* axis */}
      <text x="20" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 14
      </text>
      <text x="110" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 21
      </text>
      <text x="228" y="95" fontSize="8" fill="#94A3B8" fontFamily="Inter">
        Apr 28
      </text>
    </svg>
  );
}
