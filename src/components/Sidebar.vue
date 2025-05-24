<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <button class="create-quiz-btn" @click="$emit('create-quiz')">
        <span class="plus-icon">+</span>
        Create New Quiz
      </button>
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
             @click="$emit('retake-quiz', quiz)"
             role="button"
             tabindex="0"
             @keyup.enter="$emit('retake-quiz', quiz)">
          <div class="score-section">
            <div class="score-badge" :class="getScoreClass(quiz.actualScore)">
              {{ quiz.actualScore }}%
            </div>
            <div class="predicted-score">
              Predicted: {{ quiz.predictedScore }}%
            </div>
          </div>
          <div class="quiz-info">
            <h4>{{ quiz.fileName }}</h4>
            <div class="quiz-details">
              <span class="questions">{{ quiz.questionCount }} questions</span>
              <span class="date">{{ formatDate(quiz.date) }}</span>
            </div>
          </div>
          <div class="retake-hint">
            <span>Click to retake quiz</span>
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
defineProps({
  quizHistory: {
    type: Array,
    default: () => []
  }
});

defineEmits(['create-quiz', 'retake-quiz', 'clear-history']);

const getScoreClass = (score) => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'average';
  return 'needs-improvement';
};

const formatDate = (date) => {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return 'Today, ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days} days ago`;
  } else {
    return d.toLocaleDateString();
  }
};
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
}

.create-quiz-btn {
  width: 100%;
  padding: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.create-quiz-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

.plus-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.quiz-history {
  flex: 1;
}

.quiz-history h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

.history-item:hover .retake-hint {
  opacity: 1;
}

.retake-hint {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(76, 175, 80, 0.9);
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

.score-badge.excellent {
  background-color: #e8f5e9;
  color: #2e7d32;
  border: 2px solid #4caf50;
}

.score-badge.good {
  background-color: #e3f2fd;
  color: #1565c0;
  border: 2px solid #2196f3;
}

.score-badge.average {
  background-color: #fff3e0;
  color: #ef6c00;
  border: 2px solid #ff9800;
}

.score-badge.needs-improvement {
  background-color: #ffebee;
  color: #c62828;
  border: 2px solid #f44336;
}

.quiz-info {
  flex: 1;
}

.quiz-info h4 {
  margin: 0;
  color: #333;
  font-size: 0.95rem;
}

.date {
  font-size: 0.8rem;
  color: #666;
  display: block;
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
  background: #fff;
  border-radius: 8px;
  border: 2px dashed #e0e0e0;
}

.empty-state p {
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.empty-state small {
  color: #888;
}

.score-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.predicted-score {
  font-size: 0.7rem;
  color: #666;
  text-align: center;
}

.quiz-details {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.25rem;
}

.questions {
  color: #4CAF50;
  font-weight: 500;
}

.clear-history-container {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  background: linear-gradient(transparent, #f8f9fa 50%);
  text-align: center;
  margin-top: auto;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #666;
  padding: 0.75rem;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: auto;
  margin: 0 auto;
  transition: all 0.2s ease;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.clear-history-btn:hover {
  color: #ff4444;
  transform: translateY(-1px);
}

.trash-icon {
  font-size: 1.1rem;
}
</style> 