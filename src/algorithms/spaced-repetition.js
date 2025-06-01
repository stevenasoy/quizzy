/**
 * Spaced Repetition System (SRS) implementation based on SuperMemo 2 algorithm
 */

// Constants for the spaced repetition algorithm
const INITIAL_INTERVAL = 1; // 1 day
const INITIAL_EASE = 2.5;
const MINIMUM_EASE = 1.3;
const EASE_BONUS = 0.15;
const EASE_PENALTY = 0.2;

/**
 * Calculate the next review date and update spaced repetition data
 * @param {Object} question - The question object containing spaced repetition data
 * @param {number} performance - Performance rating (0-5, where 5 is perfect)
 * @returns {Object} Updated spaced repetition data
 */
export function updateSpacedRepetition(question, performance) {
  let spacedRepetition = question.spacedRepetition || {
    repetitions: 0,
    ease: INITIAL_EASE,
    interval: INITIAL_INTERVAL,
    nextReviewDate: null,
    lastReviewDate: null
  };

  // Convert performance to a 0-1 scale
  const normalizedPerformance = performance / 5;

  // Update ease factor based on performance
  if (normalizedPerformance >= 0.6) {
    spacedRepetition.ease += EASE_BONUS;
  } else {
    spacedRepetition.ease -= EASE_PENALTY;
  }

  // Ensure ease doesn't go below minimum
  spacedRepetition.ease = Math.max(spacedRepetition.ease, MINIMUM_EASE);

  // Calculate new interval
  if (normalizedPerformance < 0.6) {
    // Reset progress if performance is poor
    spacedRepetition.repetitions = 0;
    spacedRepetition.interval = INITIAL_INTERVAL;
  } else {
    spacedRepetition.repetitions++;
    
    if (spacedRepetition.repetitions === 1) {
      spacedRepetition.interval = INITIAL_INTERVAL;
    } else if (spacedRepetition.repetitions === 2) {
      spacedRepetition.interval = 6; // 6 days
    } else {
      spacedRepetition.interval = Math.round(spacedRepetition.interval * spacedRepetition.ease);
    }
  }

  // Update review dates
  spacedRepetition.lastReviewDate = new Date().toISOString();
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + spacedRepetition.interval);
  spacedRepetition.nextReviewDate = nextDate.toISOString();

  return spacedRepetition;
}

/**
 * Get questions that are due for review
 * @param {Array} questions - Array of question objects
 * @returns {Array} Array of questions that are due for review
 */
export function getDueQuestions(questions) {
  const now = new Date();
  return questions.filter(question => {
    if (!question.spacedRepetition?.nextReviewDate) {
      return true; // New questions are always due
    }
    const nextReviewDate = new Date(question.spacedRepetition.nextReviewDate);
    return nextReviewDate <= now;
  });
}

/**
 * Get the mastery level of a question based on repetitions
 * @param {Object} question - The question object
 * @returns {string} Mastery level ('new', 'learning', or 'mastered')
 */
export function getMasteryLevel(question) {
  if (!question.spacedRepetition || question.spacedRepetition.repetitions === 0) {
    return 'new';
  }
  if (question.spacedRepetition.repetitions < 4) {
    return 'learning';
  }
  return 'mastered';
}

/**
 * Calculate review forecast for the next n days
 * @param {Array} questions - Array of question objects
 * @param {number} days - Number of days to forecast
 * @returns {Array} Array of daily review counts
 */
export function getReviewForecast(questions, days = 7) {
  const forecast = Array(days).fill(0);
  const today = new Date();
  
  questions.forEach(question => {
    if (!question.spacedRepetition?.nextReviewDate) {
      forecast[0]++; // New questions count for today
      return;
    }

    const reviewDate = new Date(question.spacedRepetition.nextReviewDate);
    const dayDiff = Math.floor((reviewDate - today) / (1000 * 60 * 60 * 24));
    
    if (dayDiff >= 0 && dayDiff < days) {
      forecast[dayDiff]++;
    }
  });

  return forecast;
} 