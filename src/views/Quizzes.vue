<template>
  <div class="quizzes">
    <div class="header">
      <h1>Your Quizzes</h1>
      <router-link to="/create" class="create-btn">
        + Create New Quiz
      </router-link>
    </div>

    <div class="quiz-list" v-if="quizHistory.length > 0">
      <div v-for="(quiz, index) in quizHistory" :key="index" class="quiz-card">
        <div class="quiz-info">
          <h3>{{ quiz.fileName }}</h3>
          <div class="quiz-stats">
            <span class="stat">
              <i class="fas fa-question-circle"></i>
              {{ quiz.questionCount }} Questions
            </span>
            <span class="stat">
              <i class="fas fa-chart-line"></i>
              Score: {{ quiz.actualScore }}%
            </span>
            <span class="stat">
              <i class="fas fa-calendar"></i>
              {{ new Date(quiz.date).toLocaleDateString() }}
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const quizHistory = ref([]);

onMounted(() => {
  const savedHistory = localStorage.getItem('quizHistory');
  if (savedHistory) {
    quizHistory.value = JSON.parse(savedHistory);
  }
});

const retakeQuiz = (quiz) => {
  // Store the quiz to retake in localStorage
  localStorage.setItem('quizToRetake', JSON.stringify(quiz));
  router.push('/create');
};

const viewDetails = (quiz) => {
  // Store the selected quiz in localStorage
  localStorage.setItem('selectedQuiz', JSON.stringify(quiz));
  router.push('/');
};
</script>

<style scoped>
.quizzes {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h1 {
  color: #333;
  margin: 0;
}

.create-btn {
  display: inline-block;
  padding: 0.8rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.create-btn:hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.quiz-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.quiz-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.quiz-card:hover {
  transform: translateY(-4px);
}

.quiz-info h3 {
  margin: 0 0 1rem 0;
  color: #333;
}

.quiz-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

.quiz-actions {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 0.8rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.action-btn.retake {
  background-color: #2196F3;
  color: white;
}

.action-btn.view {
  background-color: #f5f5f5;
  color: #333;
}

.action-btn:hover {
  opacity: 0.9;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}
</style> 