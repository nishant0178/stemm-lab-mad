/** Returns a random delay between 2000ms and 5000ms. */
export const getRandomDelay = (): number =>
  Math.floor(Math.random() * 3000) + 2000;

/** Returns elapsed reaction time in milliseconds. */
export const calculateReactionTime = (readyAt: number, tappedAt: number): number =>
  tappedAt - readyAt;

/** Returns true if the player took longer than 10 seconds to tap. */
export const isTooSlow = (elapsedMs: number): boolean => elapsedMs > 10_000;
