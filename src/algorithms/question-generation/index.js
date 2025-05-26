/**
 * Question Generation Module
 */

import { findExplanationFromContent } from '../explanation-generation';

/**
 * Process quiz response from API and convert to question objects
 * @param {string} response - Raw API response text
 * @param {string} content - Original content for explanations
 * @returns {Object} Processed questions
 */
export function processQuizResponse(response, content) {
  const questions = [];
  let currentQuestion = null;
  
  // Split by double newlines to separate questions
  const sections = response.split(/\n\s*\n/);
  
  for (const section of sections) {
    const lines = section.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check for question start
      if (line.startsWith('Question:') || line.startsWith('True/False:')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        const isMultipleChoice = line.startsWith('Question:');
        currentQuestion = {
          text: line.replace(/^(Question:|True\/False:)/i, '').trim().replace(/\*+/g, ''),
          type: isMultipleChoice ? 'multiple-choice' : 'true-false',
          options: isMultipleChoice ? {} : { 'true': 'True', 'false': 'False' },
          correctAnswer: '',
          explanation: '',
          difficulty: 'medium'
        };
        continue;
      }

      if (!currentQuestion) continue;

      // Handle options for multiple choice
      if (currentQuestion.type === 'multiple-choice') {
        const optionMatch = line.match(/^([A-D])[).]\s*(.*)/i);
        if (optionMatch) {
          const letter = optionMatch[1].toUpperCase();
          let option = optionMatch[2].trim();
          // Remove any asterisk from the option text
          option = option.replace(/\*$/, '').trim();
          currentQuestion.options[letter] = option;
        }
        
        // Check for answer line
        if (line.startsWith('Answer:')) {
          const answerMatch = line.match(/Answer:\s*([A-D])\*/i);
          if (answerMatch) {
            currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
          }
        }
      }

      // Handle true/false answer
      if (currentQuestion.type === 'true-false' && line.startsWith('Answer:')) {
        const answer = line.toLowerCase();
        if (answer.includes('true*')) {
          currentQuestion.correctAnswer = 'true';
        } else if (answer.includes('false*')) {
          currentQuestion.correctAnswer = 'false';
        }
      }

      // Handle difficulty
      if (line.startsWith('Difficulty:')) {
        const difficulty = line.substring(11).trim().toLowerCase();
        if (['easy', 'medium', 'hard'].includes(difficulty)) {
          currentQuestion.difficulty = difficulty;
        }
      }
    }
  }

  // Add the last question if exists
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  // Validate questions
  const validQuestions = questions.filter(q => {
    // Basic validation
    if (!q.text || !q.type) return false;

    // Validate multiple choice questions
    if (q.type === 'multiple-choice') {
      const hasEnoughOptions = Object.keys(q.options).length >= 2;
      const hasCorrectAnswer = !!q.correctAnswer && !!q.options[q.correctAnswer];
      return hasEnoughOptions && hasCorrectAnswer;
    }

    // Validate true/false questions
    if (q.type === 'true-false') {
      return q.correctAnswer === 'true' || q.correctAnswer === 'false';
    }

    return false;
  });

  if (validQuestions.length === 0) {
    throw new Error('No valid questions could be generated from the content.');
  }

  // Add explanations from content
  validQuestions.forEach(q => findExplanationFromContent(q, content));

  return { questions: validQuestions };
}

/**
 * Check if two questions are too similar
 * @param {Object} q1 - First question
 * @param {Object} q2 - Second question
 * @returns {boolean} True if questions are similar
 */
export function isSimilarQuestion(q1, q2) {
  // Convert both questions to lowercase and remove punctuation
  const normalize = text => text.toLowerCase().replace(/[^\w\s]/g, '');
  const q1Text = normalize(q1.text);
  const q2Text = normalize(q2.text);

  // If the questions are exactly the same, they're similar
  if (q1Text === q2Text) return true;

  // If they're different types (MC vs T/F), they're not similar
  if (q1.type !== q2.type) return false;

  // For multiple choice questions, check if the options are too similar
  if (q1.type === 'multiple-choice' && q2.type === 'multiple-choice') {
    const q1Options = Object.values(q1.options).map(normalize);
    const q2Options = Object.values(q2.options).map(normalize);
    const commonOptions = q1Options.filter(opt => q2Options.includes(opt));
    if (commonOptions.length >= 3) return true; // If 3 or more options are the same, consider them similar
  }

  // Check for word overlap ratio
  const q1Words = new Set(q1Text.split(/\s+/));
  const q2Words = new Set(q2Text.split(/\s+/));
  const commonWords = new Set([...q1Words].filter(x => q2Words.has(x)));
  const overlapRatio = commonWords.size / Math.min(q1Words.size, q2Words.size);

  return overlapRatio > 0.7; // If more than 70% of words overlap, consider them similar
} 