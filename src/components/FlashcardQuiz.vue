<template>
  <div class="quiz-container">
    <div v-if="getCurrentQuestion" class="quiz-content">
      <div class="quiz-progress">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${(currentQuestionIndex + 1) * 100 / totalQuestions}%` }"
          ></div>
        </div>
        <span class="progress-text">Question {{ currentQuestionIndex + 1 }} of {{ totalQuestions }}</span>
      </div>
      
      <div class="question-item">
        <h3>{{ getCurrentQuestion.text }}</h3>
        <div v-if="getCurrentQuestion.type === 'multiple-choice'" class="options">
          <button 
            v-for="(option, letter) in getCurrentQuestion.options" 
            :key="letter"
            class="option-btn"
            :class="{ 
              'selected': currentAnswer === letter,
              'correct': showFeedback && letter === getCurrentQuestion.correctAnswer,
              'incorrect': showFeedback && currentAnswer === letter && letter !== getCurrentQuestion.correctAnswer
            }"
            @click="submitAnswer(letter)"
            :disabled="showFeedback"
          >
            <span class="option-letter">{{ letter }}</span>
            <span class="option-text">{{ option }}</span>
          </button>
        </div>
        <div v-else-if="getCurrentQuestion.type === 'true-false'" class="options true-false">
          <button 
            v-for="(text, value) in { true: 'True', false: 'False' }" 
            :key="value"
            class="option-btn"
            :class="{ 
              'selected': currentAnswer === value,
              'correct': showFeedback && value === getCurrentQuestion.correctAnswer,
              'incorrect': showFeedback && currentAnswer === value && value !== getCurrentQuestion.correctAnswer
            }"
            @click="submitAnswer(value)"
            :disabled="showFeedback"
          >
            {{ text }}
          </button>
        </div>

        <div v-if="showFeedback" class="feedback">
          <p :class="{ 'correct-text': isAnswerCorrect, 'incorrect-text': !isAnswerCorrect }">
            {{ isAnswerCorrect ? 'Correct!' : 'Incorrect!' }}
          </p>
          <button class="next-btn" @click="moveToNext">
            {{ currentQuestionIndex + 1 >= totalQuestions ? 'See Results' : 'Next Question' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['quiz-completed', 'update-question']);

const currentQuestionIndex = ref(0);
const currentAnswer = ref(null);
const showFeedback = ref(false);
const isAnswerCorrect = ref(false);
const userResponses = ref([]);

const getCurrentQuestion = computed(() => {
  return props.questions[currentQuestionIndex.value];
});

const totalQuestions = computed(() => props.totalQuestions);

const submitAnswer = (answer) => {
  if (showFeedback.value) return;
  
  currentAnswer.value = answer;
  const question = getCurrentQuestion.value;
  
  let rawScore;
  if (question.type === 'true-false') {
    const userAnswer = String(answer).toLowerCase();
    const correctAnswer = String(question.correctAnswer).toLowerCase();
    rawScore = userAnswer === correctAnswer;
  } else {
    rawScore = String(answer) === String(question.correctAnswer);
  }
  
  isAnswerCorrect.value = rawScore;
  showFeedback.value = true;

  // Record the response with difficulty information
  const response = {
    questionId: getCurrentQuestion.value.id,
    userAnswer: answer,
    correct: isAnswerCorrect.value,
    timestamp: new Date().toISOString(),
    difficulty: getCurrentQuestion.value.difficulty // Include current difficulty
  };
  
  userResponses.value.push(response);
  
  // Emit update for adaptive difficulty
  emit('update-question', {
    ...getCurrentQuestion.value,
    userAnswer: answer,
    correct: isAnswerCorrect.value
  });
};

const moveToNext = () => {
  if (currentQuestionIndex.value + 1 >= totalQuestions.value) {
    // Quiz is complete, emit the final results
    emit('quiz-completed', userResponses.value);
  } else {
    // Move to next question
    currentQuestionIndex.value++;
    currentAnswer.value = null;
    showFeedback.value = false;
    isAnswerCorrect.value = false;
  }
};
</script>

<style scoped>
.quiz-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.quiz-content {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.quiz-progress {
  margin-bottom: 2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
}

.progress-text {
  display: block;
  text-align: center;
  color: #666;
  font-size: 0.9rem;
}

.question-item {
  margin-top: 1.5rem;
}

.question-item h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.4;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 1.5rem 0;
}

.options.true-false {
  flex-direction: row;
  justify-content: center;
  gap: 1.5rem;
}

.option-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  color: #333;
  cursor: pointer;
  font-size: 1rem;
  text-align: left;
  transition: all 0.2s ease;
}

.options.true-false .option-btn {
  width: auto;
  min-width: 120px;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 500;
}

.option-letter {
  background-color: #f5f5f5;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-right: 1rem;
  font-weight: 600;
}

.option-text {
  flex: 1;
}

.option-btn:hover:not(:disabled) {
  border-color: #2196F3;
  background-color: #f8f9fa;
}

.option-btn.selected {
  border-color: #2196F3;
  background-color: #e3f2fd;
}

.option-btn.correct {
  border-color: #4CAF50;
  background-color: #E8F5E9;
  color: #2E7D32;
}

.option-btn.incorrect {
  border-color: #f44336;
  background-color: #FFEBEE;
  color: #c62828;
}

.feedback {
  margin-top: 1.5rem;
  text-align: center;
}

.correct-text {
  color: #4CAF50;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}

.incorrect-text {
  color: #f44336;
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}

.next-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 25px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.next-btn:hover {
  background-color: #1976D2;
  transform: translateY(-1px);
}
</style> 