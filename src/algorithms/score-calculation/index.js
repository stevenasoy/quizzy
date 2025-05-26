/**
 * Score Calculation Module
 */

/**
 * Calculates predicted score based on question difficulty distribution
 * @param {Array} questions - Array of questions
 * @returns {number|null} Predicted score percentage
 */
export function calculatePredictedScore(questions) {
  if (!questions.length) return null;

  // Calculate difficulty distribution
  const difficultyCount = questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});

  const totalQuestions = questions.length;
  
  // Base difficulty weights
  const baseWeights = {
    easy: 0.90,    // Expect 90% correct for easy
    medium: 0.75,  // Expect 75% correct for medium
    hard: 0.60     // Expect 60% correct for hard
  };

  // Calculate base score from difficulty distribution
  const baseScore = (
    ((difficultyCount.easy || 0) * baseWeights.easy +
     (difficultyCount.medium || 0) * baseWeights.medium +
     (difficultyCount.hard || 0) * baseWeights.hard) /
    totalQuestions * 100
  );

  // Question count adjustment
  let adjustment = 0;
  if (totalQuestions <= 5) adjustment = 5;        // Fewer questions = slightly higher chance
  else if (totalQuestions >= 15) adjustment = -5; // More questions = slightly lower chance

  const finalScore = Math.min(100, Math.max(0, baseScore + adjustment));
  return Math.round(finalScore);
}

/**
 * Calculates actual quiz score
 * @param {Array} responses - Array of user responses
 * @returns {number} Score percentage
 */
export function calculateScore(responses) {
  if (!responses.length) return 0;
  const correctAnswers = responses.filter(r => r.correct).length;
  return Math.round((correctAnswers / responses.length) * 100);
}

/**
 * Calculates weighted score based on difficulty
 * @param {Object} response - User response data
 * @param {Object} weights - Weight factors
 * @returns {number} Weighted score
 */
export function calculateWeightedScore(response, weights) {
  return response.score * weights.score;
} 