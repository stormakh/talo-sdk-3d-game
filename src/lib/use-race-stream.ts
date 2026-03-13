"use client";

import { useEffect, useRef } from "react";
import type { RaceWithSlots, SlotWithPosition } from "@/types";

type RaceStreamCallbacks = {
  onPlayerJoined: (slot: SlotWithPosition) => void;
  onRaceFinished: (race: RaceWithSlots) => void;
};

export function useRaceStream(
  raceId: string,
  enabled: boolean,
  callbacks: RaceStreamCallbacks
) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!enabled) return;

    const es = new EventSource(`/api/races/${raceId}/stream`);

    es.addEventListener("player_joined", (e) => {
      const { slot } = JSON.parse(e.data);
      callbacksRef.current.onPlayerJoined(slot);
    });

    es.addEventListener("race_finished", (e) => {
      const race = JSON.parse(e.data);
      callbacksRef.current.onRaceFinished(race);
    });

    return () => {
      es.close();
    };
  }, [raceId, enabled]);
}
