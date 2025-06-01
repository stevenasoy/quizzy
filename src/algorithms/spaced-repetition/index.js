/**
 * Spaced Repetition Algorithm Module
 * Based on Anki's implementation of SuperMemo 2 Algorithm
 */

/**
 * Convert performance score to Anki-style quality rating
 * @param {number} performance - Raw performance score (0-1)
 * @param {number} responseTime - Time taken to answer in milliseconds (optional)
 * @returns {number} Quality rating (0-5)
 */
function getQualityRating(performance, responseTime = null) {
  if (performance === 0) return 0; // Complete blackout
  
  // If we have response time, use it to fine-tune the rating
  if (responseTime !== null) {
    const timeBasedPenalty = Math.min(2, responseTime / 10000); // Penalty for taking >10s
    performance = Math.max(0, performance - timeBasedPenalty * 0.2);
  }

  // Convert performance to Anki's 0-5 scale
  if (performance < 0.2) return 1; // Wrong, but remembered when shown
  if (performance < 0.4) return 2; // Wrong, but familiar
  if (performance < 0.6) return 3; // Correct with effort
  if (performance < 0.8) return 4; // Correct with hesitation
  return 5; // Perfect response
}

/**
 * Calculate ease factor adjustment
 * @param {number} quality - Quality rating (0-5)
 * @returns {number} Ease factor adjustment
 */
function calculateEaseAdjustment(quality) {
  // Anki's ease factor adjustment formula
  return 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
}

/**
 * Calculate interval modifier based on card maturity
 * @param {Object} questionState - Current state of the question
 * @returns {number} Interval modifier
 */
function getIntervalModifier(questionState) {
  const maturityBonus = Math.min(0.2, questionState.repetitions * 0.02);
  const intervalPenalty = Math.max(-0.2, -Math.log10(questionState.interval) * 0.05);
  return 1 + maturityBonus + intervalPenalty;
}

/**
 * Calculate the next review interval for a question
 * @param {Object} questionState - Current state of the question
 * @param {number} performance - Performance score (0-1)
 * @param {number} responseTime - Time taken to answer in milliseconds (optional)
 * @returns {Object} Updated question state with next review date
 */
export function calculateNextReview(questionState, performance, responseTime = null) {
  // Initialize state if new question
  if (!questionState) {
    questionState = {
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      lapses: 0,
      lastReviewDate: null,
      reviewHistory: []
    };
  }

  const quality = getQualityRating(performance, responseTime);
  const intervalModifier = getIntervalModifier(questionState);
  
  // Calculate new ease factor (Anki style)
  let newEaseFactor = questionState.easeFactor + calculateEaseAdjustment(quality);
  newEaseFactor = Math.max(1.3, newEaseFactor); // Minimum ease factor

  // Calculate new interval
  let newInterval;
  if (quality < 3) {
    // Failed response
    newInterval = 1;
    questionState.repetitions = 0;
    questionState.lapses++;
    
    // Apply lapse penalty to ease factor
    newEaseFactor = Math.max(1.3, newEaseFactor * 0.85);
  } else {
    // Successful response
    if (questionState.repetitions === 0) {
      newInterval = 1;
    } else if (questionState.repetitions === 1) {
      newInterval = 6;
    } else {
      // Apply interval modifier for mature cards
      newInterval = Math.round(questionState.interval * questionState.easeFactor * intervalModifier);
    }
    questionState.repetitions++;
  }

  // Apply random fuzz to interval (Anki style)
  const fuzz = 0.95 + Math.random() * 0.1; // ±5% random interval adjustment
  newInterval = Math.round(newInterval * fuzz);

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  // Update review history
  const reviewRecord = {
    date: new Date(),
    quality,
    performance,
    responseTime,
    interval: newInterval,
    easeFactor: newEaseFactor
  };

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: questionState.repetitions,
    lapses: questionState.lapses,
    lastReviewDate: new Date(),
    nextReviewDate: nextReviewDate,
    reviewHistory: [...(questionState.reviewHistory || []), reviewRecord]
  };
}

/**
 * Get questions due for review with Anki-style priority
 * @param {Array} questions - Array of questions with their spaced repetition state
 * @returns {Array} Questions that are due for review
 */
export function getDueQuestions(questions) {
  const now = new Date();
  return questions.filter(q => {
    if (!q.spacedRepetition) return true; // New questions are always due
    return q.spacedRepetition.nextReviewDate <= now;
  });
}

/**
 * Calculate review priority for questions (Anki-style)
 * @param {Array} questions - Array of questions with their spaced repetition state
 * @returns {Array} Questions sorted by review priority
 */
export function calculateReviewPriority(questions) {
  const now = new Date();
  return questions.map(q => {
    let priority = 0;
    
    if (!q.spacedRepetition) {
      priority = 100; // New questions get high priority
    } else {
      const daysOverdue = (now - new Date(q.spacedRepetition.nextReviewDate)) / (1000 * 60 * 60 * 24);
      const maturityFactor = Math.min(1, q.spacedRepetition.repetitions / 10);
      const lapsePenalty = q.spacedRepetition.lapses * 0.1;
      
      // Priority formula considering multiple factors
      priority = (
        (daysOverdue + 1) * // Base priority from days overdue
        (3.5 - q.spacedRepetition.easeFactor) * // Harder cards get higher priority
        (1 + lapsePenalty) * // More lapses = higher priority
        (1 - maturityFactor * 0.5) // Less mature cards get higher priority
      );

      // Boost priority for overdue reviews
      if (daysOverdue > 0) {
        priority *= (1 + Math.min(daysOverdue * 0.1, 1));
      }
    }
    
    return { ...q, priority };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Update question state after review
 * @param {Object} question - Question object
 * @param {number} performance - Performance score (0-1)
 * @param {number} responseTime - Time taken to answer in milliseconds (optional)
 * @returns {Object} Updated question object
 */
export function updateQuestionAfterReview(question, performance, responseTime = null) {
  const updatedState = calculateNextReview(
    question.spacedRepetition,
    performance,
    responseTime
  );
  
  return {
    ...question,
    spacedRepetition: updatedState
  };
} 