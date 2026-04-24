import { Card, createEmptyCard, fsrs, generatorParameters, Grade, Rating, State } from "ts-fsrs";

export { Rating, State };
export type { Card };

const KEY = (deckId: string) => `flashcards-viewer:${deckId}`;

type Serialized = {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  learning_steps: number;
  reps: number;
  lapses: number;
  state: State;
  last_review: string | null;
};

type Stored = { version: 1; deck_id: string; cards: Record<string, Serialized> };

function ser(c: Card): Serialized {
  return {
    due: c.due.toISOString(),
    stability: c.stability,
    difficulty: c.difficulty,
    elapsed_days: c.elapsed_days,
    scheduled_days: c.scheduled_days,
    learning_steps: c.learning_steps,
    reps: c.reps,
    lapses: c.lapses,
    state: c.state,
    last_review: c.last_review ? c.last_review.toISOString() : null,
  };
}

function de(s: Serialized): Card {
  return {
    due: new Date(s.due),
    stability: s.stability,
    difficulty: s.difficulty,
    elapsed_days: s.elapsed_days,
    scheduled_days: s.scheduled_days,
    learning_steps: s.learning_steps ?? 0,
    reps: s.reps,
    lapses: s.lapses,
    state: s.state,
    last_review: s.last_review ? new Date(s.last_review) : undefined,
  };
}

export function loadStates(deckId: string, cardIds: string[]): Record<string, Card> {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(KEY(deckId)) : null;
  const stored: Stored = raw
    ? JSON.parse(raw)
    : { version: 1, deck_id: deckId, cards: {} };
  const out: Record<string, Card> = {};
  for (const id of cardIds) {
    out[id] = stored.cards[id] ? de(stored.cards[id]) : createEmptyCard();
  }
  return out;
}

export function saveStates(deckId: string, states: Record<string, Card>): void {
  const data: Stored = {
    version: 1,
    deck_id: deckId,
    cards: Object.fromEntries(Object.entries(states).map(([id, c]) => [id, ser(c)])),
  };
  localStorage.setItem(KEY(deckId), JSON.stringify(data));
}

export function resetDeck(deckId: string): void {
  localStorage.removeItem(KEY(deckId));
}

const scheduler = fsrs(generatorParameters());

export function rateCard(card: Card, rating: Grade, now: Date = new Date()): Card {
  const out = scheduler.repeat(card, now);
  return out[rating].card;
}

export function dueIds(
  cardIds: string[],
  states: Record<string, Card>,
  now: Date = new Date(),
): string[] {
  return cardIds.filter((id) => {
    const s = states[id];
    return !s || s.due.getTime() <= now.getTime();
  });
}
