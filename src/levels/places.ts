// The five places of the kitchen, in run order.
const PLACES = ["counter", "sink", "stove", "fridge", "pantry"] as const;
export type Place = (typeof PLACES)[number];

// "2-3" is in place 2: the sink.
export function placeNumber(levelId: string): number {
  return Number.parseInt(levelId, 10);
}

export function placeOf(levelId: string): Place {
  const place = PLACES[placeNumber(levelId) - 1];
  if (!place) throw new Error(`Level ${levelId} is in no place`);
  return place;
}
