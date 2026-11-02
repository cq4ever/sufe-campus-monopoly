import { copy } from "../data/copy";
import type { PersonalityCode } from "../data/types";
export function CodeLegend({ code }: { code: PersonalityCode }) {
  return (
    <ul className="code-legend" aria-label={copy.codeLegendTitle}>
      {[...code].map((letter) => (
        <li key={letter}>
          {letter} · {copy.codeLabels[letter as keyof typeof copy.codeLabels]}
        </li>
      ))}
    </ul>
  );
}
