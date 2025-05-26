/**
 * Question Management Algorithms Module
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
  const targetPerDifficulty = Math.ceil(targetCount / 3);
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };
  const selectedQuestions = [];

  for (const difficulty of ['easy', 'medium', 'hard']) {
    const questionsOfDifficulty = questions.filter(q => 
      q.difficulty === difficulty && !selectedQuestions.includes(q)
    );
    
    for (const question of questionsOfDifficulty) {
      if (difficultyCount[difficulty] < targetPerDifficulty && 
          selectedQuestions.length < targetCount) {
        selectedQuestions.push(question);
        difficultyCount[difficulty]++;
      }
    }
  }

  return selectedQuestions;
} 