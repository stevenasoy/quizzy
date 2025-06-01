<template>
  <div class="quiz-history">
    <div v-if="user" class="history-container">
      <h2>Your Quiz History</h2>
      <div v-if="isLoading" class="loading">
        Loading your quiz history...
      </div>
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      <div v-else-if="quizzes.length === 0" class="empty-state">
        <p>You haven't taken any quizzes yet.</p>
        <button @click="$emit('start-quiz')" class="start-quiz-btn">
          Start Your First Quiz
        </button>
      </div>
      <div v-else class="quiz-list">
        <div v-for="quiz in quizzes" :key="quiz.id" class="quiz-item">
          <div class="quiz-header">
            <h3>{{ quiz.topic || 'General Quiz' }}</h3>
            <span class="date">{{ formatDate(quiz.created_at) }}</span>
          </div>
          <div class="quiz-stats">
            <span class="score">Score: {{ quiz.score }}%</span>
            <span class="questions">Questions: {{ quiz.total_questions }}</span>
            <span class="time">Time: {{ formatDuration(quiz.duration) }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="login-prompt">
      <div class="prompt-content">
        <h3>Want to Track Your Progress?</h3>
        <p>Log in to save your quiz history and track your improvement over time!</p>
        <button @click="$emit('showLogin')" class="login-btn">
          Login / Sign Up
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useQuizHistory } from '../composables/useQuizHistory';

const { user } = useAuth();
const { quizHistory, fetchQuizzes } = useQuizHistory();

const quizzes = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Load quizzes when component mounts or user changes
const loadQuizzes = async () => {
  if (!user.value) {
    quizzes.value = [];
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const { data, error: fetchError } = await fetchQuizzes();
    if (fetchError) throw fetchError;
    quizzes.value = data || [];
  } catch (err) {
    console.error('Error fetching quiz history:', err);
    error.value = 'Failed to load quiz history. Please try again later.';
  } finally {
    isLoading.value = false;
  }
};

// Watch for user changes
watch(() => user.value, (newUser) => {
  if (newUser) {
    loadQuizzes();
  } else {
    quizzes.value = [];
  }
});

onMounted(() => {
  if (user.value) {
    loadQuizzes();
  }
});

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

defineEmits(['showLogin', 'start-quiz']);
</script>

<style scoped>
.quiz-history {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.history-container h2 {
  color: #333;
  margin-bottom: 2rem;
  text-align: center;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.error {
  color: #f44336;
  background-color: #ffebee;
  border-radius: 8px;
}

.quiz-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.quiz-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.quiz-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.date {
  color: #666;
  font-size: 0.9rem;
}

.quiz-stats {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.score {
  color: #4caf50;
  font-weight: 600;
}

.login-prompt {
  text-align: center;
  padding: 3rem;
  background: #f5f5f5;
  border-radius: 12px;
  margin: 2rem 0;
}

.prompt-content {
  max-width: 400px;
  margin: 0 auto;
}

.prompt-content h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.prompt-content p {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.login-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-btn:hover {
  background-color: #1976D2;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.start-quiz-btn {
  margin-top: 1rem;
  padding: 0.8rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

.start-quiz-btn:hover {
  background-color: #45a049;
}
</style> 