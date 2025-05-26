/**
 * Question Management Module
 */

/**
 * Implements Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleQuestions(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distributes questions by difficulty
 * @param {Array} questions - Array of questions
 * @param {number} targetCount - Desired number of questions
 * @returns {Array} Balanced question set
 */
export function distributeByDifficulty(questions, targetCount) {
  // Default distribution
  const distribution = { easy: 0.4, medium: 0.4, hard: 0.2 };
  
  // Calculate targets for each difficulty
  const targets = {
    easy: Math.round(targetCount * distribution.easy),
    medium: Math.round(targetCount * distribution.medium),
    hard: Math.round(targetCount * distribution.hard)
  };
  
  const selectedQuestions = [];
  
  // Select questions by difficulty
  Object.entries(targets).forEach(([difficulty, count]) => {
    const difficultyQuestions = questions.filter(q => 
      q.difficulty === difficulty && !selectedQuestions.includes(q)
    );
    
    // Shuffle to randomize selection
    const shuffled = shuffleQuestions(difficultyQuestions);
    selectedQuestions.push(...shuffled.slice(0, count));
  });
  
  // If we don't have enough questions of the right difficulties,
  // fill in with whatever questions are available
  while (selectedQuestions.length < targetCount && questions.length > selectedQuestions.length) {
    const remainingQuestions = questions.filter(q => !selectedQuestions.includes(q));
    const shuffled = shuffleQuestions(remainingQuestions);
    selectedQuestions.push(shuffled[0]);
  }
  
  return selectedQuestions;
}

 