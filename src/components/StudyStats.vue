<template>
  <div class="study-stats">
    <h2>Study Statistics</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Quizzes</h3>
        <div class="stat-value">{{ quizHistory.length }}</div>
      </div>
      
      <div class="stat-card">
        <h3>Average Score</h3>
        <div class="stat-value">{{ averageScore }}%</div>
      </div>
      
      <div class="stat-card">
        <h3>Best Score</h3>
        <div class="stat-value">{{ bestScore }}%</div>
      </div>
      
      <div class="stat-card">
        <h3>Total Questions</h3>
        <div class="stat-value">{{ totalQuestions }}</div>
      </div>
    </div>

    <div class="activity-calendar">
      <div class="calendar-header">
        <div class="calendar-nav">
          <button class="nav-btn" @click="previousMonth">
            <span class="nav-arrow">←</span> Previous
          </button>
          <button class="nav-btn today-btn" @click="goToToday" :disabled="isCurrentMonth">
            Today
          </button>
          <button class="nav-btn" @click="nextMonth" :disabled="isCurrentMonth">
            Next <span class="nav-arrow">→</span>
          </button>
        </div>
        <div class="month-indicator">
          <span :class="{ 'current-month-text': isCurrentMonth }">{{ currentMonthYear }}</span>
        </div>
      </div>
      <table class="calendar-table">
        <thead>
          <tr>
            <th v-for="day in weekDays" :key="day">{{ day }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="week in calendarWeeks" :key="week[0].date">
            <td v-for="day in week" 
                :key="day.date" 
                :class="[
                  'calendar-cell',
                  { 'current-month': day.currentMonth },
                  { 'other-month': !day.currentMonth },
                  day.activity ? `activity-${day.activityLevel}` : '',
                  { 'has-activity': day.activity },
                  { 'today': isToday(day.date) }
                ]"
                :title="day.tooltip">
              <span class="day-number">{{ day.dayNumber }}</span>
              <span v-if="day.activity" class="session-count">
                {{ day.sessions }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="calendar-legend">
        <div class="legend-item">Study Sessions:</div>
        <div class="legend-squares">
          <div class="legend-square"></div>
          <div class="legend-square activity-1">1</div>
          <div class="legend-square activity-2">2</div>
          <div class="legend-square activity-3">3</div>
          <div class="legend-square activity-4">4+</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  quizHistory: {
    type: Array,
    required: true
  }
});

// Calendar navigation state
const currentDate = ref(new Date());

const isCurrentMonth = computed(() => {
  const today = new Date();
  return currentDate.value.getMonth() === today.getMonth() &&
         currentDate.value.getFullYear() === today.getFullYear();
});

const isFutureMonth = computed(() => {
  const today = new Date();
  return (currentDate.value.getFullYear() > today.getFullYear()) ||
         (currentDate.value.getFullYear() === today.getFullYear() && 
          currentDate.value.getMonth() > today.getMonth());
});

// Navigation methods
const previousMonth = () => {
  const newDate = new Date(currentDate.value);
  newDate.setMonth(newDate.getMonth() - 1);
  currentDate.value = newDate;
};

const nextMonth = () => {
  const newDate = new Date(currentDate.value);
  // Only allow moving forward if we're not already in or beyond current month
  if (!isCurrentMonth.value && !isFutureMonth.value) {
    newDate.setMonth(newDate.getMonth() + 1);
    currentDate.value = newDate;
  }
};

const goToToday = () => {
  currentDate.value = new Date();
};

// Updated computed properties
const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' });
});

const calendarWeeks = computed(() => {
  const firstDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth(), 1);
  const lastDay = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 0);
  
  // Get the first day of the first week (might be from previous month)
  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay());
  
  // Get the last day of the last week (might be from next month)
  const end = new Date(lastDay);
  end.setDate(end.getDate() + (6 - end.getDay()));

  // Create session map
  const sessionMap = new Map();
  props.quizHistory.forEach(quiz => {
    const date = new Date(quiz.date);
    const dateKey = date.toISOString().split('T')[0];
    const sessions = sessionMap.get(dateKey) || new Set();
    sessions.add(date.getTime());
    sessionMap.set(dateKey, sessions);
  });

  // Generate calendar weeks
  const weeks = [];
  let currentWeek = [];
  const current = new Date(start);

  while (current <= end) {
    const dateKey = current.toISOString().split('T')[0];
    const sessions = sessionMap.get(dateKey)?.size || 0;
    
    currentWeek.push({
      date: new Date(current),
      dayNumber: current.getDate(),
      currentMonth: current.getMonth() === currentDate.value.getMonth(),
      sessions,
      activity: sessions > 0,
      activityLevel: sessions > 0 ? Math.min(sessions, 4) : 0,
      tooltip: `${formatDate(current)}${sessions > 0 ? ` - ${sessions} session${sessions > 1 ? 's' : ''}` : ''}`
    });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);
  }

  return weeks;
});

// Computed statistics
const averageScore = computed(() => {
  if (props.quizHistory.length === 0) return 0;
  const total = props.quizHistory.reduce((sum, quiz) => sum + quiz.actualScore * 100, 0);
  return Math.round(total / props.quizHistory.length);
});

const bestScore = computed(() => {
  if (props.quizHistory.length === 0) return 0;
  const best = Math.max(...props.quizHistory.map(quiz => quiz.actualScore * 100));
  return Math.round(best);
});

const totalQuestions = computed(() => {
  return props.quizHistory.reduce((sum, quiz) => sum + quiz.questionCount, 0);
});

// Calendar data
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// Helper function to format dates
const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};
</script>

<style scoped>
.study-stats {
  padding: 2rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.stat-card {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card h3 {
  color: #666;
  font-size: 1rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2196F3;
}

/* Activity Calendar Styles */
.activity-calendar {
  margin: 3rem 0;
  padding: 1.5rem;
  background-color: #f8f9fa;
  border-radius: 12px;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.calendar-nav {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.nav-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  background-color: white;
  color: #24292e;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background-color: #f6f8fa;
  border-color: #d1d5da;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.today-btn {
  background-color: #2196F3;
  color: white;
  border-color: #2196F3;
}

.today-btn:hover:not(:disabled) {
  background-color: #1976D2;
  border-color: #1976D2;
}

.nav-arrow {
  font-size: 1.2rem;
  line-height: 1;
}

.calendar-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 4px;
  margin: 1rem 0;
}

.calendar-table th {
  padding: 0.5rem;
  text-align: center;
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.calendar-cell {
  position: relative;
  height: 80px;
  background-color: #ebedf0;
  border-radius: 8px;
  padding: 0.5rem;
  vertical-align: top;
  transition: transform 0.2s;
}

.calendar-cell:hover {
  transform: scale(1.02);
}

.calendar-cell.other-month {
  opacity: 0.5;
}

.calendar-cell.today {
  box-shadow: 0 0 0 2px #2196F3;
}

.day-number {
  font-size: 1.1rem;
  font-weight: 500;
  color: #333;
}

.session-count {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.7);
}

.calendar-cell.activity-1 { 
  background-color: rgba(76, 175, 80, 0.2);
}

.calendar-cell.activity-2 { 
  background-color: rgba(76, 175, 80, 0.4);
}

.calendar-cell.activity-3 { 
  background-color: rgba(76, 175, 80, 0.6);
}

.calendar-cell.activity-4 { 
  background-color: rgba(76, 175, 80, 0.8);
}

.calendar-cell.has-activity .day-number {
  color: #333;
}

.calendar-cell.has-activity .session-count {
  color: #333;
  font-size: 0.8rem;
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-weight: 500;
}

.calendar-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 1rem;
}

.legend-squares {
  display: flex;
  gap: 4px;
}

.legend-square {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: #ebedf0;
  border: 1px solid rgba(27, 31, 35, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #333;
}

.legend-square.activity-1 { 
  background-color: rgba(76, 175, 80, 0.2);
}

.legend-square.activity-2 { 
  background-color: rgba(76, 175, 80, 0.4);
}

.legend-square.activity-3 { 
  background-color: rgba(76, 175, 80, 0.6);
}

.legend-square.activity-4 { 
  background-color: rgba(76, 175, 80, 0.8);
}

.month-indicator {
  font-size: 1.2rem;
  font-weight: 600;
  color: #24292e;
}

.current-month-text {
  color: #2196F3;
}
</style> 