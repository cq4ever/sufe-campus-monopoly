import React, { useState, useReducer, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { board, groupColors } from "./data/board";
import {
  reducer,
  createGame,
  assets,
  rollDice,
  rent,
  type State,
} from "./game/engine";
import { requestCard, type Card } from "./lib/cards";
import "./style.css";
import { restoreSave } from "./game/storage";
const KEY = "sufe-monopoly-v1";
const palette = ["#df785e", "#558a77", "#788cbd", "#c79d4e"];
function readSave(): State | null {
  try {
    return restoreSave(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}
function position(id: number) {
  if (id <= 5) return { gridRow: 6, gridColumn: 6 - id };
  if (id <= 10) return { gridRow: 11 - id, gridColumn: 1 };
  if (id <= 15) return { gridRow: 1, gridColumn: id - 9 };
  return { gridRow: id - 14, gridColumn: 6 };
}
const yen = (n: number) => `¥${n.toLocaleString("zh-CN")}`;
function App() {
  const [saved] = useState(readSave);
  const [game, dispatch] = useReducer(
    reducer,
    saved || createGame(["小财", "小富"], palette),
  );
  const [started, setStarted] = useState(!!saved);
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(["小财", "小富", "小盈", "小满"]);
  const [colors, setColors] = useState(() =>
    [...palette].sort(() => Math.random() - 0.5),
  );
  const [card, setCard] = useState<Card | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [rules, setRules] = useState(false);
  const [reset, setReset] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const busy = useRef(false);
  // Reducer remains pure; effects handle animation, storage and requests.
  useEffect(() => {
    if (!started) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(game));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [game, started]);
  useEffect(() => {
    if (game.phase !== "moving" || !started) return;
    const timer = setTimeout(() => dispatch({ type: "STEP" }), 280);
    return () => clearTimeout(timer);
  }, [game, started]);
  useEffect(() => {
    if (!started || !["event", "quiz"].includes(game.phase)) return;
    let active = true;
    setCard(null);
    setAnswer(null);
    requestCard(game.phase as "event" | "quiz").then((c) => {
      if (active) setCard(c);
    });
    return () => {
      active = false;
    };
  }, [game.phase, game.current, started]);
  useEffect(() => {
    busy.current = false;
  }, [game]);
  function act(action: Parameters<typeof reducer>[1]) {
    if (busy.current) return;
    busy.current = true;
    dispatch(action);
  }
  function newGame() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setStarted(false);
    setCard(null);
    setAnswer(null);
    setReset(false);
    setColors([...palette].sort(() => Math.random() - 0.5));
  }
  const p = game.players[game.current],
    tile = board[p.position];
  const isCard = started && ["event", "quiz"].includes(game.phase);
  return (
    <div className="app">
      <header>
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-mark">
            上<br />财
          </span>
          <span>
            SUFE CAMPUS
            <span className="brand-small">校园大富翁 · 一起走过上财</span>
          </span>
        </a>
        <button
          className="icon-btn"
          onClick={() => setRules(true)}
          aria-label="游戏规则"
        >
          ?
        </button>
      </header>
      <main>
        <div className="intro">
          <div>
            <div className="eyebrow">A LITTLE LUCK. A LOT OF CAMPUS.</div>
            <h1>
              上财校园<span>大富翁</span>
              <i>✦</i>
            </h1>
            <p>从国定路出发，把熟悉的校园走成你的主场。</p>
          </div>
          <span className="edition">
            CAMPUS
            <br />
            <strong>01</strong>
            <br />
            EDITION
          </span>
        </div>
        <div className="game-layout">
          <section className="map-section">
            <div className="section-top">
              <span>
                <b className="live-dot" /> 校园漫游地图{" "}
                <small>20 个地点 · 无限种可能</small>
              </span>
              <span className="round">
                ROUND{" "}
                {String(started ? Math.min(game.round, 30) : 1).padStart(
                  2,
                  "0",
                )}{" "}
                <em>/ 30</em>
              </span>
            </div>
            {started && (
              <div className="wallets">
                {game.players.map((x) => (
                  <div
                    className={`wallet ${x.id === game.current ? "active" : ""} ${x.out ? "out" : ""}`}
                    key={x.id}
                    style={{ "--player": x.color } as React.CSSProperties}
                  >
                    <span className="avatar">{x.name.slice(0, 1)}</span>
                    <span>
                      {x.name}
                      <strong>{x.out ? "已出局" : yen(x.cash)}</strong>
                    </span>
                    {x.id === game.current && !x.out && (
                      <span className="turn-dot" />
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="board">
              {board.map((t) => (
                <button
                  key={t.id}
                  style={
                    {
                      ...position(t.id),
                      "--group": t.group ? groupColors[t.group] : "#d9d3c3",
                      "--owner":
                        started && game.owners[t.id] !== undefined
                          ? game.players[game.owners[t.id]].color
                          : "transparent",
                    } as React.CSSProperties
                  }
                  className={`tile ${t.type} ${started && p.position === t.id ? "here" : ""}`}
                  onClick={() => setFocus(t.id)}
                  aria-label={`${t.name}${t.price ? `，价格${t.price}元` : ""}`}
                >
                  <span className="tile-icon">{t.icon}</span>
                  <span className="tile-name">{t.name}</span>
                  <span className="tile-price">
                    {t.price
                      ? `¥${t.price}`
                      : t.id === 0
                        ? "起点 +200"
                        : t.id === 5
                          ? "休息一回合"
                          : t.id === 15
                            ? "晨跑 +100"
                            : t.id === 10
                              ? "休息一下"
                              : t.type === "quiz"
                                ? "知识就是财富"
                                : "幸运进行时"}
                  </span>
                  <span className="tokens">
                    {started &&
                      game.players
                        .filter((x) => !x.out && x.position === t.id)
                        .map((x) => (
                          <span
                            key={x.id}
                            className="token"
                            style={{ background: x.color }}
                            title={x.name}
                          >
                            {x.id + 1}
                          </span>
                        ))}
                  </span>
                </button>
              ))}
              <div className="board-center">
                <div className="map-stamp">
                  SHANGHAI UNIVERSITY
                  <br />
                  OF FINANCE & ECONOMICS
                </div>
                <CampusArt />
                <div className="center-title">
                  青春有价，
                  <br />
                  校园无价。
                </div>
                <span className="center-note">
                  YOUR CAMPUS, YOUR NEXT MOVE.
                </span>
                <div className="map-route">
                  <span /> 国定 · 教学 · 武东 · 武川 <span />
                </div>
              </div>
            </div>
            <div className="legend">
              {Object.entries(groupColors).map(([g, c]) => (
                <span key={g}>
                  <i style={{ background: c }} />
                  {g}片区
                </span>
              ))}
              <span className="legend-tip">集齐同色，租金翻倍 ↗</span>
            </div>
          </section>
          <aside>
            {!started ? (
              <section className="panel setup">
                <div className="eyebrow">LET’S GET STARTED</div>
                <h2>同学，准备出发了吗？</h2>
                <p className="muted">
                  一部手机，和朋友轮流玩。好运从这里开始。
                </p>
                <label className="field-label">加入这趟旅程的人数</label>
                <div className="count-select">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      className={count === n ? "selected" : ""}
                      onClick={() => setCount(n)}
                    >
                      {n} 人
                      <span>
                        {n === 2
                          ? "双人对决"
                          : n === 3
                            ? "三人同行"
                            : "四人派对"}
                      </span>
                    </button>
                  ))}
                </div>
                <label className="field-label">
                  给自己起个名字 <small>颜色已随机分配</small>
                </label>
                <div className="name-fields">
                  {names.slice(0, count).map((name, i) => (
                    <label key={i}>
                      <span
                        className="avatar"
                        style={{ background: colors[i] }}
                      >
                        {i + 1}
                      </span>
                      <input
                        aria-label={`玩家${i + 1}昵称`}
                        maxLength={12}
                        value={name}
                        onChange={(e) =>
                          setNames(
                            names.map((x, j) => (i === j ? e.target.value : x)),
                          )
                        }
                      />
                      <small>¥1,500</small>
                    </label>
                  ))}
                </div>
                <div className="starting-cash">
                  <span>每人初始资金</span>
                  <strong>
                    ¥1,500 <small>/ 人</small>
                  </strong>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    dispatch({
                      type: "NEW",
                      state: createGame(names.slice(0, count), colors),
                    });
                    setStarted(true);
                  }}
                >
                  开启校园之旅 <span>↗</span>
                </button>
                <p className="save-note">◈ 自动保存进度，随时回来继续</p>
              </section>
            ) : (
              <>
                <section className="panel turn-panel">
                  <div className="eyebrow">IT’S YOUR TURN</div>
                  <div className="current">
                    <span
                      className="large-avatar"
                      style={{ background: p.color }}
                    >
                      {p.name.slice(0, 1)}
                    </span>
                    <div>
                      <h2>
                        {p.name}
                        <small>的回合</small>
                      </h2>
                      <p className="muted">
                        {p.skip ? "校医院 · 下次掷骰休息" : tile.name}
                      </p>
                    </div>
                    <span className="dice" aria-label={`骰子${game.dice}点`}>
                      {["⚄", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][game.dice]}
                    </span>
                  </div>
                  <div className="stats">
                    <div>
                      <small>可用资金</small>
                      <strong>{yen(p.cash)}</strong>
                    </div>
                    <div>
                      <small>总资产</small>
                      <strong>{yen(assets(game, p.id))}</strong>
                    </div>
                    <div>
                      <small>拥有地产</small>
                      <strong>
                        {
                          Object.values(game.owners).filter((id) => id === p.id)
                            .length
                        }
                        <em> 处</em>
                      </strong>
                    </div>
                  </div>
                  <div className="turn-message">
                    {game.phase === "ready"
                      ? p.skip
                        ? "休息也是旅程的一部分，本回合停留校医院。"
                        : "下一站，会遇见什么惊喜？"
                      : game.phase === "moving"
                        ? `正在前进… 还剩 ${game.remaining} 步`
                        : game.phase === "property"
                          ? `这块校园地产还没有主人，${yen(tile.price!)} 即可拥有。`
                          : game.phase === "over"
                            ? "校园旅程结束，来看看你的成绩！"
                            : game.phase === "event" || game.phase === "quiz"
                              ? "一张新卡片正在等你。"
                              : "这一站的故事已结束，把好运传给下一位。"}
                  </div>
                  {game.phase === "ready" ? (
                    <button
                      className="primary"
                      onClick={() =>
                        act({ type: "ROLL", value: rollDice(Math.random()) })
                      }
                    >
                      {p.skip ? "休息一回合" : "掷骰子，出发"} <span>⚄</span>
                    </button>
                  ) : game.phase === "property" ? (
                    <>
                      <button
                        className="primary"
                        disabled={p.cash < tile.price!}
                        onClick={() => act({ type: "BUY" })}
                      >
                        购买地产 · {yen(tile.price!)} <span>＋</span>
                      </button>
                      {p.cash < tile.price! && (
                        <p className="muted">资金不足，可以选择路过。</p>
                      )}
                      <button
                        className="secondary"
                        onClick={() => act({ type: "END" })}
                      >
                        暂时路过，下一位 →
                      </button>
                    </>
                  ) : (
                    <button
                      className="primary"
                      disabled={game.phase !== "done"}
                      onClick={() => act({ type: "END" })}
                    >
                      {game.phase === "moving"
                        ? "校园漫步中…"
                        : game.phase === "done"
                          ? "结束回合，下一位 →"
                          : "等待卡片结算…"}
                    </button>
                  )}
                  <p className="save-note">
                    {storageError
                      ? "当前浏览器无法存档，请勿关闭页面"
                      : "◈ 进度已自动保存在这台设备"}
                  </p>
                </section>
                <section className="panel journal">
                  <div className="section-top">
                    <b>旅途手记</b>
                    <small>CAMPUS MOMENTS</small>
                  </div>
                  {game.log.slice(0, 5).map((l, i) => (
                    <div className="log" key={`${i}-${l}`}>
                      <span>{i === 0 ? "●" : "○"}</span>
                      <p>{l}</p>
                    </div>
                  ))}
                </section>
                <button className="text-btn" onClick={() => setReset(true)}>
                  重新开始一局 ↗
                </button>
              </>
            )}
            <div className="tip">
              <span>✧</span>
              <p>
                <b>一点点策略，一大把好运。</b>
                <br />
                收集同色地产让租金翻倍，财经知识也能变成财富。
              </p>
            </div>
          </aside>
        </div>
        <footer>
          <span>SUFE CAMPUS MONOPOLY</span>
          <span>
            把校园日常，玩成独家回忆。 <i>✦</i>
          </span>
          <small>非官方校园主题游戏 · 仅供娱乐</small>
        </footer>
      </main>
      {rules && (
        <Modal title="你的校园漫游指南" close={() => setRules(false)}>
          <p>
            2–4 名玩家轮流掷一颗六面骰。每人初始 ¥1500，经过或停在校门领取
            ¥200。
          </p>
          <p>
            无主地产可以购买，路过他人的地产支付价格 20% 的租金。同片区集齐 3
            处，租金翻倍。
          </p>
          <p>
            校园事件带来 -¥200 至 +¥200；财经小题答对 +¥150，答错
            -¥50。校医院停一回合，武东田径场奖励 ¥100。
          </p>
          <p>
            现金小于 0
            立即出局，地产回归无主（无抵押或出售机制）。只剩一人或现金先达 ¥5000
            即结束；30 轮后按现金加地产原价排名，允许并列。
          </p>
          <p>AI 不可用时自动抽取本地题库；游戏不涉及真实金钱。</p>
          <button className="primary" onClick={() => setRules(false)}>
            知道了，出发！
          </button>
        </Modal>
      )}
      {focus !== null && (
        <Modal title={board[focus].name} close={() => setFocus(null)}>
          <p>
            {board[focus].group
              ? `${board[focus].group}片区 · ${yen(board[focus].price!)} · 基础租金 ${yen(board[focus].price! * 0.2)}`
              : focus === 0
                ? "经过或停留，领取 ¥200。"
                : focus === 5
                  ? "下回合休息一次。"
                  : focus === 15
                    ? "停留可获得晨跑奖励 ¥100。"
                    : focus === 10
                      ? "稍事休息，不发生额外事件。"
                      : "停留后抽取一张校园卡片。"}
          </p>
          <p>
            {started && game.owners[focus] !== undefined
              ? `所有者：${game.players[game.owners[focus]].name} · 当前租金 ${yen(rent(game, focus))}`
              : board[focus].type === "property"
                ? "当前无主，停在这里即可购买。"
                : ""}
          </p>
        </Modal>
      )}
      {isCard && (
        <Modal
          title={
            card
              ? card.kind === "event"
                ? card.data.title
                : "财经知识小挑战"
              : "校园来信…"
          }
        >
          <span className="source-tag">{card?.source || "正在抽取卡片"}</span>
          {!card ? (
            <p className="loading">✦ 正在准备你的校园故事…</p>
          ) : card.kind === "event" ? (
            <>
              <p className="card-text">{card.data.text}</p>
              <div
                className={`money-result ${card.data.money < 0 ? "negative" : ""}`}
              >
                {card.data.money >= 0 ? "+" : "−"}
                {yen(Math.abs(card.data.money))}
              </div>
              <button
                className="primary"
                onClick={() => {
                  act({ type: "RESOLVE", money: card.data.money });
                  setCard(null);
                }}
              >
                收下这段经历 →
              </button>
            </>
          ) : (
            <>
              <h3>{card.data.question}</h3>
              <div className="options">
                {card.data.options.map((o, i) => (
                  <button
                    key={i}
                    disabled={answer !== null}
                    className={
                      answer !== null
                        ? i === card.data.answer
                          ? "correct"
                          : i === answer
                            ? "wrong"
                            : ""
                        : ""
                    }
                    onClick={() => setAnswer(i)}
                  >
                    <span>{"ABCD"[i]}</span>
                    {o}
                  </button>
                ))}
              </div>
              {answer !== null && (
                <>
                  <p className="explain">
                    <b>
                      {answer === card.data.answer
                        ? "回答正确 · +¥150"
                        : "再学一点 · −¥50"}
                    </b>
                    <br />
                    {card.data.explain}
                  </p>
                  <button
                    className="primary"
                    onClick={() => {
                      act({
                        type: "RESOLVE",
                        money: answer === card.data.answer ? 150 : -50,
                      });
                      setCard(null);
                    }}
                  >
                    完成结算 →
                  </button>
                </>
              )}
            </>
          )}
        </Modal>
      )}
      {started && game.phase === "over" && (
        <Modal title="这一程，收获满满。">
          <div className="eyebrow">CAMPUS HALL OF FAME</div>
          <p>
            恭喜 {game.winners.map((id) => game.players[id].name).join("、")}{" "}
            赢得本局！
          </p>
          <div className="rankings">
            {[...game.players]
              .sort(
                (a, b) =>
                  Number(a.out) - Number(b.out) ||
                  assets(game, b.id) - assets(game, a.id),
              )
              .map((x, i) => (
                <div key={x.id}>
                  <span className="rank">{i + 1}</span>
                  <span className="avatar" style={{ background: x.color }}>
                    {x.name[0]}
                  </span>
                  <span>
                    <b>{x.name}</b>
                    <small>
                      {x.out
                        ? "已出局"
                        : `现金 ${yen(x.cash)} · 地产 ${yen(assets(game, x.id) - x.cash)}`}
                    </small>
                  </span>
                  <strong>{yen(assets(game, x.id))}</strong>
                </div>
              ))}
          </div>
          <button className="primary" onClick={newGame}>
            再来一局 ↗
          </button>
        </Modal>
      )}
      {reset && (
        <Modal title="重新开启旅程？" close={() => setReset(false)}>
          <p>这会清除当前存档，重新选择玩家。</p>
          <button className="primary" onClick={newGame}>
            重新开始
          </button>
          <button className="secondary" onClick={() => setReset(false)}>
            继续这局
          </button>
        </Modal>
      )}
    </div>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close?.();
      if (e.key === "Tab") {
        const els = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input",
        );
        if (!els?.length) return;
        const first = els[0],
          last = els[els.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div className="overlay">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        {close && (
          <button className="modal-close" aria-label="关闭" onClick={close}>
            ×
          </button>
        )}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}
function CampusArt() {
  return (
    <svg
      className="campus-art"
      viewBox="0 0 360 180"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="180" cy="159" rx="140" ry="12" fill="#dfE5d7" />
      <path
        d="M35 153H325M67 153V87H294V153"
        stroke="#718b78"
        strokeWidth="2"
      />
      <path
        d="M63 88L180 43L300 88H63Z"
        fill="#b7c6b0"
        stroke="#718b78"
        strokeWidth="2"
      />
      <path d="M113 73L180 28L247 73" stroke="#718b78" strokeWidth="2" />
      <path
        d="M153 153V91H209V153"
        fill="#e7e9da"
        stroke="#718b78"
        strokeWidth="2"
      />
      <path d="M164 153V121Q180 101 197 121V153" fill="#819982" />
      <path
        d="M180 28V8M180 8L204 14L180 20"
        stroke="#718b78"
        strokeWidth="2"
      />
      <g fill="#8da18a">
        {[79, 103, 127, 222, 246, 270].map((x) => (
          <React.Fragment key={x}>
            <rect x={x} y="99" width="12" height="18" rx="1" />
            <rect x={x} y="128" width="12" height="18" rx="1" />
          </React.Fragment>
        ))}
      </g>
      <circle cx="180" cy="76" r="9" fill="#f5f3e9" stroke="#718b78" />
      <path d="M180 70V77H185" stroke="#718b78" />
      <path d="M43 153V120M318 153V116" stroke="#718b78" strokeWidth="3" />
      <path
        d="M43 102C21 112 26 137 43 134C60 140 66 111 43 102ZM318 96C296 109 301 132 318 130C341 136 340 107 318 96Z"
        fill="#b7c6b0"
      />
      <path
        d="M126 160L111 175M232 160L246 175"
        stroke="#c4cbb9"
        strokeWidth="2"
      />
    </svg>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
