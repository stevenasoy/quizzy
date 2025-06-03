<template>
  <div class="quiz-history-details">
    <div class="header">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <h2>Quiz History</h2>
      <div class="file-info">
        <span class="file-name">{{ quiz.fileName }}</span>
        <span class="date">{{ formatDate(quiz.date) }}</span>
      </div>
    </div>

    <div class="score-display" :class="getScoreClass(quiz.actualScore * 100)">
      <div class="score-value">
        <span class="score-number">{{ Math.round(quiz.actualScore * 100) }}</span>
        <span class="score-separator">/</span>
        <span class="total-questions">100</span>
      </div>
      <div class="score-percentage">({{ Math.round(quiz.actualScore * 100) }}%)</div>
    </div>

    <div class="prediction-message" :class="getScoreClass(quiz.actualScore * 100)" v-if="quiz.predictedScore !== null">
      <p>You scored <strong>{{ Math.round(quiz.actualScore * 100) }}%</strong>. 
         Predicted score was <strong>{{ quiz.predictedScore }}%</strong>.</p>
      <p class="prediction-comparison" v-if="quiz.actualScore * 100 > quiz.predictedScore">
        <strong>Excellent!</strong> You surpassed the prediction!
      </p>
    </div>

    <div class="questions-review">
      <div v-for="(question, index) in quiz.questions" :key="index" class="question-item">
        <div class="question-header">
          <h3>Question {{ index + 1 }}</h3>
          <div class="status-indicator" :class="question.isCorrect ? 'correct' : 'incorrect'">
            {{ question.isCorrect ? '✓' : 'X' }}
          </div>
        </div>
        
        <p class="question-text">{{ question.text }}</p>
        
        <div class="answers-container">
          <div class="answer-box">
            <div class="answer-label">YOUR ANSWER:</div>
            <div class="answer-content" :class="{ 'incorrect': !question.isCorrect }">
              <strong>{{ formatAnswer(question.userAnswer, question) }}</strong>
            </div>
          </div>

          <div class="answer-box">
            <div class="answer-label">CORRECT ANSWER:</div>
            <div class="answer-content correct">
              <strong>{{ formatAnswer(question.correctAnswer, question) }}</strong>
            </div>
          </div>
        </div>
        
        <div class="explanation" v-if="question.explanation">
          <div class="explanation-label">EXPLANATION:</div>
          <div class="explanation-text" :class="{ 'correct-highlight': question.isCorrect, 'incorrect-highlight': !question.isCorrect }">
            {{ question.explanation }}
          </div>
        </div>
      </div>
    </div>

    <div class="actions">
      <button class="retake-btn" @click="$emit('retake-quiz', quiz)">Retake Quiz</button>
      <button class="close-btn-bottom" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { getScoreClass } from '../algorithms/answer-formatting';

defineProps({
  quiz: {
    type: Object,
    required: true
  }
});

defineEmits(['retake-quiz', 'close']);

const formatDate = (date) => {
  return new Date(date).toLocaleString();
};

const formatAnswer = (answer, question) => {
  if (!answer && answer !== false) return 'Not answered';
  
  if (question.type === 'multiple-choice' && question.options) {
    return `${answer}) ${question.options[answer]}`;
  } else if (question.type === 'true-false') {
    return String(answer).charAt(0).toUpperCase() + String(answer).slice(1);
  }
  return answer;
};
</script>

<style scoped>
.quiz-history-details {
  max-width: 800px;
  margin: 2rem auto;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  font-family: "Helvetica", "Arial", sans-serif;
  position: relative;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.file-info {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.file-name {
  font-weight: 500;
  margin-right: 1rem;
}

.score-display {
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.score-display.excellent {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
}

.score-display.good {
  background-color: #e3f2fd;
  border: 3px solid #2196F3;
}

.score-display.average {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
}

.score-display.needs-improvement {
  background-color: #ffebee;
  border: 3px solid #f44336;
}

.score-value {
  font-size: 4rem;
  font-weight: 800;
  color: #333;
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
  line-height: 1;
}

.score-separator {
  color: #666;
  margin: 0 0.2rem;
}

.score-percentage {
  font-size: 1.5rem;
  font-weight: 600;
  color: #666;
  margin-top: 1rem;
}

.prediction-message {
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  text-align: center;
  font-size: 1rem;
  border: 1px solid;
}

.prediction-message.excellent {
  background-color: #e8f5e9;
  border-color: #4CAF50;
  color: #2E7D32;
}

.prediction-message.good {
  background-color: #e3f2fd;
  border-color: #2196F3;
  color: #1565C0;
}

.prediction-message.average {
  background-color: #fff3e0;
  border-color: #FF9800;
  color: #E65100;
}

.prediction-message.needs-improvement {
  background-color: #ffebee;
  border-color: #f44336;
  color: #d32f2f;
}

.questions-review {
  margin-top: 2rem;
}

.question-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.question-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.1rem;
}

.status-indicator {
  font-weight: bold;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.status-indicator.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-indicator.incorrect {
  background-color: #ffebee;
  color: #c62828;
}

.question-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.answers-container {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.answer-box {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
}

.answer-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.answer-content {
  color: #333;
}

.answer-content.correct {
  color: #2e7d32;
}

.answer-content.incorrect {
  color: #c62828;
}

.explanation {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.explanation-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.explanation-text {
  color: #333;
  line-height: 1.5;
}

.explanation-text.correct-highlight {
  border-left: 3px solid #4caf50;
  padding-left: 1rem;
}

.explanation-text.incorrect-highlight {
  border-left: 3px solid #f44336;
  padding-left: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #eee;
}

.retake-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retake-btn:hover {
  background-color: #1976D2;
}

.close-btn-bottom {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  padding: 0.8rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn-bottom:hover {
  background-color: #e0e0e0;
  color: #333;
}
</style> 