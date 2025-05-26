<template>
  <div class="quiz-results">
    <h1>Quiz Complete!</h1>
    
    <div class="score-display" :class="scoreStatus">
      <div class="score-value">
        <span class="score-number">{{ score }}</span>
        <span class="score-separator">/</span>
        <span class="total-questions">{{ totalQuestions }}</span>
      </div>
      <div class="score-percentage">({{ scorePercentage }}%)</div>
    </div>

    <div class="prediction-message" :class="scoreStatus" v-if="predictedScore !== null">
      <p>You scored <strong>{{ scorePercentage }}%</strong>. Predicted score was <strong>{{ predictedScore }}%</strong>.</p>
      <p class="prediction-comparison" v-if="scorePercentage > predictedScore">
        <strong>Excellent!</strong> You surpassed the prediction!
      </p>
    </div>

    <div class="questions-review">
      <div v-for="(question, index) in questions" :key="index" class="question-item">
        <div class="question-header">
          <h3>Question {{ index + 1 }}</h3>
          <div class="status-indicator" :class="question.isCorrect ? 'correct' : 'incorrect'">
            {{ question.isCorrect ? '✓' : 'X' }}
          </div>
        </div>
        
        <p class="question-text">{{ question.text }}</p>
        
        <div class="answers-container">
          <div class="answer-box">
            <div class="answer-label">YOUR ANSWER:</div>
            <div class="answer-content" :class="{ 'incorrect': !question.isCorrect }">
              <strong>{{ formatAnswer(question.userAnswer, question) }}</strong>
            </div>
          </div>

          <div class="answer-box">
            <div class="answer-label">CORRECT ANSWER:</div>
            <div class="answer-content correct">
              <strong>{{ formatAnswer(question.correctAnswer, question) }}</strong>
            </div>
          </div>
        </div>
        
        <div class="explanation" v-if="question.explanation">
          <div class="explanation-label">EXPLANATION:</div>
          <div class="explanation-text" :class="{ 'correct-highlight': question.isCorrect, 'incorrect-highlight': !question.isCorrect }">
            {{ question.explanation }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getScoreClass } from '../algorithms/answer-formatting';

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

const scoreStatus = computed(() => {
  const percentage = scorePercentage.value;
  return getScoreClass(percentage);
});

function formatAnswer(answer, question) {
  if (question.type === 'multiple-choice') {
    return `${answer}) ${question.options[answer]}`;
  }
  return answer;
}
</script>

<style scoped>
.quiz-results {
  max-width: 800px;
  margin: 2rem auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-family: "Helvetica", "Arial", sans-serif;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #333;
  font-weight: 600;
  text-align: center;
}

.score-display {
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.score-display.excellent {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
}

.score-display.good {
  background-color: #e3f2fd;
  border: 3px solid #2196F3;
}

.score-display.average {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
}

.score-display.needs-improvement {
  background-color: #ffebee;
  border: 3px solid #f44336;
}

.score-value {
  font-size: 4rem;
  font-weight: 800;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
  line-height: 1;
}

.score-separator {
  color: #666;
  margin: 0 0.2rem;
}

.score-percentage {
  font-size: 1.5rem;
  font-weight: 600;
  color: #666;
  margin-top: 1rem;
}

.prediction-message {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1rem;
  border: 1px solid;
}

.prediction-message.excellent {
  background-color: #e8f5e9;
  border-color: #4CAF50;
  color: #2E7D32;
}

.prediction-message.good {
  background-color: #e3f2fd;
  border-color: #2196F3;
  color: #1565C0;
}

.prediction-message.average {
  background-color: #fff3e0;
  border-color: #FF9800;
  color: #E65100;
}

.prediction-message.needs-improvement {
  background-color: #ffebee;
  border-color: #f44336;
  color: #c62828;
}

.prediction-message.exceeded {
  background-color: #e8f5e9;
  border-color: #4CAF50;
  color: #2E7D32;
}

.prediction-message.met {
  background-color: #e3f2fd;
  border-color: #2196F3;
  color: #1565C0;
}

.prediction-message.below {
  background-color: #ffebee;
  border-color: #f44336;
  color: #c62828;
}

.prediction-message strong {
  font-weight: 700;
}

.prediction-comparison {
  color: #4CAF50;
  margin-top: 0.5rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.prediction-comparison strong {
  font-weight: 700;
}

.question-item {
  background: white;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.question-header h3 {
  color: #666;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

.status-indicator {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
}

.status-indicator.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-indicator.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.question-text {
  padding: 1.5rem;
  margin: 0;
  color: #333;
  font-size: 1.1rem;
  line-height: 1.5;
}

.answers-container {
  padding: 1rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.answer-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.answer-label {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.answer-content {
  color: #333;
  font-size: 1rem;
  line-height: 1.4;
}

.answer-content.incorrect {
  color: #c62828;
}

.answer-content.correct {
  color: #2e7d32;
}

.answer-content strong {
  font-weight: 600;
}

.explanation {
  padding: 1.5rem;
  background-color: #fff;
  margin: 1rem 1.5rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.explanation-label {
  font-weight: 700;
  color: #666;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.explanation-text {
  margin: 0;
  color: #333;
  line-height: 1.6;
  font-size: 1rem;
  padding: 1rem;
  border-radius: 4px;
}

.explanation-text.correct-highlight {
  background-color: #e8f5e9;
  border-left: 4px solid #4CAF50;
}

.explanation-text.incorrect-highlight {
  background-color: #ffebee;
  border-left: 4px solid #f44336;
}
</style> 