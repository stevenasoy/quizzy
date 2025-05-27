/**
 * Difficulty Adaptation Algorithm Module
 */

/**
 * Calculate the next question's difficulty based on user performance
 * @param {Array} previousResponses - Array of previous question responses
 * @param {number} consecutiveCorrect - Number of consecutive correct answers
 * @param {number} consecutiveIncorrect - Number of consecutive incorrect answers
 * @returns {string} Next question difficulty level
 */
export function calculateNextDifficulty(previousResponses, consecutiveCorrect, consecutiveIncorrect) {
  // If no previous responses, start with medium
  if (!previousResponses || previousResponses.length === 0) {
    return 'medium';
  }

  // Get current difficulty from last question
  const currentDifficulty = previousResponses[previousResponses.length - 1].difficulty || 'medium';
  
  // Calculate recent performance (last 3 questions)
  const recentResponses = previousResponses.slice(-3);
  const recentCorrectRate = recentResponses.filter(r => r.correct).length / recentResponses.length;

  // Adjust difficulty based on performance patterns
  if (currentDifficulty === 'easy') {
    if (consecutiveCorrect >= 2 || recentCorrectRate >= 0.8) {
      return 'medium';
    }
  } else if (currentDifficulty === 'medium') {
    if (consecutiveCorrect >= 2 && recentCorrectRate >= 0.8) {
      return 'hard';
    } else if (consecutiveIncorrect >= 2 || recentCorrectRate <= 0.3) {
      return 'easy';
    }
  } else if (currentDifficulty === 'hard') {
    if (consecutiveIncorrect >= 2 || recentCorrectRate <= 0.5) {
      return 'medium';
    }
  }

  // If no adjustment needed, maintain current difficulty
  return currentDifficulty;
}

/**
 * Select the next question from available questions based on calculated difficulty
 * @param {Array} availableQuestions - Array of unused questions
 * @param {string} targetDifficulty - Target difficulty level
 * @returns {Object} Selected question and remaining questions
 */
export function selectNextQuestion(availableQuestions, targetDifficulty) {
  if (!availableQuestions || availableQuestions.length === 0) {
    return { question: null, remainingQuestions: [] };
  }

  // First try to find a question of target difficulty
  let question = availableQuestions.find(q => q.difficulty === targetDifficulty);

  // If no question of target difficulty, find closest difficulty
  if (!question) {
    if (targetDifficulty === 'hard') {
      question = availableQuestions.find(q => q.difficulty === 'medium');
    } else if (targetDifficulty === 'easy') {
      question = availableQuestions.find(q => q.difficulty === 'medium');
    } else {
      // If medium not found, take any question
      question = availableQuestions[0];
    }
  }

  // If still no question found, take the first available
  if (!question) {
    question = availableQuestions[0];
  }

  // Remove selected question from available questions
  const remainingQuestions = availableQuestions.filter(q => q !== question);

  return { question, remainingQuestions };
}

/**
 * Initialize adaptive quiz state
 * @param {Array} questions - Array of all questions
 * @returns {Object} Initial quiz state
 */
export function initializeAdaptiveQuiz(questions) {
  return {
    availableQuestions: [...questions],
    usedQuestions: [],
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    currentDifficulty: 'medium'
  };
}

/**
 * Update quiz state based on user's answer
 * @param {Object} quizState - Current quiz state
 * @param {Object} response - User's response to current question
 * @returns {Object} Updated quiz state
 */
export function updateQuizState(quizState, response) {
  const newState = { ...quizState };

  // Update consecutive counters
  if (response.correct) {
    newState.consecutiveCorrect += 1;
    newState.consecutiveIncorrect = 0;
  } else {
    newState.consecutiveIncorrect += 1;
    newState.consecutiveCorrect = 0;
  }

  // Add response to used questions
  newState.usedQuestions.push(response);

  // Calculate next difficulty
  newState.currentDifficulty = calculateNextDifficulty(
    newState.usedQuestions,
    newState.consecutiveCorrect,
    newState.consecutiveIncorrect
  );

  return newState;
} 