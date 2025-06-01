<template>
  <div class="study-stats">
    <h2>Study Statistics</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ totalQuizzes }}</div>
        <div class="stat-label">Total Quizzes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ averageScore }}%</div>
        <div class="stat-label">Average Score</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ totalQuestions }}</div>
        <div class="stat-label">Questions Answered</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ dueCount }}</div>
        <div class="stat-label">Due for Review</div>
      </div>
    </div>

    <div class="activity-section">
      <h3>Activity Overview</h3>
      <CalendarHeatmap :activities="activityData" />
    </div>

    <div class="mastery-section">
      <h3>Mastery Progress</h3>
      <div class="mastery-grid">
        <div class="mastery-card">
          <div class="mastery-icon">🌱</div>
          <div class="mastery-count">{{ masteryLevels.new }}</div>
          <div class="mastery-label">New</div>
        </div>
        <div class="mastery-card">
          <div class="mastery-icon">📚</div>
          <div class="mastery-count">{{ masteryLevels.learning }}</div>
          <div class="mastery-label">Learning</div>
        </div>
        <div class="mastery-card">
          <div class="mastery-icon">⭐</div>
          <div class="mastery-count">{{ masteryLevels.mastered }}</div>
          <div class="mastery-label">Mastered</div>
        </div>
      </div>
    </div>

    <div class="review-forecast">
      <h3>Review Forecast</h3>
      <div class="forecast-grid">
        <div v-for="(count, day) in reviewForecast" :key="day" class="forecast-day">
          <div class="day-label">{{ day }}</div>
          <div class="day-count">{{ count }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import CalendarHeatmap from './CalendarHeatmap.vue';
import { getMasteryLevel, getReviewForecast } from '../algorithms/spaced-repetition';

const store = useStore();

// Update computed properties to use new getters
const totalQuizzes = computed(() => store.getters.getTotalQuizzes);
const totalQuestions = computed(() => store.getters.getTotalQuestions);
const averageScore = computed(() => store.getters.getAverageAccuracy);
const dueCount = computed(() => store.getters.getDueQuestions.length);

// Add getter for activity data
const activityData = computed(() => {
  const quizzesByDate = store.getters.getQuizzesByDate;
  const today = new Date();
  const data = {};
  
  // Initialize last 365 days with 0
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    data[dateStr] = quizzesByDate[dateStr] || 0;
  }
  
  return data;
});

const masteryLevels = computed(() => {
  const questions = store.state.quizzes?.flatMap(quiz => quiz.questions) || [];
  return {
    new: questions.filter(q => getMasteryLevel(q) === 'new').length,
    learning: questions.filter(q => getMasteryLevel(q) === 'learning').length,
    mastered: questions.filter(q => getMasteryLevel(q) === 'mastered').length
  };
});

const reviewForecast = computed(() => {
  const questions = store.state.quizzes?.flatMap(quiz => quiz.questions) || [];
  const forecast = getReviewForecast(questions, 7);
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
</script>

<style scoped>
.study-stats {
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  color: #24292e;
  border: 1px solid #e1e4e8;
}

h2 {
  margin: 0 0 2rem 0;
  color: #24292e;
  font-size: 1.8rem;
}

h3 {
  color: #24292e;
  margin: 2rem 0 1rem 0;
  font-size: 1.4rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e1e4e8;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #40c463;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #57606a;
  font-size: 1rem;
}

.activity-section {
  margin: 2rem 0;
}

.mastery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.mastery-card {
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e1e4e8;
}

.mastery-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.mastery-count {
  font-size: 1.8rem;
  font-weight: bold;
  color: #40c463;
  margin-bottom: 0.3rem;
}

.mastery-label {
  color: #57606a;
}

.review-forecast {
  margin-top: 2rem;
}

.forecast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.forecast-day {
  background: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e1e4e8;
}

.day-label {
  color: #57606a;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.day-count {
  font-size: 1.5rem;
  font-weight: bold;
  color: #40c463;
}
</style>