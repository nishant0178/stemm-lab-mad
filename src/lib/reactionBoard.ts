/** Returns a random delay between 2000ms and 5000ms. */
export const getRandomDelay = (): number =>
  Math.floor(Math.random() * 3000) + 2000;

/** Returns elapsed reaction time in milliseconds. */
export const calculateReactionTime = (readyAt: number, tappedAt: number): number =>
  tappedAt - readyAt;

/** Returns true if the player took longer than 10 seconds to tap. */
export const isTooSlow = (elapsedMs: number): boolean => elapsedMs > 10_000;

/** Grades a reaction time. Thresholds based on human reaction time research. */
export const getReactionGrade = (reactionMs: number): 'excellent' | 'good' | 'okay' | 'slow' => {
  if (reactionMs < 200) return 'excellent';
  if (reactionMs < 300) return 'good';
  if (reactionMs < 500) return 'okay';
  return 'slow';
};

/** Returns false for physically impossible reactions (< 100ms = cheating or noise). */
export const isValidReaction = (reactionMs: number): boolean => reactionMs >= 100;
