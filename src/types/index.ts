export type RaceStatus = "waiting" | "finished";

export type Keyframe = {
  t: number;
  progress: number;
  lateralOffset: number;
  stumbling: boolean;
};

export type HorseResult = {
  slotId: number;
  finishPosition: number;
  keyframes: Keyframe[];
};

export type RaceResult = {
  durationSeconds: number;
  horses: HorseResult[];
};

export type SlotWithPosition = {
  id: number;
  raceId: string;
  lane: number;
  displayName: string;
  xHandle: string | null;
  avatarUrl: string | null;
  paymentStatus: string;
  finishPosition: number | null;
  createdAt: Date;
};

export type RaceWithSlots = {
  id: string;
  size: number;
  status: string;
  result: RaceResult | null;
  paymentId: string | null;
  paymentAlias: string | null;
  paymentCvu: string | null;
  createdAt: Date;
  finishedAt: Date | null;
  slots: SlotWithPosition[];
};

export type TaloTransaction = {
  amount?: string | number;
  currency?: string;
  payment_date?: string;
  beneficiary_name?: string;
  cuit?: string;
  cbu?: string;
  cvu?: string;
  alias?: string;
};

export type LeaderboardEntry = {
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  racesWon: number;
  racesPlayed: number;
};

export type Registration = {
  id: string;
  xHandle: string;
  avatarUrl: string;
  status: "pending" | "confirmed";
  createdAt: Date;
};
