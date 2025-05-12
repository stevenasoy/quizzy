<template>
    <div class="true-false-question">
      <div class="option">
        <input
          type="radio"
          :id="`q${index}-true`"
          :name="`question${index}`"
          value="true"
          v-model="selectedAnswer"
          @change="updateAnswer"
        />
        <label :for="`q${index}-true`">True</label>
        <input
          type="radio"
          :id="`q${index}-false`"
          :name="`question${index}`"
          value="false"
          v-model="selectedAnswer"
          @change="updateAnswer"
        />
        <label :for="`q${index}-false`">False</label>
      </div>
      <div v-if="showFeedback" class="feedback">
        <p :class="{ 'correct': isCorrect, 'incorrect': !isCorrect }">
          {{ isCorrect ? 'Correct!' : 'Incorrect!' }}
        </p>
        <p class="explanation">{{ explanation }}</p>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue';
  
  const props = defineProps({
    index: {
      type: Number,
      required: true
    },
    correctAnswer: {
      type: String,
      required: true
    },
    explanation: {
      type: String,
      required: true
    },
    showFeedback: {
      type: Boolean,
      default: false
    }
  });
  
  const emit = defineEmits(['update:answer']);
  
  const selectedAnswer = ref('');
  
  const isCorrect = computed(() => {
    return selectedAnswer.value === props.correctAnswer;
  });
  
  const updateAnswer = () => {
    emit('update:answer', selectedAnswer.value);
  };
  </script>
  
  <style scoped>
  .true-false-question {
    margin-bottom: 1rem;
  }
  
  .option {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin: 0.5rem 0;
  }
  
  .feedback {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background-color: #f8f8f8;
    border-radius: 4px;
  }
  
  .correct {
    color: #4CAF50;
  }
  
  .incorrect {
    color: #ff4444;
  }
  
  .explanation {
    margin-top: 0.5rem;
    margin-left: 1rem;
  }
  
  input[type="radio"] {
    margin-right: 0.5rem;
  }
  
  label {
    cursor: pointer;
  }
  </style>