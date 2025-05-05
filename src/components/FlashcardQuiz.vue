<template>
  <div class="flashcard-quiz">
    <div v-if="questions.length === 0">
      <h2>No questions generated.</h2>
      <p>Try uploading a different file or check your file content.</p>
      <button @click="goBackToMain">Go Back to Main Screen</button>
    </div>
    <div v-else-if="!quizComplete">
      <div class="question-card">
        <h2>Question {{ currentIndex + 1 }} of {{ questions.length }}</h2>
        <p class="question-text">{{ currentQuestion.text }}</p>
        <div class="options">
          <button
            v-for="(option, idx) in currentQuestion.options"
            :key="idx"
            :disabled="answered"
            :class="{
              correct: answered && normalizeLetter(option.letter) === normalizeLetter(currentQuestion.answer) && normalizeLetter(selected) === normalizeLetter(option.letter),
              wrong: answered && normalizeLetter(selected) === normalizeLetter(option.letter) && normalizeLetter(option.letter) !== normalizeLetter(currentQuestion.answer)
            }"
            @click="selectOption(option.letter)"
          >
            {{ option.letter }}) {{ option.text }}
          </button>
        </div>
        <div v-if="answered" class="feedback">
          <span v-if="normalizeLetter(selected) === normalizeLetter(currentQuestion.answer)" class="correct">Correct!</span>
          <span v-else class="wrong">Wrong! Correct answer: {{ currentQuestion.answer }}</span>
        </div>
        <button v-if="answered && currentIndex < questions.length - 1" @click="nextQuestion" class="next-btn">Next</button>
        <button v-if="answered && currentIndex === questions.length - 1" @click="finishQuiz" class="finish-btn">Finish</button>
      </div>
    </div>
    <div v-else>
      <QuizResults
        :questions="questions"
        :user-answers="userAnswers"
        :score="score"
        @restart="restartQuiz"
        @go-back="goBackToMain"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import QuizResults from './QuizResults.vue';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['go-back']);

const currentIndex = ref(0);
const selected = ref(null);
const answered = ref(false);
const score = ref(0);
const quizComplete = ref(false);
const userAnswers = ref([]);

const currentQuestion = computed(() => props.questions[currentIndex.value]);

function selectOption(letter) {
  if (answered.value) return;
  selected.value = letter;
  answered.value = true;
  userAnswers.value[currentIndex.value] = letter;
  if (normalizeLetter(letter) === normalizeLetter(currentQuestion.value.answer)) {
    score.value++;
  }
}

function normalizeLetter(letter) {
  return String(letter).replace(/[)\s]/g, '').toUpperCase();
}

function nextQuestion() {
  currentIndex.value++;
  selected.value = null;
  answered.value = false;
}

function finishQuiz() {
  quizComplete.value = true;
}

function restartQuiz() {
  currentIndex.value = 0;
  selected.value = null;
  answered.value = false;
  score.value = 0;
  quizComplete.value = false;
  userAnswers.value = [];
}

function goBackToMain() {
  emit('go-back');
}
</script>

<style scoped>
.flashcard-quiz {
  max-width: 500px;
  margin: 2rem auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 2rem;
  text-align: center;
}
.question-card {
  margin-bottom: 1rem;
}
.question-text {
  font-size: 1.2rem;
  margin-bottom: 1rem;
}
.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.options button {
  padding: 0.7rem 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #f8f8f8;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}
.options button.correct {
  background: #c8f7c5;
  border-color: #27ae60;
}
.options button.wrong {
  background: #f7c5c5;
  border-color: #e74c3c;
}
.feedback {
  margin-bottom: 1rem;
  font-weight: bold;
}
.correct {
  color: #27ae60;
}
.wrong {
  color: #e74c3c;
}
.next-btn, .finish-btn {
  padding: 0.7rem 2rem;
  background: #4CAF50;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}
.next-btn:hover, .finish-btn:hover {
  background: #388e3c;
}
</style> 