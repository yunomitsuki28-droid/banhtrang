// Endless Daily Acceleration ("Gia tốc theo ngày") — DayManager System
// Scales game pace exponentially each Day with strict balance caps.

export interface DailyPacingConfig {
  baseSpawnTimer: number; // seconds
  basePatience: number; // seconds
  baseActionTime: number; // seconds
  basePoliceRaidChance: number; // probability per minute (0..1)
}

export interface DailyPacingState {
  currentDay: number;
  customerSpawnTimer: number; // >= 2.5s
  customerPatience: number; // >= 6.0s
  actionTimeLimit: number; // >= 3.0s
  policeRaidChancePerMin: number; // <= 0.40 (40%/min)
  patienceRatio: number; // customerPatience / basePatience
  actionTimeRatio: number; // actionTimeLimit / baseActionTime
  speedMultiplierLabel: string;
}

export const PACING_LIMITS = {
  MIN_SPAWN_TIMER: 2.5,
  MIN_PATIENCE: 6.0,
  MIN_ACTION_TIME: 3.0,
  MAX_POLICE_RAID_CHANCE: 0.4,
} as const;

export const DEFAULT_PACING_BASE: DailyPacingConfig = {
  baseSpawnTimer: 4.5,
  basePatience: 36.0,
  baseActionTime: 5.5,
  basePoliceRaidChance: 0.16, // 16% per minute on Day 1
};

export class DayManager {
  public currentDay = 1;
  public readonly base: DailyPacingConfig;
  public pacing: DailyPacingState;

  constructor(baseConfig: DailyPacingConfig = DEFAULT_PACING_BASE) {
    this.base = { ...baseConfig };
    this.pacing = this.recalculate(1);
  }

  public recalculate(day: number): DailyPacingState {
    this.currentDay = Math.max(1, Math.floor(day));
    const exponent = this.currentDay - 1;

    // 1. Customer Spawn Timer: -10% per day, hard cap >= 2.5s
    const rawSpawn = this.base.baseSpawnTimer * Math.pow(0.9, exponent);
    const customerSpawnTimer = Math.max(PACING_LIMITS.MIN_SPAWN_TIMER, rawSpawn);

    // 2. Customer Patience Bar: -10% per day, hard cap >= 6s
    const rawPatience = this.base.basePatience * Math.pow(0.9, exponent);
    const customerPatience = Math.max(PACING_LIMITS.MIN_PATIENCE, rawPatience);

    // 3. Action Time Limits (mix / cut / mental math / QTE): -5% per day, hard cap >= 3s
    const rawAction = this.base.baseActionTime * Math.pow(0.95, exponent);
    const actionTimeLimit = Math.max(PACING_LIMITS.MIN_ACTION_TIME, rawAction);

    // 4. Police Raid Frequency: +10% per day, hard cap <= 40% per minute
    const rawRaid = this.base.basePoliceRaidChance * Math.pow(1.1, exponent);
    const policeRaidChancePerMin = Math.min(PACING_LIMITS.MAX_POLICE_RAID_CHANCE, rawRaid);

    const speedPct = Math.round((this.base.basePatience / customerPatience) * 100);

    this.pacing = {
      currentDay: this.currentDay,
      customerSpawnTimer: Number(customerSpawnTimer.toFixed(2)),
      customerPatience: Number(customerPatience.toFixed(2)),
      actionTimeLimit: Number(actionTimeLimit.toFixed(2)),
      policeRaidChancePerMin: Number(policeRaidChancePerMin.toFixed(3)),
      patienceRatio: customerPatience / this.base.basePatience,
      actionTimeRatio: actionTimeLimit / this.base.baseActionTime,
      speedMultiplierLabel: `${(speedPct / 100).toFixed(2)}x`,
    };

    return this.pacing;
  }

  public advanceDay(): DailyPacingState {
    return this.recalculate(this.currentDay + 1);
  }

  public getDayFlashText(): string {
    return `Day ${this.currentDay} - Tốc độ tăng cường!`;
  }
}
