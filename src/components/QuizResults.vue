<template>
  <div class="quiz-results">
    <div class="score-summary">
      <h2>Quiz Complete!</h2>
      <div class="score-display">
        <div class="score-circle" :class="getScoreClass">
          <span class="score-value">{{ score }}%</span>
          <span class="score-label">Your Score</span>
        </div>
        <div v-if="predictedScore !== null" class="prediction-comparison">
          <p>Predicted Score: {{ predictedScore }}%</p>
          <p class="performance-text">{{ getPerformanceText }}</p>
        </div>
      </div>
    </div>

    <div class="questions-review">
      <h3>Review Your Answers</h3>
      <div v-for="(question, index) in questions" :key="index" class="question-review">
        <div class="question-header">
          <span class="question-number">Question {{ index + 1 }}</span>
          <span class="answer-status" :class="question.is_correct ? 'correct' : 'incorrect'">
            {{ question.is_correct ? 'Correct' : 'Incorrect' }}
          </span>
        </div>

        <p class="question-text">{{ question.text }}</p>

        <div class="answer-details">
          <p class="your-answer">
            Your Answer: <span :class="question.is_correct ? 'correct-text' : 'incorrect-text'">
              {{ question.user_answer }}
            </span>
          </p>
          <p v-if="!question.is_correct" class="correct-answer">
            Correct Answer: <span class="correct-text">{{ question.correct_answer }}</span>
          </p>
        </div>

        <div v-if="question.explanation" class="explanation-text">
          <strong>Explanation:</strong>
          <p>{{ question.explanation }}</p>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button @click="$emit('restart')" class="restart-btn">
        Try Again
      </button>
      <button @click="$emit('go-back')" class="back-btn">
        Back to Upload
      </button>
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
  score: {
    type: Number,
    required: true
  },
  predictedScore: {
    type: Number,
    default: null
  }
});

const getScoreClass = computed(() => {
  if (props.score >= 80) return 'high';
  if (props.score >= 60) return 'medium';
  return 'low';
});

const getPerformanceText = computed(() => {
  if (props.predictedScore === null) return '';
  
  const difference = props.score - props.predictedScore;
  if (difference > 10) return 'You exceeded expectations!';
  if (difference < -10) return 'Keep practicing to improve!';
  return 'You met the predicted score!';
});

defineEmits(['restart', 'go-back']);
</script>

<style scoped>
.quiz-results {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.score-summary {
  text-align: center;
  margin-bottom: 3rem;
}

.score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.score-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 2rem auto;
  transition: all 0.3s ease;
}

.score-circle.high {
  background-color: #e8f5e9;
  border: 4px solid #4CAF50;
}

.score-circle.medium {
  background-color: #fff3e0;
  border: 4px solid #ff9800;
}

.score-circle.low {
  background-color: #ffebee;
  border: 4px solid #f44336;
}

.score-value {
  font-size: 3.5rem;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.prediction-comparison {
  color: #666;
  font-size: 1.1rem;
}

.performance-text {
  margin-top: 0.5rem;
  font-weight: 500;
  color: #333;
}

.questions-review {
  margin-top: 3rem;
}

.question-review {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 500;
  color: #666;
}

.answer-status {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 500;
  font-size: 0.9rem;
}

.answer-status.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.answer-status.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.question-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #333;
}

.answer-details {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.your-answer, .correct-answer {
  margin: 0.5rem 0;
}

.correct-text {
  color: #2e7d32;
  font-weight: 500;
}

.incorrect-text {
  color: #c62828;
  font-weight: 500;
}

.explanation-text {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 3px solid #2196F3;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.restart-btn, .back-btn {
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.restart-btn {
  background-color: #2196F3;
  color: white;
}

.restart-btn:hover {
  background-color: #1976D2;
}

.back-btn {
  background-color: #f5f5f5;
  color: #333;
}

.back-btn:hover {
  background-color: #e0e0e0;
}
</style> 