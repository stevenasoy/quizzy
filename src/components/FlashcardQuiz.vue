<template>
  <div class="flashcard-quiz">
    <div v-if="!showResults" class="quiz-content">
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${(currentIndex + 1) / questions.length * 100}%` }"></div>
      </div>
      
      <div class="question-counter">
        Question {{ currentIndex + 1 }} of {{ questions.length }}
      </div>

      <div class="flashcard">
        <div class="question">
          {{ currentQuestion.text }}
        </div>

        <div class="options">
          <button
            v-for="option in currentQuestion.options"
            :key="option.letter"
            class="option-btn"
            :class="{
              'selected': selectedAnswer === option.letter,
              'correct': showAnswer && option.letter === currentQuestion.answer,
              'incorrect': showAnswer && selectedAnswer === option.letter && option.letter !== currentQuestion.answer
            }"
            @click="selectAnswer(option.letter)"
            :disabled="showAnswer"
          >
            {{ option.letter }}) {{ option.text }}
          </button>
        </div>

        <div v-if="showAnswer" class="explanation">
          <p class="feedback" :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
            {{ isCorrect ? 'Correct!' : 'Incorrect!' }}
          </p>
          <p>{{ currentQuestion.explanation }}</p>
        </div>

        <button 
          v-if="showAnswer"
          class="next-btn"
          @click="nextQuestion"
        >
          {{ isLastQuestion ? 'Finish Quiz' : 'Next Question' }}
        </button>
      </div>
    </div>

    <div v-else class="quiz-results">
      <h2>Quiz Results</h2>
      <div class="score">
        <p>Your Score: {{ score }} out of {{ questions.length }}</p>
        <p>Percentage: {{ Math.round((score / questions.length) * 100) }}%</p>
      </div>
      <button class="restart-btn" @click="restartQuiz">Try Again</button>
      <button class="back-btn" @click="goBack">Back to Upload</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['go-back']);

const currentIndex = ref(0);
const selectedAnswer = ref(null);
const showAnswer = ref(false);
const showResults = ref(false);
const score = ref(0);
const userAnswers = ref([]);

const currentQuestion = computed(() => props.questions[currentIndex.value]);

const isLastQuestion = computed(() => currentIndex.value === props.questions.length - 1);

const isCorrect = computed(() => selectedAnswer.value === currentQuestion.value.answer);

const selectAnswer = (answer) => {
  if (showAnswer.value) return;
  selectedAnswer.value = answer;
  showAnswer.value = true;
  if (isCorrect.value) {
    score.value++;
  }
  userAnswers.value[currentIndex.value] = {
    question: currentQuestion.value.text,
    userAnswer: answer,
    correctAnswer: currentQuestion.value.answer,
    isCorrect: isCorrect.value
  };
};

const nextQuestion = () => {
  if (isLastQuestion.value) {
    showResults.value = true;
  } else {
    currentIndex.value++;
    selectedAnswer.value = null;
    showAnswer.value = false;
  }
};

const restartQuiz = () => {
  currentIndex.value = 0;
  selectedAnswer.value = null;
  showAnswer.value = false;
  showResults.value = false;
  score.value = 0;
  userAnswers.value = [];
};

const goBack = () => {
  emit('go-back');
};
</script>

<style scoped>
.flashcard-quiz {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.quiz-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 20px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.question-counter {
  text-align: center;
  margin-bottom: 20px;
  color: #666;
}

.flashcard {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.question {
  font-size: 1.2em;
  margin-bottom: 20px;
  color: #333;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.option-btn {
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  font-size: 1em;
}

.option-btn:hover:not(:disabled) {
  border-color: #4CAF50;
  background: #f8f8f8;
}

.option-btn.selected {
  border-color: #4CAF50;
  background: #f0f8f0;
}

.option-btn.correct {
  border-color: #4CAF50;
  background: #e8f5e9;
}

.option-btn.incorrect {
  border-color: #f44336;
  background: #ffebee;
}

.option-btn:disabled {
  cursor: default;
  opacity: 0.8;
}

.explanation {
  margin-top: 20px;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 6px;
}

.feedback {
  font-weight: bold;
  margin-bottom: 10px;
}

.feedback.correct {
  color: #4CAF50;
}

.feedback.incorrect {
  color: #f44336;
}

.next-btn {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  margin-top: 20px;
  transition: background 0.2s;
}

.next-btn:hover {
  background: #45a049;
}

.quiz-results {
  text-align: center;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quiz-results h2 {
  color: #333;
  margin-bottom: 20px;
}

.score {
  font-size: 1.2em;
  margin-bottom: 30px;
}

.score p {
  margin: 10px 0;
  color: #666;
}

.restart-btn, .back-btn {
  padding: 12px 24px;
  margin: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1em;
  transition: background 0.2s;
}

.restart-btn {
  background: #4CAF50;
  color: white;
}

.restart-btn:hover {
  background: #45a049;
}

.back-btn {
  background: #f0f0f0;
  color: #333;
}

.back-btn:hover {
  background: #e0e0e0;
}
</style> 