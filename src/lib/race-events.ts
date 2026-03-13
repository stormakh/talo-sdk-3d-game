import { EventEmitter } from "events";

const globalForEvents = globalThis as unknown as {
  __raceEmitter?: EventEmitter;
};

export const raceEmitter: EventEmitter =
  globalForEvents.__raceEmitter ?? new EventEmitter();

if (!globalForEvents.__raceEmitter) {
  globalForEvents.__raceEmitter = raceEmitter;
}

raceEmitter.setMaxListeners(100);

export type RaceEventType = "player_joined" | "race_finished";

export type RaceEvent = {
  type: RaceEventType;
  raceId: string;
  payload: Record<string, unknown>;
};

export function emitRaceEvent(event: RaceEvent) {
  raceEmitter.emit(`race:${event.raceId}`, event);
}
