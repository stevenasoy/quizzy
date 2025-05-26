/**
 * Answer Formatting Module
 */

/**
 * Formats answer based on question type
 * @param {Object} question - Question object
 * @param {any} answer - Answer to format
 * @returns {string} Formatted answer
 */
export function formatAnswer(question, answer) {
  if (!answer && answer !== false) return 'Not answered';
  
  if (question.type === 'multiple-choice') {
    const optionText = question.options[answer];
    return optionText ? `${answer}) ${optionText}` : answer;
  } else if (question.type === 'true-false') {
    // Handle both string and boolean values
    const value = String(answer).toLowerCase();
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
  return answer;
}

/**
 * Gets score classification
 * @param {number} score - Score percentage
 * @returns {string} Score classification
 */
export function getScoreClass(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  return 'needs-improvement';
}

/**
 * Gets predicted score classification
 * @param {number} score - Predicted score percentage
 * @returns {string} Classification
 */
export function getPredictedScoreClass(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Gets performance classification based on actual vs predicted score
 * @param {number} actual - Actual score
 * @param {number} predicted - Predicted score
 * @returns {string} Performance classification
 */
export function getPerformanceClass(actual, predicted) {
  if (actual > predicted + 5) return 'exceeded';
  if (actual < predicted - 5) return 'below';
  return 'met';
}

/**
 * Gets performance description text
 * @param {number} actual - Actual score
 * @param {number} predicted - Predicted score
 * @returns {string} Performance description
 */
export function getPerformanceText(actual, predicted) {
  if (actual > predicted + 5) return 'Exceeded Expectations';
  if (actual < predicted - 5) return 'Below Expectations';
  return 'Met Expectations';
} 