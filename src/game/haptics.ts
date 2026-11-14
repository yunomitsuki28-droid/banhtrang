/**
 * Centralized HTML5 Vibration API utility for tactile mobile haptic feedback.
 * Safely degrades on iOS Safari or browsers/devices that block navigator.vibrate().
 */
function triggerVibration(pattern: number[]): void {
  try {
    if (
      typeof window !== 'undefined' &&
      window.navigator &&
      typeof window.navigator.vibrate === 'function'
    ) {
      window.navigator.vibrate(pattern);
    }
  } catch {
    // Never let blocked or unsupported vibration APIs interrupt gameplay state
  }
}

export const Haptics = {
  /** Short, crisp tap for every successful rice paper swipe/cut */
  cutRicePaper(): void {
    triggerVibration([30]);
  },

  /** Tiny, subtle tick when dropping an egg, beef jerky, or topping */
  addIngredient(): void {
    triggerVibration([15]);
  },

  /** Heavy, long thud when shaking too hard rips the plastic bag */
  bagRipped(): void {
    triggerVibration([300]);
  },

  /** Pulsing, alarming siren pattern when the Urban Guards raid */
  policeSiren(): void {
    triggerVibration([400, 200, 400, 200, 400]);
  },

  /** Double-buzz indicating wrong order failure or an angry customer */
  wrongOrder(): void {
    triggerVibration([100, 50, 100]);
  },
};
