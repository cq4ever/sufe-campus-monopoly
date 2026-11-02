import { forwardRef } from "react";
import { copy } from "../data/copy";
import { getPersonality, personalityTypes } from "../data/types";
import type { QuizResult } from "../quiz/score";
import type { ResultText } from "../lib/resultCopy";
import { Radar } from "./Radar";
interface Props {
  result: QuizResult;
  text: ResultText;
  qr: string;
}
export const ResultCard = forwardRef<HTMLElement, Props>(function ResultCard(
  { result, text, qr },
  ref,
) {
  const type = getPersonality(result.code);
  const index = String(personalityTypes.indexOf(type) + 1).padStart(2, "0");
  return (
    <article ref={ref} className="result-card" aria-label={copy.imageAlt}>
      <div className="card-topline">
        <span>{copy.eyebrow}</span>
        <span className="version-tag">
          {text.source === "ai" ? copy.ai : copy.classic}
        </span>
      </div>
      <div className="card-heading">
        <p>{copy.resultEyebrow}</p>
        <h1>{type.name}</h1>
        <div className="card-code">
          <span>{result.code}</span>
          {text.subtitle && <strong>{text.subtitle}</strong>}
        </div>
      </div>
      <div className="card-chart">
        <p>{copy.radarTitle}</p>
        <Radar values={result.radar} />
      </div>
      <div className="card-roast">
        <span>{copy.roastMark}</span>
        <p>{text.roast}</p>
      </div>
      <div className="card-tags">
        {text.tags.map((tag, i) => (
          <span key={i}>#{tag}</span>
        ))}
      </div>
      <div className="card-footer">
        <div className="card-share">
          <span>{copy.shareMark}</span>
          <p>{text.share}</p>
          <small>{copy.entertainment}</small>
        </div>
        <div className="card-qr">
          {qr && <img src={qr} alt={copy.qrAlt} width="94" height="94" />}
          <span>{copy.scan}</span>
        </div>
      </div>
      <div className="card-baseline">
        <span>
          {copy.cardIndex} {index} / 16
        </span>
        <span>✦</span>
      </div>
      {/* Future real statistics can populate this slot; deliberately hidden for MVP. */}
      <div className="statistics-slot" hidden />
    </article>
  );
});
