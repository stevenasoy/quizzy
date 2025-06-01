<template>
  <div class="spaced-review-session">
    <div v-if="!started" class="session-intro">
      <h2>Review Session</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{ dueQuestions.length }}</div>
          <div class="stat-label">Questions Due</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ estimatedTime }}</div>
          <div class="stat-label">Est. Time</div>
        </div>
      </div>
      <button @click="startSession" class="start-btn">Start Review</button>
    </div>

    <FlashcardQuiz
      v-else
      :questions="dueQuestions"
      @complete="handleComplete"
      @update-question="handleQuestionUpdate"
    />

    <div v-if="completed" class="session-complete">
      <h2>Session Complete!</h2>
      <div class="completion-stats">
        <div class="stat">
          <div class="stat-value">{{ sessionStats.accuracy }}%</div>
          <div class="stat-label">Accuracy</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ sessionStats.timeSpent }}</div>
          <div class="stat-label">Time Spent</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ sessionStats.cardsReviewed }}</div>
          <div class="stat-label">Cards Reviewed</div>
        </div>
      </div>
      <div class="next-review-info">
        <h3>Next Reviews</h3>
        <div class="next-review-grid">
          <div v-for="(count, day) in nextReviews" :key="day" class="next-review-day">
            <div class="day">{{ day }}</div>
            <div class="count">{{ count }} cards</div>
          </div>
        </div>
      </div>
      <button @click="$emit('close')" class="close-btn">Close</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import FlashcardQuiz from './FlashcardQuiz.vue';
import { getDueQuestions, getReviewForecast } from '../algorithms/spaced-repetition';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['close', 'update-questions']);

// Session state
const started = ref(false);
const completed = ref(false);
const startTime = ref(null);
const sessionStats = ref({
  accuracy: 0,
  timeSpent: '0:00',
  cardsReviewed: 0
});

// Get due questions
const dueQuestions = computed(() => getDueQuestions(props.questions));

// Estimate review time (30 seconds per question)
const estimatedTime = computed(() => {
  const minutes = Math.ceil((dueQuestions.value.length * 30) / 60);
  return `${minutes} min${minutes !== 1 ? 's' : ''}`;
});

// Start the review session
const startSession = () => {
  started.value = true;
  startTime.value = new Date();
};

// Handle question updates during the quiz
const handleQuestionUpdate = (updatedQuestion) => {
  const questions = [...props.questions];
  const index = questions.findIndex(q => q.id === updatedQuestion.id);
  if (index !== -1) {
    questions[index] = updatedQuestion;
    emit('update-questions', questions);
  }
};

// Calculate next review dates
const nextReviews = computed(() => {
  const forecast = getReviewForecast(props.questions);
  const days = ['Today', 'Tomorrow', ...Array(5).fill().map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 2);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  })];
  
  return days.reduce((acc, day, index) => {
    if (forecast[index] > 0) {
      acc[day] = forecast[index];
    }
    return acc;
  }, {});
});

// Handle session completion
const handleComplete = (results) => {
  completed.value = true;
  
  // Calculate time spent
  const endTime = new Date();
  const timeSpent = Math.floor((endTime - startTime.value) / 1000); // in seconds
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  
  sessionStats.value = {
    accuracy: Math.round((results.score / results.total) * 100),
    timeSpent: `${minutes}:${seconds.toString().padStart(2, '0')}`,
    cardsReviewed: results.total
  };
};
</script>

<style scoped>
.spaced-review-session {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.session-intro {
  text-align: center;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
}

.stat {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2196F3;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.start-btn, .close-btn {
  background: #2196F3;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.start-btn:hover, .close-btn:hover {
  background: #1976D2;
}

.session-complete {
  text-align: center;
}

.completion-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin: 2rem 0;
}

.next-review-info {
  margin: 2rem 0;
}

.next-review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.next-review-day {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
}

.next-review-day .day {
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.next-review-day .count {
  color: #666;
  font-size: 0.9rem;
}

.close-btn {
  margin-top: 2rem;
}
</style> 