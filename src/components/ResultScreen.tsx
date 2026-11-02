import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";
import { copy } from "../data/copy";
import { getPreset } from "../data/types";
import { questions } from "../data/questions";
import { requestAiResult } from "../lib/aiClient";
import type { ResultText } from "../lib/resultCopy";
import type { QuizResult } from "../quiz/score";
import { CodeLegend } from "./CodeLegend";
import { ResultCard } from "./ResultCard";
interface Props {
  answers: number[];
  result: QuizResult;
  onRestart: () => void;
}
export function ResultScreen({ answers, result, onRestart }: Props) {
  const [text, setText] = useState<ResultText>(() => ({
    ...getPreset(result.code),
    source: "classic",
  }));
  const [pending, setPending] = useState(
    import.meta.env.VITE_DISABLE_AI !== "true",
  );
  const [qr, setQr] = useState("");
  const [qrAttempt, setQrAttempt] = useState(0);
  const [qrError, setQrError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [image, setImage] = useState("");
  const card = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  const wechat = /MicroMessenger/i.test(navigator.userAgent);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    requestAiResult(
      {
        code: result.code,
        scores: result.scores,
        picks: questions.map((q, i) => q.options[answers[i]].text),
      },
      controller.signal,
    ).then((value) => {
      if (active) {
        setText(value);
        setPending(false);
      }
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, [answers, result]);
  useEffect(() => {
    let active = true;
    setQrError(false);
    const url = import.meta.env.VITE_SITE_URL || window.location.href;
    QRCode.toDataURL(url, {
      width: 256,
      margin: 3,
      errorCorrectionLevel: "M",
      color: { dark: "#203b50", light: "#ffffff" },
    })
      .then((value) => {
        if (active) setQr(value);
      })
      .catch(() => {
        if (active) setQrError(true);
      });
    return () => {
      active = false;
    };
  }, [qrAttempt]);
  useEffect(() => {
    if (image) dialog.current?.showModal();
  }, [image]);
  async function save() {
    if (!card.current || !qr || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      await document.fonts.ready;
      const node = card.current;
      await Promise.all(
        Array.from(node.querySelectorAll("img")).map((img) => img.decode()),
      );
      const png = await toPng(node, {
        width: 600,
        height: 800,
        pixelRatio: 2,
        backgroundColor: "#fffaf0",
        style: { transform: "none", margin: "0", boxShadow: "none" },
      });
      setImage(png);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }
  function close() {
    setImage("");
    saveButton.current?.focus();
  }
  return (
    <section className="result-screen">
      <div className="result-intro">
        <span className="section-kicker">{copy.resultHeader}</span>
        <p>{copy.resultHint}</p>
      </div>
      <div className="page-code-legend">
        <p>{copy.codeLegendTitle}</p>
        <CodeLegend code={result.code} />
      </div>
      <div className="card-stage">
        <ResultCard result={result} text={text} qr={qr} />
      </div>
      <div className="export-stage" aria-hidden="true">
        <ResultCard ref={card} result={result} text={text} qr={qr} />
      </div>
      <p className="ai-status" aria-live="polite">
        {pending ? copy.pending : "\u00a0"}
      </p>
      {qrError && (
        <p className="error" role="alert">
          {copy.qrError}{" "}
          <button
            className="text-button"
            onClick={() => setQrAttempt((n) => n + 1)}
          >
            {copy.retry}
          </button>
        </p>
      )}
      {saveError && (
        <p className="error" role="alert">
          {copy.saveError}
        </p>
      )}
      <div className="result-actions">
        <button
          ref={saveButton}
          className="primary"
          onClick={save}
          disabled={saving || !qr}
        >
          {saving ? copy.saving : copy.save}
          <span aria-hidden="true">↓</span>
        </button>
        <button className="secondary" onClick={onRestart} disabled={saving}>
          {copy.restart}
        </button>
      </div>
      <dialog
        ref={dialog}
        className="image-dialog"
        onClose={close}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        aria-labelledby="image-dialog-title"
      >
        <div className="dialog-heading">
          <h2 id="image-dialog-title">{copy.modalTitle}</h2>
          <button
            aria-label={copy.close}
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {image && (
          <img className="export-image" src={image} alt={copy.imageAlt} />
        )}
        <p>{copy.longPress}</p>
        {!wechat && image && (
          <a
            className="primary"
            href={image}
            download={`${copy.downloadName}-${result.code}.png`}
          >
            {copy.download}
            <span aria-hidden="true">↓</span>
          </a>
        )}
      </dialog>
    </section>
  );
}
