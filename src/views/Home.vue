<template>
  <div class="home">
    <h1>Welcome to QUIZZy</h1>
    <div class="stats-overview">
      <StudyStats />
    </div>
    <div class="actions">
      <router-link to="/create" class="action-btn create">
        Create New Quiz
      </router-link>
      <router-link to="/quizzes" class="action-btn browse">
        Browse Quizzes
      </router-link>
    </div>
  </div>
</template>

<script setup>
import StudyStats from '../components/StudyStats.vue';
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 3rem;
  color: #2196F3;
  margin-bottom: 2rem;
}

.stats-overview {
  margin: 2rem 0;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 3rem;
}

.action-btn {
  display: inline-block;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.2rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.action-btn.create {
  background-color: #4CAF50;
  color: white;
}

.action-btn.browse {
  background-color: #2196F3;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style> 