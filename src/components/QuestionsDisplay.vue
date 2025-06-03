<template>
  <div class="questions-display">
    <h2>Generated Questions</h2>
    <div v-if="questions.length === 0">
      <h2>No questions generated.</h2>
      <p>Try uploading a different file or check your file content.</p>
      <button @click="goBackToMain">Go Back to Main Screen</button>
    </div>
    <div v-else-if="!quizComplete">
      <div class="questions-container">
        <div v-for="(question, index) in questions" :key="index" class="question-card">
          <div class="question">
            <span class="question-number">{{ index + 1 }}.</span>
            <p>{{ question }}</p>
          </div>
          <div class="answer-section">
            <textarea
              v-model="answers[index]"
              :placeholder="'Type your answer for question ' + (index + 1)"
              rows="3"
              class="answer-input"
            ></textarea>
          </div>
        </div>
      </div>
      <div class="actions">
        <button @click="handleSubmit" class="submit-answers-btn">Submit Answers</button>
      </div>
    </div>
    <div v-else>
      <!-- ...existing quiz complete code... -->
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { extractPdfText } from '../algorithms/text-extraction';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  quizComplete: {
    type: Boolean,
    default: false
  },
  goBackToMain: {
    type: Function,
    required: true
  }
});

const answers = ref([]);
const emit = defineEmits(['submit-answers']);

// Initialize answers array with empty strings
answers.value = Array(props.questions.length).fill('');

const handleSubmit = () => {
  emit('submit-answers', answers.value);
};
</script>

<style scoped>
.questions-display {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 8px;
}

h2 {
  color: #333;
  margin-bottom: 1.5rem;
  text-align: center;
}

.questions-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  background-color: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: bold;
  color: #4CAF50;
}

.answer-section {
  margin-top: 1rem;
}

.answer-input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
}

.answer-input:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.actions {
  margin-top: 2rem;
  text-align: center;
}

.submit-answers-btn {
  padding: 0.8rem 2rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-answers-btn:hover {
  background-color: #45a049;
}
</style> 