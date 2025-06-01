<template>
  <div class="calendar-container">
    <div class="months-grid">
      <div v-for="month in monthsData" :key="month.name" class="month-card">
        <div class="month-title">{{ month.name }}</div>
        <div class="calendar-grid">
          <div class="weekday-header">
            <div v-for="day in weekdays" :key="day" class="weekday">
              {{ day.charAt(0) }}
            </div>
          </div>
          <div class="days-grid">
            <div v-for="(day, index) in month.days" 
              :key="index"
              class="day-cell"
              :class="getDayClass(day)"
              :title="getDayTooltip(day)"
            >
              <span class="date-number">{{ day.date ? day.date.getDate() : '' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="legend">
      <span>Less</span>
      <div class="legend-item empty"></div>
      <div class="legend-item activity-low"></div>
      <div class="legend-item activity-medium"></div>
      <div class="legend-item activity-high"></div>
      <span>More</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  activities: {
    type: Object,
    required: true,
    default: () => {}
  }
});

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const monthsData = computed(() => {
  const currentYear = new Date().getFullYear();
  
  return monthNames.map((name, monthIndex) => {
    // Create a date for the first day of the month
    const firstDay = new Date(currentYear, monthIndex, 1);
    // Create a date for the last day of the month
    const lastDay = new Date(currentYear, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayIndex = firstDay.getDay();
    
    // Create array for all days in the month
    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayIndex; i++) {
      days.push({ date: null });
    }
    
    // Add only the days that belong to this month
    for (let date = 1; date <= daysInMonth; date++) {
      const currentDate = new Date(currentYear, monthIndex, date);
      // Ensure we're not crossing month boundaries
      if (currentDate.getMonth() === monthIndex) {
        currentDate.setUTCHours(12, 0, 0, 0);
        const dateStr = currentDate.toISOString().split('T')[0];
        const count = props.activities[dateStr] || 0;
        
        days.push({
          date: currentDate,
          count: count,
          isCurrentMonth: true
        });
      }
    }
    
    // Fill remaining cells in the last week with null dates
    const totalCells = Math.ceil((startingDayIndex + daysInMonth) / 7) * 7;
    while (days.length < totalCells) {
      days.push({ date: null });
    }
    
    return {
      name,
      days
    };
  });
});

const getDayClass = (day) => {
  if (!day.date) return 'empty-day';
  
  const classes = ['has-date'];
  
  if (day.count > 0) {
    classes.push('has-activity');
    if (day.count <= 2) classes.push('activity-low');
    else if (day.count <= 5) classes.push('activity-medium');
    else classes.push('activity-high');
  }
  
  // Compare dates using UTC noon to avoid timezone issues
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);
  const dayDate = new Date(day.date);
  dayDate.setUTCHours(12, 0, 0, 0);
  if (dayDate.toISOString().split('T')[0] === today.toISOString().split('T')[0]) {
    classes.push('today');
  }
  
  return classes;
};

const getDayTooltip = (day) => {
  if (!day.date) return '';
  const dateStr = day.date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  return day.count > 0
    ? `${dateStr}: ${day.count} activities`
    : dateStr;
};
</script>

<style scoped>
.calendar-container {
  padding: 0.5rem;
  width: 100%;
  margin: 0 auto;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.month-card {
  background: #ffffff;
  padding: 0.5rem;
}

.month-title {
  margin: 0 0 0.25rem;
  font-size: 0.8rem;
  color: #57606a;
  text-align: center;
  font-weight: 500;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 0.65rem;
  color: #57606a;
  margin-bottom: 0.15rem;
}

.weekday {
  padding: 0.1rem;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  border: 1px solid #e1e4e8;
  border-radius: 2px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #ffffff;
  border-right: 1px solid #e1e4e8;
  border-bottom: 1px solid #e1e4e8;
}

.day-cell:nth-child(7n) {
  border-right: none;
}

.day-cell:nth-last-child(-n+7) {
  border-bottom: none;
}

.day-cell.empty-day {
  background: transparent;
  border: none;
}

.date-number {
  font-size: 0.65rem;
  color: #57606a;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.day-cell.has-activity {
  color: #57606a;
}

.day-cell.activity-low {
  background-color: #e6ffec;
}

.day-cell.activity-medium {
  background-color: #9be9a8;
}

.day-cell.activity-high {
  background-color: #40c463;
}

.day-cell.today {
  position: relative;
}

.day-cell.today::after {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border: 1px solid #0969da;
  border-radius: 1px;
  pointer-events: none;
  z-index: 1;
}

.legend {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: center;
  font-size: 0.7rem;
  color: #57606a;
  padding: 0.5rem;
  margin-top: 0.5rem;
}

.legend-item {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend-item.empty {
  background-color: #ffffff;
  border: 1px solid #e1e4e8;
}

.legend-item.activity-low {
  background-color: #e6ffec;
}

.legend-item.activity-medium {
  background-color: #9be9a8;
}

.legend-item.activity-high {
  background-color: #40c463;
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.other-month .date-number {
  color: #999;
}

@media (max-width: 1200px) {
  .months-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .months-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .month-title {
    font-size: 0.7rem;
  }
  
  .date-number {
    font-size: 0.6rem;
  }
}
</style> 