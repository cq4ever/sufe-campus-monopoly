import { copy } from "../data/copy";
import type { Scores } from "../quiz/score";
const axes = ["J", "N", "F", "P", "night"] as const;
const point = (i: number, r: number) => {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return [170 + Math.cos(angle) * r, 130 + Math.sin(angle) * r];
};
const polygon = (r: number) =>
  axes.map((_, i) => point(i, r).join(",")).join(" ");
export function Radar({ values }: { values: Scores }) {
  return (
    <svg
      className="radar"
      viewBox="0 -12 340 289"
      role="img"
      aria-label={axes
        .map((d) => `${copy.radarLabels[d]} ${values[d]}`)
        .join("，")}
    >
      {/* SVG descendants need presentation attributes: html-to-image deep-clones SVG without copying their stylesheet rules. */}
      <polygon points={polygon(88)} fill="#f3f1e4" />
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <polygon
          key={r}
          points={polygon(88 * r)}
          className="radar-grid"
          fill="none"
          stroke="#d9ddcb"
          strokeWidth="1"
        />
      ))}
      {axes.map((d, i) => (
        <line
          key={d}
          x1="170"
          y1="130"
          x2={point(i, 88)[0]}
          y2={point(i, 88)[1]}
          className="radar-axis"
          stroke="#d9ddcb"
          strokeWidth="1"
        />
      ))}
      <polygon
        className="radar-value"
        points={axes
          .map((d, i) =>
            point(i, (88 * Math.max(5, values[d])) / 100).join(","),
          )
          .join(" ")}
        fill="#ed8c65"
        fillOpacity="0.35"
        stroke="#df7950"
        strokeWidth="2"
      />
      {axes.map((d, i) => {
        const [x, y] = point(i, (88 * Math.max(5, values[d])) / 100);
        const [lx, ly] = point(i, 118);
        return (
          <g key={d}>
            <circle
              cx={x}
              cy={y}
              r="3.5"
              className="radar-dot"
              fill="#df7950"
            />
            <text
              x={lx}
              y={ly - 5}
              textAnchor="middle"
              className="radar-label"
              fill="#52655e"
              fontSize="17"
            >
              {copy.radarLabels[d]}
            </text>
            <text
              x={lx}
              y={ly + 16}
              textAnchor="middle"
              className="radar-number"
              fill="#9a6c50"
              fontSize="17"
              fontWeight="700"
            >
              {values[d]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
