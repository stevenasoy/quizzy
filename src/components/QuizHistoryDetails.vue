<template>
  <div class="quiz-history-details">
    <div class="header">
      <h2>Quiz Results</h2>
      <div class="file-info">
        <span class="file-name">{{ quiz.fileName }}</span>
        <span class="date">{{ formatDate(quiz.date) }}</span>
      </div>
    </div>

    <div class="scores-container">
      <div class="score-card actual">
        <div class="score-circle" :class="getScoreClass(quiz.actualScore)">
          <span class="score-value">{{ quiz.actualScore }}%</span>
        </div>
        <span class="score-label">Your Score</span>
      </div>
      
      <div class="score-card predicted">
        <div class="score-circle" :class="getPredictedScoreClass(quiz.predictedScore)">
          <span class="score-value">{{ quiz.predictedScore }}%</span>
        </div>
        <span class="score-label">Predicted Score</span>
      </div>
    </div>

    <div class="quiz-stats">
      <div class="stat-item">
        <span class="stat-label">Questions</span>
        <span class="stat-value">{{ quiz.questionCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Performance</span>
        <span class="stat-value" :class="getPerformanceClass(quiz.actualScore, quiz.predictedScore)">
          {{ getPerformanceText(quiz.actualScore, quiz.predictedScore) }}
        </span>
      </div>
    </div>

    <button class="retake-btn" @click="$emit('retake-quiz', quiz)">
      Retake Quiz
    </button>

    <button class="back-btn" @click="$emit('close')">
      Back to History
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  quiz: {
    type: Object,
    required: true
  }
});

defineEmits(['retake-quiz', 'close']);

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  return 'needs-improvement';
};

const getPredictedScoreClass = (score) => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
};

const getPerformanceClass = (actual, predicted) => {
  if (actual > predicted + 5) return 'exceeded';
  if (actual < predicted - 5) return 'below';
  return 'met';
};

const getPerformanceText = (actual, predicted) => {
  if (actual > predicted + 5) return 'Exceeded Expectations';
  if (actual < predicted - 5) return 'Below Expectations';
  return 'Met Expectations';
};
</script>

<style scoped>
.quiz-history-details {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h2 {
  margin-bottom: 0.5rem;
  color: #333;
}

.file-info {
  color: #666;
  font-size: 0.9rem;
}

.file-name {
  font-weight: 500;
  margin-right: 1rem;
}

.scores-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.score-card {
  text-align: center;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.9rem;
  color: #666;
}

/* Score classes */
.excellent {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
  color: #2E7D32;
}

.good {
  background-color: #e3f2fd;
  border: 3px solid #2196F3;
  color: #1565C0;
}

.average {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
  color: #EF6C00;
}

.needs-improvement {
  background-color: #ffebee;
  border: 3px solid #f44336;
  color: #c62828;
}

.high {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
  color: #2E7D32;
}

.medium {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
  color: #EF6C00;
}

.low {
  background-color: #ffebee;
  border: 3px solid #f44336;
  color: #c62828;
}

.quiz-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 500;
}

.exceeded {
  color: #4CAF50;
}

.met {
  color: #2196F3;
}

.below {
  color: #f44336;
}

.retake-btn, .back-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.retake-btn {
  background-color: #4CAF50;
  color: white;
}

.retake-btn:hover {
  background-color: #45a049;
}

.back-btn {
  background-color: #f5f5f5;
  color: #333;
}

.back-btn:hover {
  background-color: #e0e0e0;
}
</style> 