import { createStore } from 'vuex';

export default createStore({
  state: {
    quizzes: [],
    quizHistory: [],
    userStats: {
      totalQuizzes: 0,
      streak: 0,
      lastReviewDate: null,
      accuracy: []
    }
  },

  mutations: {
    setQuizzes(state, quizzes) {
      state.quizzes = quizzes;
    },

    addQuiz(state, quiz) {
      state.quizzes.push(quiz);
    },

    updateQuiz(state, updatedQuiz) {
      const index = state.quizzes.findIndex(q => q.id === updatedQuiz.id);
      if (index !== -1) {
        state.quizzes[index] = updatedQuiz;
      }
    },

    deleteQuiz(state, quizId) {
      state.quizzes = state.quizzes.filter(q => q.id !== quizId);
    },

    updateQuestions(state, updatedQuestions) {
      // Group questions by quiz
      const questionsByQuiz = updatedQuestions.reduce((acc, question) => {
        if (!acc[question.quizId]) {
          acc[question.quizId] = [];
        }
        acc[question.quizId].push(question);
        return acc;
      }, {});

      // Update questions in each quiz
      state.quizzes = state.quizzes.map(quiz => {
        if (questionsByQuiz[quiz.id]) {
          return {
            ...quiz,
            questions: quiz.questions.map(q => {
              const updatedQuestion = questionsByQuiz[quiz.id].find(uq => uq.id === q.id);
              return updatedQuestion || q;
            })
          };
        }
        return quiz;
      });
    },

    addQuizResult(state, result) {
      state.quizHistory.unshift(result);
      
      // Update user stats - count quizzes instead of questions
      state.userStats.totalQuizzes++;
      state.userStats.accuracy.push(result.actualScore * 100); // Convert decimal to percentage
      
      // Update streak
      const today = new Date().toDateString();
      const lastReview = state.userStats.lastReviewDate 
        ? new Date(state.userStats.lastReviewDate).toDateString()
        : null;

      if (lastReview === today) {
        // Already reviewed today, just update the date
        state.userStats.lastReviewDate = new Date().toISOString();
      } else if (!lastReview || isYesterday(new Date(state.userStats.lastReviewDate))) {
        // First review or reviewed yesterday, increment streak
        state.userStats.streak++;
        state.userStats.lastReviewDate = new Date().toISOString();
      } else {
        // Streak broken
        state.userStats.streak = 1;
        state.userStats.lastReviewDate = new Date().toISOString();
      }
    },

    updateQuizResult(state, { index, result }) {
      state.quizHistory[index] = result;
    },

    setUserStats(state, stats) {
      state.userStats = stats;
    },

    CLEAR_QUIZ_HISTORY(state) {
      state.quizHistory = [];
      state.quizzes = [];
      state.userStats = {
        accuracy: [],
        totalQuizzes: 0
      };
    }
  },

  actions: {
    initializeStore({ commit }) {
      // Load quizzes from localStorage
      const savedQuizzes = localStorage.getItem('quizzes');
      if (savedQuizzes) {
        commit('setQuizzes', JSON.parse(savedQuizzes));
      }

      // Load quiz history from localStorage
      const savedHistory = localStorage.getItem('quizHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        history.forEach(result => commit('addQuizResult', result));
      }

      // Load user stats from localStorage
      const savedStats = localStorage.getItem('userStats');
      if (savedStats) {
        const stats = JSON.parse(savedStats);
        commit('setUserStats', stats);
      }
    },

    saveState({ state }) {
      localStorage.setItem('quizzes', JSON.stringify(state.quizzes));
      localStorage.setItem('quizHistory', JSON.stringify(state.quizHistory));
      localStorage.setItem('userStats', JSON.stringify(state.userStats));
    },

    clearQuizHistory({ commit }) {
      commit('CLEAR_QUIZ_HISTORY');
      // Also clear from localStorage if you're using it
      localStorage.removeItem('quizHistory');
      localStorage.removeItem('quizzes');
      localStorage.removeItem('userStats');
    }
  },

  getters: {
    getDueQuestions: (state) => {
      return state.quizzes.flatMap(quiz => 
        quiz.questions.filter(q => {
          if (!q.spacedRepetition?.nextReviewDate) return true;
          return new Date(q.spacedRepetition.nextReviewDate) <= new Date();
        })
      );
    },

    getQuizById: (state) => (id) => {
      return state.quizzes.find(quiz => quiz.id === id);
    },

    getAverageAccuracy: (state) => {
      if (state.userStats.accuracy.length === 0) return 0;
      const sum = state.userStats.accuracy.reduce((a, b) => a + b, 0);
      return Math.round(sum / state.userStats.accuracy.length); // No need to multiply by 100 since values are already percentages
    },

    getTotalQuizzes: (state) => {
      return state.userStats.totalQuizzes;
    },

    getTotalQuestions: (state) => {
      return state.quizHistory.reduce((total, quiz) => total + quiz.questions.length, 0);
    },

    getQuizzesByDate: (state) => {
      const quizzesByDate = {};
      state.quizHistory.forEach(quiz => {
        try {
          if (!quiz.date) return;
          const dateObj = new Date(quiz.date);
          if (isNaN(dateObj.getTime())) return; // Skip invalid dates
          const date = dateObj.toISOString().split('T')[0];
          if (!quizzesByDate[date]) {
            quizzesByDate[date] = 0;
          }
          quizzesByDate[date]++;
        } catch (e) {
          console.warn('Invalid date found in quiz history:', quiz.date);
          return;
        }
      });
      return quizzesByDate;
    }
  }
});

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
} 