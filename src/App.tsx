import { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "./data/copy";
import { questions } from "./data/questions";
import { scoreQuiz } from "./quiz/score";
import {
  emptyProgress,
  restoreProgress,
  STORAGE_KEY,
  type Progress,
} from "./quiz/storage";
import { ResultScreen } from "./components/ResultScreen";
function readProgress(): Progress {
  try {
    return restoreProgress(localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}
function CampusArt() {
  return (
    <div className="campus-art" aria-hidden="true">
      <span className="art-orbit" />
      <div className="art-sun">✦</div>
      <div className="art-card">
        <div className="art-card-top">
          SUFE <span>✦</span>
        </div>
        <div className="art-face">
          <i />
          <i />
          <b />
        </div>
        <div className="art-card-line" />
        <div className="art-card-line short" />
        <span className="art-card-code">J / N / F / P</span>
      </div>
      <div className="art-sticker">{copy.homeSticker}</div>
      <span className="art-star">✳</span>
      <span className="art-dot" />
    </div>
  );
}
export function App() {
  const [progress, setProgress] = useState(readProgress);
  const [storageError, setStorageError] = useState(false);
  const [choosing, setChoosing] = useState<number | null>(null);
  const choiceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const choiceLock = useRef(false);
  const title = useRef<HTMLHeadingElement>(null);
  const readyToFocus = useRef(false);
  const result = useMemo(
    () =>
      progress.answers.length === 15 && progress.cursor === 15
        ? scoreQuiz(progress.answers)
        : null,
    [progress.answers, progress.cursor],
  );
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [progress]);
  useEffect(() => () => clearTimeout(choiceTimer.current), []);
  useEffect(() => {
    if (readyToFocus.current) {
      title.current?.focus();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    readyToFocus.current = true;
  }, [progress.cursor, progress.started]);
  function select(index: number) {
    if (choiceLock.current) return;
    choiceLock.current = true;
    setChoosing(index);
    choiceTimer.current = setTimeout(() => {
      setProgress((p) => ({
        ...p,
        answers: [...p.answers.slice(0, p.cursor), index],
        cursor: p.cursor + 1,
      }));
      setChoosing(null);
      choiceLock.current = false;
    }, 150);
  }
  function restart() {
    setProgress(emptyProgress());
    setChoosing(null);
  }
  const q = questions[progress.cursor];
  return (
    <main className={`app-shell ${result ? "has-result" : ""}`}>
      <header className="site-header">
        <a
          href={import.meta.env.BASE_URL}
          aria-label={copy.backHome}
          className="brand"
        >
          <span className="brand-icon" aria-hidden="true">
            ✳
          </span>
          <span>
            SUFE<span className="brand-divider">/</span>
            <small>{copy.entertainment}</small>
          </span>
        </a>
      </header>
      {storageError && (
        <p className="storage-notice" role="status">
          {copy.storageError}
        </p>
      )}
      {!progress.started ? (
        <section className="home">
          <div className="home-text">
            <p className="section-kicker">{copy.eyebrow}</p>
            <h1 ref={title} tabIndex={-1}>
              {copy.title.slice(0, 2)}
              <br />
              {copy.title.slice(2)}
              <span className="title-dot">.</span>
            </h1>
            <p className="home-subtitle">{copy.subtitle}</p>
            <p className="home-lead">{copy.homeLead}</p>
          </div>
          <CampusArt />
          <div className="home-bottom">
            <div className="home-meta">
              {copy.homeMeta.map((item, i) => (
                <span key={item}>
                  <b>{["15", "16", "02"][i]}</b>
                  {item}
                </span>
              ))}
            </div>
            <button
              className="primary start-button"
              onClick={() => setProgress((p) => ({ ...p, started: true }))}
            >
              {copy.start}
              <span aria-hidden="true">↗</span>
            </button>
            <p className="home-note">{copy.homeFootnote}</p>
          </div>
        </section>
      ) : result ? (
        <>
          <h1 className="sr-only" tabIndex={-1} ref={title}>
            {copy.resultHeader}
          </h1>
          <ResultScreen
            answers={progress.answers}
            result={result}
            onRestart={restart}
          />
        </>
      ) : (
        <section className="quiz-screen">
          <div className="quiz-top">
            <button
              className="text-button previous"
              onClick={() =>
                setProgress((p) =>
                  p.cursor > 0
                    ? { ...p, cursor: p.cursor - 1 }
                    : { ...p, started: false },
                )
              }
              disabled={choosing !== null}
            >
              <span aria-hidden="true">←</span>
              {progress.cursor > 0 ? copy.previous : copy.backHome}
            </button>
            <span className="question-count">
              <strong>{String(progress.cursor + 1).padStart(2, "0")}</strong> /
              15
            </span>
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label={copy.progress}
            aria-valuemin={0}
            aria-valuemax={15}
            aria-valuenow={progress.cursor}
          >
            <span style={{ width: `${(progress.cursor / 15) * 100}%` }} />
          </div>
          <div className="question-content" key={progress.cursor}>
            <p className="section-kicker">
              <span className="tiny-dot" />
              {copy.dimensionNames[q.dimension]}
            </p>
            <h1 ref={title} tabIndex={-1}>
              {q.text}
            </h1>
            <p className="question-hint">{copy.questionHint}</p>
            <div className="options">
              {q.options.map((option, i) => (
                <button
                  key={i}
                  className={`option ${choosing === i ? "is-choosing" : ""}`}
                  onClick={() => select(i)}
                  disabled={choosing !== null}
                  aria-pressed={progress.answers[progress.cursor] === i}
                >
                  <span className="option-letter">{copy.optionLetters[i]}</span>
                  <span>{option.text}</span>
                  <span className="option-arrow" aria-hidden="true">
                    ↗
                  </span>
                </button>
              ))}
            </div>
          </div>
          <p className="question-footer">
            <span aria-hidden="true">✦</span> {copy.questionFooter}
          </p>
        </section>
      )}
      <footer className="site-footer">
        <span>{copy.unofficial}</span>
        <span aria-hidden="true">✦</span>
      </footer>
    </main>
  );
}
