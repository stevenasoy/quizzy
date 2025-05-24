<template>
  <div class="quiz-results">
    <h2>Quiz Complete!</h2>
    <div class="score-display" :class="scoreClass">
      <div class="score-container">
        <div class="score-main">
          <span class="score-value">{{ score }}</span>
          <span class="score-separator">/</span>
          <span class="score-total">{{ totalQuestions }}</span>
        </div>
        <div class="score-percentage">({{ scorePercentage }}%)</div>
      </div>
    </div>

    <div class="score-comparison" v-if="predictedScore">
      <p>You scored {{ scorePercentage }}%. Predicted score was {{ predictedScore }}%.</p>
      <p v-if="scorePercentage > predictedScore + 5" class="comparison-text success">
        Excellent! You surpassed the prediction!
      </p>
      <p v-else-if="Math.abs(scorePercentage - predictedScore) <= 5" class="comparison-text neutral">
        You were close to the prediction!
      </p>
      <p v-else class="comparison-text warning">
        You scored below the prediction. Review the material for improvement.
      </p>
    </div>
    
    <div class="detailed-results">
      <h3>Detailed Results</h3>
      <div v-for="(question, index) in questions" :key="index" class="result-item">
        <div class="question-header">
          <span class="question-number">Question {{ index + 1 }}</span>
          <span :class="['result-status', question.isCorrect ? 'correct' : 'wrong']">
            {{ question.isCorrect ? '✓' : '✗' }}
          </span>
        </div>
        <p class="question-text">{{ question.text }}</p>
        <div class="answer-details" :class="{ 'incorrect': !question.isCorrect }">
          <div class="answer-row">
            <div class="user-answer">
              <strong>Your answer:</strong> 
              <span :class="{ 'incorrect-text': !question.isCorrect }">
                {{ formatAnswer(question, question.userAnswer) }}
              </span>
            </div>
            <div class="correct-answer">
              <strong>Correct answer:</strong>
              <span class="correct-text">{{ formatAnswer(question, question.correctAnswer) }}</span>
            </div>
          </div>
          <div class="explanation-box" :class="{ 'correct': question.isCorrect, 'incorrect': !question.isCorrect }">
            <p class="explanation-label">Explanation:</p>
            <p class="explanation-text">{{ generateExplanation(question, question.isCorrect) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="return-hint">
      <p>You can retake this quiz anytime from the history panel</p>
      <p>Click "Create New Quiz" to start a new quiz with different material</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  userAnswers: {
    type: Array,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  predictedScore: {
    type: Number,
    required: false,
    default: null
  }
});

const totalQuestions = computed(() => props.questions.length);
const scorePercentage = computed(() => {
  return Math.round((props.score / totalQuestions.value) * 100);
});
const scoreClass = computed(() => {
  return scorePercentage.value >= 75 ? 'passing' : 'failing';
});

function formatAnswer(question, answer) {
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

function rephraseContent(text, isSupporting, question) {
  // Clean the text of personal info and formatting
  let cleaned = text.trim()
    .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '')
    .replace(/\+\d{2}\s*\d{3}\s*\d{3}\s*\d{4}/g, '')
    .replace(/\d{4}\s*\+\d{2}\s*\d{3}\s*\d{3}/g, '')
    .replace(/\d{4}\s*\d{4}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .trim();

  // Extract source material context if available
  const sourceMaterial = question.sourceMaterial || cleaned;
  const sourceContext = question.sourceContext || '';
  
  // Analyze the question content and source material
  const questionLower = question.text.toLowerCase();
  const correctAnswer = question.type === 'multiple-choice' 
    ? question.options[question.correctAnswer].toLowerCase()
    : String(question.correctAnswer).toLowerCase();

  // Get specific keywords from the question and answers
  const questionKeywords = questionLower
    .replace(/[.,?!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['what', 'which', 'when', 'where', 'why', 'how', 'does', 'did', 'will', 'should', 'could', 'would', 'this', 'that', 'these', 'those', 'have', 'has', 'had'].includes(word));

  const correctAnswerKeywords = correctAnswer
    .replace(/[.,?!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);

  const userAnswerKeywords = question.type === 'multiple-choice' && question.userAnswer !== undefined
    ? question.options[question.userAnswer].toLowerCase()
        .replace(/[.,?!]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
    : [];

  // Combine all relevant keywords
  const allKeywords = [...new Set([...questionKeywords, ...correctAnswerKeywords, ...userAnswerKeywords])];

  // Find the most relevant sentence from the source material
  function findRelevantContext(text, keywords) {
    if (!text) return '';
    
    // Split into sentences and clean them
    const sentences = text.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Score each sentence based on keyword matches
    const scoredSentences = sentences.map(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const matchCount = keywords.reduce((count, keyword) => {
        return count + (sentenceLower.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);
      return { sentence, score: matchCount };
    });

    // Sort by score and get the most relevant sentences (max 2)
    const relevantSentences = scoredSentences
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(item => item.sentence);

    return relevantSentences.join('. ');
  }

  // Generate explanation based on the specific question and answer
  function generateSpecificExplanation() {
    const relevantContext = findRelevantContext(sourceContext || sourceMaterial, allKeywords);
    
    if (isSupporting) {
      if (relevantContext) {
        return `Correct! ${relevantContext}`;
      }
      return 'Correct! This aligns with the course material.';
    } else {
      const correctPart = question.type === 'multiple-choice'
        ? `The correct answer is "${question.options[question.correctAnswer]}". `
        : `The correct answer is ${question.correctAnswer}. `;
        
      if (relevantContext) {
        return `${correctPart}Here's why: ${relevantContext}`;
      }
      return `${correctPart}Please review this topic in the course material.`;
    }
  }

  // Generate the explanation
  let explanation = generateSpecificExplanation();

  // Add specific feedback for incorrect multiple choice answers
  if (question.type === 'multiple-choice' && !isSupporting && question.userAnswer !== undefined) {
    const userChoice = question.options[question.userAnswer];
    explanation += ` You selected "${userChoice}", which is incorrect.`;
  }

  return explanation;
}

function generateExplanation(question, isCorrect) {
  const explanation = question.explanation || '';
  if (!explanation) return "No explanation available.";

  if (question.type === 'multiple-choice') {
    return generateMultipleChoiceExplanation(question, isCorrect);
  } else {
    return generateTrueFalseExplanation(question, isCorrect);
  }
}

function generateMultipleChoiceExplanation(question, isCorrect) {
  if (isCorrect) {
    return rephraseContent(question.explanation, true, question);
  }

  const userOption = question.options[question.userAnswer];
  const correctOption = question.options[question.correctAnswer];
  
  // Compare the chosen answer with the correct one to explain the difference
  const explanation = `While "${userOption}" might seem reasonable, it's not the complete picture. ${rephraseContent(question.explanation, false, question)} The correct answer, "${correctOption}", better reflects the full scope of the position.`;
  
  return explanation;
}

function generateTrueFalseExplanation(question, isCorrect) {
  if (isCorrect) {
    return rephraseContent(question.explanation, true, question);
  }

  const userChoice = question.userAnswer ? 'true' : 'false';
  const correctChoice = question.correctAnswer === 'true' ? 'true' : 'false';
  
  // Explain why their understanding needs adjustment
  return `Your understanding needs a slight adjustment. While you marked this as ${userChoice}, ${rephraseContent(question.explanation, false, question)} This is why the statement is actually ${correctChoice}.`;
}
</script>

<style scoped>
.quiz-results {
  max-width: 800px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
}

.score-display {
  margin: 2rem 0;
  padding: 2rem;
  border-radius: 12px;
  font-weight: bold;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.score-display.passing {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
}

.score-display.failing {
  background-color: #ffebee;
  border: 3px solid #f44336;
}

.score-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.score-main {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.score-value {
  font-size: 4rem;
  line-height: 1;
  font-weight: 800;
}

.score-separator {
  font-size: 3rem;
  opacity: 0.5;
}

.score-total {
  font-size: 2.5rem;
  opacity: 0.7;
}

.score-percentage {
  font-size: 1.8rem;
  font-weight: 600;
  opacity: 0.9;
}

.score-comparison {
  margin: 1.5rem 0;
  padding: 1.5rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.comparison-text {
  margin-top: 0.5rem;
  font-weight: bold;
}

.comparison-text.success {
  color: #4CAF50;
}

.comparison-text.neutral {
  color: #666;
}

.comparison-text.warning {
  color: #f44336;
}

.detailed-results {
  margin: 2rem 0;
  text-align: left;
}

.result-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.question-number {
  font-weight: 600;
  color: #666;
}

.result-status {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.result-status.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.result-status.wrong {
  background-color: #ffebee;
  color: #c62828;
}

.question-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.answer-details {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.answer-details.incorrect {
  border-color: #ffcdd2;
  background-color: #fff5f5;
}

.answer-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.user-answer, .correct-answer {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.user-answer strong, .correct-answer strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.incorrect-text {
  color: #d32f2f;
}

.correct-text {
  color: #2e7d32;
}

.explanation-box {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.explanation-box.correct {
  border-left: 4px solid #4CAF50;
}

.explanation-box.incorrect {
  border-left: 4px solid #ff9800;
}

.explanation-label {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.explanation-label.correct {
  color: #4CAF50;
}

.explanation-label.incorrect {
  color: #f57c00;
}

.explanation-text {
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.return-hint {
  margin-top: 2rem;
  text-align: center;
  color: #666;
  background: #f5f5f5;
  padding: 1.5rem;
  border-radius: 8px;
}

.return-hint p {
  margin: 0.5rem 0;
  font-size: 0.95rem;
}

.return-hint p:first-child {
  color: #4CAF50;
  font-weight: 500;
}

.return-hint p:last-child {
  color: #2196F3;
  font-weight: 500;
}

/* Remove button styles */
.button-group, .restart-btn, .back-btn {
  display: none;
}
</style> 