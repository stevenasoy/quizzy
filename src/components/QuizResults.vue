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
    
    <div class="detailed-results">
      <h3>Detailed Results</h3>
      <div v-for="(question, index) in questions" :key="index" class="result-item">
        <div class="question-header">
          <span class="question-number">Q{{ index + 1 }}</span>
          <span :class="['result-status', 
            normalizeLetter(userAnswers[index]) === normalizeLetter(question.answer) ? 'correct' : 'wrong']">
            {{ normalizeLetter(userAnswers[index]) === normalizeLetter(question.answer) ? '✓' : '✗' }}
          </span>
        </div>
        <p class="question-text">{{ question.text }}</p>
        <div class="answer-details">
          <p>Your answer: {{ userAnswers[index] || 'Not answered' }}</p>
          <p>Correct answer: {{ question.answer }}</p>
        </div>
      </div>
    </div>

    <div class="button-group">
      <button @click="$emit('restart')">Redo Quiz</button>
      <button @click="$emit('go-back')">Go Back to Main Screen</button>
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
  }
});

defineEmits(['restart', 'go-back']);

const totalQuestions = computed(() => props.questions.length);
const scorePercentage = computed(() => {
  return Math.round((props.score / totalQuestions.value) * 100);
});
const scoreClass = computed(() => {
  return scorePercentage.value >= 75 ? 'passing' : 'failing';
});

function normalizeLetter(letter) {
  return String(letter).replace(/[)\s]/g, '').toUpperCase();
}
</script>

<style scoped>
.quiz-results {
  max-width: 500px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
  text-align: center;
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
  border: 3px solid #2e7d32;
}

.score-display.failing {
  background-color: #ffebee;
  border: 3px solid #c62828;
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

.detailed-results {
  margin: 2rem 0;
  text-align: left;
  font-size: 0.9rem;
}

.result-item {
  background: #f8f8f8;
  border-radius: 8px;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.question-number {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.result-status {
  font-size: 1rem;
  font-weight: bold;
}

.result-status.correct {
  color: #27ae60;
}

.result-status.wrong {
  color: #e74c3c;
}

.question-text {
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.answer-details {
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid #ddd;
  font-size: 0.85rem;
}

.answer-details p {
  margin: 0.2rem 0;
  color: #666;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.button-group button {
  padding: 0.7rem 2rem;
  background: #4CAF50;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.button-group button:hover {
  background: #388e3c;
}
</style> 