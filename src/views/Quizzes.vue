<template>
  <div class="quizzes">
    <div class="header">
      <h1>Your Quizzes</h1>
      <router-link to="/create" class="create-btn">
        + Create New Quiz
      </router-link>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading your quiz history...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadQuizHistory" class="retry-btn">
        Retry
      </button>
    </div>

    <div v-else-if="!user" class="login-prompt">
      <div class="prompt-content">
        <h3>Want to Track Your Progress?</h3>
        <p>Log in to save your quiz history and track your improvement over time!</p>
        <button @click="$emit('showLogin')" class="login-btn">
          Login / Sign Up
        </button>
      </div>
    </div>

    <div v-else-if="quizHistory.length > 0" class="quiz-list">
      <div v-for="quiz in quizHistory" :key="quiz.id" class="quiz-card">
        <div class="quiz-info">
          <h3>{{ quiz.topic || 'Untitled Quiz' }}</h3>
          <div class="quiz-stats">
            <span class="stat">
              <i class="fas fa-question-circle"></i>
              {{ quiz.total_questions }} Questions
            </span>
            <span class="stat">
              <i class="fas fa-chart-line"></i>
              Score: {{ quiz.score }}%
            </span>
            <span class="stat">
              <i class="fas fa-calendar"></i>
              {{ new Date(quiz.created_at).toLocaleDateString() }}
            </span>
          </div>
        </div>
        <div class="quiz-actions">
          <button @click="retakeQuiz(quiz)" class="action-btn retake">
            Retake Quiz
          </button>
          <button @click="viewDetails(quiz)" class="action-btn view">
            View Details
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <p>You haven't taken any quizzes yet.</p>
      <router-link to="/create" class="create-btn">
        Create Your First Quiz
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useQuizHistory } from '../composables/useQuizHistory';

const router = useRouter();
const { user } = useAuth();
const { fetchQuizzes } = useQuizHistory();
const quizHistory = ref([]);
const isLoading = ref(false);
const error = ref(null);

// Load quiz history based on auth state
const loadQuizHistory = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    if (user.value) {
      // Load from Supabase for authenticated users
      const { data, error: fetchError } = await fetchQuizzes();
      if (fetchError) throw fetchError;
      quizHistory.value = data || [];
    } else {
      // Load from localStorage for non-authenticated users
      const savedHistory = localStorage.getItem('quizHistory');
      quizHistory.value = savedHistory ? JSON.parse(savedHistory) : [];
    }
  } catch (err) {
    console.error('Error loading quiz history:', err);
    error.value = 'Failed to load quiz history';
    quizHistory.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Watch for auth state changes
watch(() => user.value, () => {
  loadQuizHistory();
});

onMounted(() => {
  loadQuizHistory();
});

const retakeQuiz = (quiz) => {
  // Store the quiz to retake in localStorage temporarily
  localStorage.setItem('retakeQuiz', JSON.stringify(quiz));
  router.push('/create');
};

const viewDetails = (quiz) => {
  router.push({
    name: 'quiz-details',
    params: { id: quiz.id },
    state: { quiz }
  });
};
</script>

<style scoped>
.quizzes {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.loading-state,
.error-state,
.empty-state,
.login-prompt {
  text-align: center;
  padding: 3rem;
  background: #f5f5f5;
  border-radius: 12px;
  margin: 2rem 0;
}

.error-state {
  color: #f44336;
  background-color: #ffebee;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1.5rem;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-btn:hover {
  background-color: #d32f2f;
}

.quiz-list {
  display: grid;
  gap: 1rem;
}

.quiz-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.quiz-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.quiz-info h3 {
  margin: 0 0 1rem;
  color: #333;
}

.quiz-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.stat {
  color: #666;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.quiz-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.3s;
}

.action-btn.retake {
  background-color: #2196F3;
  color: white;
}

.action-btn.retake:hover {
  background-color: #1976D2;
}

.action-btn.view {
  background-color: #4CAF50;
  color: white;
}

.action-btn.view:hover {
  background-color: #388E3C;
}

.create-btn {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background-color: #2196F3;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.create-btn:hover {
  background-color: #1976D2;
}

.login-prompt {
  text-align: center;
  padding: 3rem;
  background: #f5f5f5;
  border-radius: 12px;
}

.prompt-content h3 {
  color: #333;
  margin-bottom: 1rem;
}

.prompt-content p {
  color: #666;
  margin-bottom: 2rem;
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
</style> 