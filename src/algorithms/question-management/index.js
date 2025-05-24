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
 * Detects and removes duplicate questions
 * @param {Array} questions - Array of questions
 * @returns {Array} Array with duplicates removed
 */
export function removeDuplicates(questions) {
  return questions.filter((question, index, self) => 
    index === self.findIndex((q) => 
      normalizeQuestion(q.text) === normalizeQuestion(question.text)
    )
  );
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

/**
 * Distributes questions by type
 * @param {Array} questions - Array of questions
 * @param {Object} typeDistribution - Desired distribution of question types
 * @returns {Array} Questions distributed by type
 */
export function distributeByType(questions, typeDistribution) {
  const selectedQuestions = [];
  const typeCount = {};
  
  // Initialize type counts
  Object.keys(typeDistribution).forEach(type => {
    typeCount[type] = 0;
  });

  questions.forEach(question => {
    const type = question.type;
    if (typeCount[type] < typeDistribution[type]) {
      selectedQuestions.push(question);
      typeCount[type]++;
    }
  });

  return selectedQuestions;
}

/**
 * Helper function to normalize question text
 * @param {string} text - Question text to normalize
 * @returns {string} Normalized text
 */
function normalizeQuestion(text) {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
} 