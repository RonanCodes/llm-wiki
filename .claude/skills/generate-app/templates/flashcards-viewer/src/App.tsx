import { useEffect, useMemo, useState } from "react";
import rawData from "./data.json";
import { Rating, State, dueIds, loadStates, rateCard, resetDeck, saveStates } from "./store";
import type { Card as FsrsCard } from "./store";
import type { Grade } from "ts-fsrs";

type DeckCard = { id: string; front: string; back: string; source: string; tags?: string[] };
type Deck = {
  title: string;
  topic: string;
  deck_id: string;
  generated_at: string;
  cards: DeckCard[];
};

const deck = rawData as Deck;
const cardIds = deck.cards.map((c) => c.id);
const cardIndex = Object.fromEntries(deck.cards.map((c) => [c.id, c]));

type View = "home" | "study" | "done";

export default function App() {
  const [states, setStates] = useState<Record<string, FsrsCard>>(() =>
    loadStates(deck.deck_id, cardIds),
  );
  const [view, setView] = useState<View>("home");
  const [queue, setQueue] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const due = useMemo(() => dueIds(cardIds, states), [states]);

  const counts = useMemo(() => {
    let fresh = 0;
    let learning = 0;
    let review = 0;
    for (const id of cardIds) {
      const s = states[id];
      if (!s || s.reps === 0) fresh++;
      else if (s.state === State.Review) review++;
      else learning++;
    }
    return { fresh, learning, review };
  }, [states]);

  function startStudy() {
    if (due.length === 0) return;
    setQueue(due);
    setIdx(0);
    setRevealed(false);
    setView("study");
  }

  function rate(r: Grade) {
    const id = queue[idx];
    const next = rateCard(states[id], r);
    const merged = { ...states, [id]: next };
    setStates(merged);
    saveStates(deck.deck_id, merged);
    if (idx + 1 >= queue.length) {
      setView("done");
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
  }

  useEffect(() => {
    if (view !== "study") return;
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) {
        e.preventDefault();
        setRevealed(true);
        return;
      }
      if (!revealed) return;
      if (e.key === "1") rate(Rating.Again);
      else if (e.key === "2") rate(Rating.Hard);
      else if (e.key === "3" || e.key === " " || e.key === "Enter") rate(Rating.Good);
      else if (e.key === "4") rate(Rating.Easy);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, revealed, idx, queue, states]);

  if (view === "study") {
    const current = cardIndex[queue[idx]];
    return (
      <div className="wrap study">
        <header>
          <button className="ghost" onClick={() => setView("home")}>
            ← back
          </button>
          <div className="progress">
            {idx + 1} / {queue.length}
          </div>
        </header>
        <article className="card">
          <div className="front">{current.front}</div>
          {revealed && (
            <>
              <hr />
              <div className="back">{current.back}</div>
              <div className="src">
                <a href={`../../../${current.source}`}>{current.source}</a>
              </div>
            </>
          )}
        </article>
        <div className="actions">
          {!revealed ? (
            <button className="primary" onClick={() => setRevealed(true)}>
              show answer <kbd>space</kbd>
            </button>
          ) : (
            <>
              <button className="rating again" onClick={() => rate(Rating.Again)}>
                again <kbd>1</kbd>
              </button>
              <button className="rating hard" onClick={() => rate(Rating.Hard)}>
                hard <kbd>2</kbd>
              </button>
              <button className="rating good" onClick={() => rate(Rating.Good)}>
                good <kbd>3</kbd>
              </button>
              <button className="rating easy" onClick={() => rate(Rating.Easy)}>
                easy <kbd>4</kbd>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="wrap done">
        <h1>Session complete</h1>
        <p>
          Reviewed {queue.length} cards. Come back later for the next batch — FSRS will schedule
          the due dates based on how well you did.
        </p>
        <button className="primary" onClick={() => setView("home")}>
          back to deck
        </button>
      </div>
    );
  }

  return (
    <div className="wrap home">
      <header>
        <h1>{deck.title}</h1>
        <div className="sub">
          topic <code>{deck.topic}</code> · generated {deck.generated_at} ·{" "}
          {deck.cards.length} cards
        </div>
      </header>

      <div className="stats">
        <div className="stat primary">
          <b>{due.length}</b>
          <span>due now</span>
        </div>
        <div className="stat">
          <b>{counts.fresh}</b>
          <span>new</span>
        </div>
        <div className="stat">
          <b>{counts.learning}</b>
          <span>learning</span>
        </div>
        <div className="stat">
          <b>{counts.review}</b>
          <span>review</span>
        </div>
      </div>

      <div className="actions">
        <button className="primary" disabled={due.length === 0} onClick={startStudy}>
          {due.length > 0 ? `study ${due.length} card${due.length === 1 ? "" : "s"}` : "no cards due"}
        </button>
        <button
          className="ghost"
          onClick={() => {
            if (!confirm("Reset all review progress for this deck?")) return;
            resetDeck(deck.deck_id);
            setStates(loadStates(deck.deck_id, cardIds));
          }}
        >
          reset progress
        </button>
      </div>

      <section className="list">
        <h2>All cards</h2>
        <ul>
          {deck.cards.map((c) => {
            const s = states[c.id];
            const status = !s || s.reps === 0 ? "new" : s.state === State.Review ? "review" : "learning";
            return (
              <li key={c.id}>
                <span className={`dot ${status}`} title={status} />
                <span className="front">{c.front}</span>
                <a className="src" href={`../../../${c.source}`} title={c.source}>
                  source
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <footer>
        Generated by <code>/generate flashcards</code> · flashcards-viewer template · FSRS via{" "}
        <code>ts-fsrs</code>
      </footer>
    </div>
  );
}
