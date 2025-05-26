<template>
  <div class="quiz-history-details">
    <div class="header">
      <button class="back-btn" @click="$emit('close')">← Back</button>
      <h2>Quiz Results</h2>
      <div class="file-info">
        <span class="file-name">{{ quiz.fileName }}</span>
        <span class="date">{{ formatDate(quiz.date) }}</span>
      </div>
    </div>

    <div class="scores-container">
      <div class="score-card actual">
        <div class="score-circle" :class="getScoreClass(quiz.actualScore)">
          <span class="score-value">{{ quiz.actualScore }}%</span>
        </div>
        <span class="score-label">Your Score</span>
      </div>
      
      <div class="score-card predicted">
        <div class="score-circle" :class="getPredictedScoreClass(quiz.predictedScore)">
          <span class="score-value">{{ quiz.predictedScore }}%</span>
        </div>
        <span class="score-label">Predicted Score</span>
      </div>
    </div>

    <div class="quiz-stats">
      <div class="stat-item">
        <span class="stat-label">Questions</span>
        <span class="stat-value">{{ quiz.questionCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Performance</span>
        <span class="stat-value" :class="getPerformanceClass(quiz.actualScore, quiz.predictedScore)">
          {{ getPerformanceText(quiz.actualScore, quiz.predictedScore) }}
        </span>
      </div>
    </div>

    <button class="retake-btn" @click="$emit('retake-quiz', quiz)">
      Retake Quiz
    </button>

    <div v-if="quiz.questions && quiz.questions.length > 0" class="detailed-results">
      <h3>Detailed Results</h3>
      <div v-for="(question, index) in quiz.questions" :key="index" class="result-item">
        <div class="question-header">
          <span class="question-number">Question {{ index + 1 }}</span>
          <span :class="['result-status', question.isCorrect ? 'correct' : 'wrong']">
            {{ question.isCorrect ? '✓' : '✗' }}
          </span>
        </div>
        <p class="question-text">{{ question.text }}</p>
        <div class="answer-details" :class="{ 'incorrect': !question.isCorrect }">
          <div class="answer-row">
            <div class="user-answer">
              <strong>Your answer:</strong> 
              <span :class="{ 'incorrect-text': !question.isCorrect }">
                {{ formatAnswer(question, question.userAnswer) }}
              </span>
            </div>
            <div class="correct-answer">
              <strong>Correct answer:</strong>
              <span class="correct-text">{{ formatAnswer(question, question.correctAnswer) }}</span>
            </div>
          </div>
          <div v-if="question.explanation" class="explanation-box" :class="{ 'correct': question.isCorrect, 'incorrect': !question.isCorrect }">
            <p class="explanation-label">Explanation:</p>
            <p class="explanation-text">{{ question.explanation }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { formatAnswer, getScoreClass, getPredictedScoreClass, getPerformanceClass, getPerformanceText } from '../algorithms/answer-formatting';

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
</script>

<style scoped>
.quiz-history-details {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
  position: relative;
}

.header h2 {
  margin-bottom: 0.5rem;
  color: #333;
}

.file-info {
  color: #666;
  font-size: 0.9rem;
}

.file-name {
  font-weight: 500;
  margin-right: 1rem;
}

.scores-container {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.score-card {
  text-align: center;
}

.score-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.score-value {
  font-size: 2rem;
  font-weight: bold;
}

.score-label {
  font-size: 0.9rem;
  color: #666;
}

/* Score classes */
.excellent {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
  color: #2E7D32;
}

.good {
  background-color: #e3f2fd;
  border: 3px solid #2196F3;
  color: #1565C0;
}

.average {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
  color: #EF6C00;
}

.needs-improvement {
  background-color: #ffebee;
  border: 3px solid #f44336;
  color: #c62828;
}

.high {
  background-color: #e8f5e9;
  border: 3px solid #4CAF50;
  color: #2E7D32;
}

.medium {
  background-color: #fff3e0;
  border: 3px solid #FF9800;
  color: #EF6C00;
}

.low {
  background-color: #ffebee;
  border: 3px solid #f44336;
  color: #c62828;
}

.quiz-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 500;
}

.exceeded {
  color: #4CAF50;
}

.met {
  color: #2196F3;
}

.below {
  color: #f44336;
}

.back-btn {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #333;
}

.retake-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 2rem 0;
  background-color: #4CAF50;
  color: white;
}

.retake-btn:hover {
  background-color: #45a049;
}

.detailed-results {
  margin-top: 1rem;
  padding-top: 2rem;
  border-top: 1px solid #e0e0e0;
}

.detailed-results h3 {
  color: #333;
  margin-bottom: 1.5rem;
}

.result-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.question-number {
  font-weight: 600;
  color: #666;
}

.result-status {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.result-status.correct {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.result-status.wrong {
  background-color: #ffebee;
  color: #c62828;
}

.question-text {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.answer-details {
  background-color: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.answer-details.incorrect {
  border-color: #ffcdd2;
  background-color: #fff5f5;
}

.answer-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1rem;
}

.user-answer, .correct-answer {
  padding: 1rem;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.user-answer strong, .correct-answer strong {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.incorrect-text {
  color: #d32f2f;
}

.correct-text {
  color: #2e7d32;
}

.explanation-box {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.explanation-box.correct {
  border-left: 4px solid #4CAF50;
}

.explanation-box.incorrect {
  border-left: 4px solid #ff9800;
}

.explanation-label {
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.explanation-text {
  color: #333;
  line-height: 1.6;
  margin: 0;
}
</style> 