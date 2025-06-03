<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>Quiz History</h2>
      <div class="header-actions">
        <button class="stats-btn" @click="$emit('view-stats')" title="View Study Statistics">
          📊 Stats
        </button>
        <button class="new-quiz-btn" @click="$emit('create-quiz')" title="Create New Quiz">
          + Create New Quiz
        </button>
      </div>
    </div>
    
    <div class="quiz-history">
      <h3>Quiz History</h3>
      <div class="history-list">
        <div v-if="quizHistory.length === 0" class="empty-state">
          <p>No quiz history yet</p>
          <small>Complete a quiz to see your performance here</small>
        </div>
        <div v-else v-for="(quiz, index) in quizHistory" 
             :key="index" 
             class="history-item"
             @click="$emit('select-quiz', quiz)"
             role="button"
             tabindex="0"
             @keyup.enter="$emit('select-quiz', quiz)">
          <div class="score-section">
            <div class="score-badge" :class="getScoreClass(quiz.actualScore * 100)">
              {{ Math.round(quiz.actualScore * 100) }}%
            </div>
            <div class="predicted-score" v-if="quiz.predictedScore !== null">
              Predicted: {{ quiz.predictedScore }}%
            </div>
          </div>
          <div class="quiz-info">
            <h4>{{ quiz.fileName || 'Untitled Quiz' }}</h4>
            <div class="quiz-details">
              <span class="questions">{{ quiz.questionCount }} questions</span>
              <span class="date">{{ formatDate(quiz.date) }}</span>
            </div>
          </div>
          <div class="view-hint">
            <span>Click to view details</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="quizHistory.length > 0" class="clear-history-container">
      <button class="clear-history-btn" @click="$emit('clear-history')">
        <span class="trash-icon">🗑️</span>
        Clear History
      </button>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { getScoreClass, formatRelativeDate } from '../algorithms/score-classification';

defineProps({
  quizHistory: {
    type: Array,
    default: () => []
  }
});

defineEmits(['create-quiz', 'retake-quiz', 'clear-history', 'select-quiz', 'view-stats']);

const formatDate = formatRelativeDate;
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  background-color: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-header {
  margin-bottom: 2rem;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-direction: column;
  margin-top: 1rem;
}

.stats-btn {
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  color: #666;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.stats-btn:hover {
  background: #e3f2fd;
  color: #2196F3;
  border-color: #2196F3;
}

.new-quiz-btn {
  padding: 0.75rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  width: 100%;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.new-quiz-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.quiz-history {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 200px); /* Reserve space for header and clear history */
}

.quiz-history h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  padding-right: 0.5rem;
  max-height: calc(100% - 3rem); /* Account for the h3 height */
}

.history-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.history-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.history-item:hover .view-hint {
  opacity: 1;
}

.view-hint {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(33, 150, 243, 0.9);
  color: white;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 0.9rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.history-item:focus {
  outline: none;
  box-shadow: 0 0 0 2px #4CAF50;
}

.score-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
}

.excellent {
  background-color: #e8f5e9;
  border: 2px solid #4CAF50;
  color: #2E7D32;
}

.good {
  background-color: #e3f2fd;
  border: 2px solid #2196F3;
  color: #1565C0;
}

.average {
  background-color: #fff3e0;
  border: 2px solid #FF9800;
  color: #EF6C00;
}

.needs-improvement {
  background-color: #ffebee;
  border: 2px solid #f44336;
  color: #c62828;
}

.quiz-info {
  flex: 1;
  min-width: 0;
}

.quiz-info h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quiz-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.predicted-score {
  font-size: 0.75rem;
  color: #666;
  text-align: center;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

.empty-state small {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  opacity: 0.7;
}

.clear-history-container {
  flex-shrink: 0;
  padding: 1rem 0;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  position: sticky;
  bottom: 0;
}

.clear-history-btn {
  width: 100%;
  padding: 1rem;
  background-color: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.clear-history-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.trash-icon {
  font-size: 0.9rem;
}
</style> 