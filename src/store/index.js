import { createStore } from 'vuex';
import { supabase } from '../lib/supabase';
import { useAuth } from '../composables/useAuth';

export default createStore({
  state: {
    quizzes: [],
    quizHistory: [],
    userStats: {
      totalQuizzes: 0,
      streak: 0,
      lastReviewDate: null,
      accuracy: []
    },
    isLoading: false,
    error: null
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
      state.userStats.accuracy.push(result.actualScore);
      
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
    },

    setQuizHistory(state, history) {
      state.quizHistory = history;
    },

    clearQuizHistory(state) {
      state.quizHistory = [];
    },

    setLoading(state, isLoading) {
      state.isLoading = isLoading;
    },

    setError(state, error) {
      state.error = error;
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
    },

    async loadQuizHistory({ commit }) {
      const { user } = useAuth();
      
      if (!user.value) {
        commit('clearQuizHistory');
        return;
      }

      commit('setLoading', true);
      commit('setError', null);

      try {
        const { data, error } = await supabase
          .from('quiz_history')
          .select('*')
          .eq('user_id', user.value.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Update both quiz history and user stats
        commit('setQuizHistory', data || []);
        
        // Reset user stats
        commit('setUserStats', {
          totalQuizzes: data?.length || 0,
          streak: 0, // You might want to calculate this based on dates
          lastReviewDate: null,
          accuracy: data?.map(quiz => quiz.score) || []
        });
      } catch (error) {
        console.error('Error loading quiz history:', error);
        commit('setError', 'Failed to load quiz history');
        commit('clearQuizHistory');
      } finally {
        commit('setLoading', false);
      }
    },

    async addQuizToHistory({ commit, state }, quizData) {
      const { user } = useAuth();
      
      if (!user.value) {
        console.log('User not logged in, skipping quiz history save');
        return;
      }

      try {
        // Format the quiz data according to the database schema
        const formattedQuizData = {
          user_id: user.value.id,
          topic: quizData.topic,
          score: quizData.score,
          total_questions: quizData.total_questions,
          duration: quizData.duration || 0,
          created_at: quizData.created_at || new Date().toISOString(),
          questions: JSON.stringify(quizData.questions) // Store questions as JSON
        };

        const { data, error } = await supabase
          .from('quiz_history')
          .insert([formattedQuizData])
          .select();

        if (error) {
          console.error('Error saving quiz to Supabase:', error);
          throw error;
        }

        if (data && data[0]) {
          // Update local quiz history with the new quiz at the beginning
          commit('setQuizHistory', [data[0], ...state.quizHistory]);
          
          // Update user stats
          commit('addQuizResult', data[0]);
        }
      } catch (error) {
        console.error('Error adding quiz to history:', error);
        commit('setError', 'Failed to save quiz result');
      }
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
      return Math.round(sum / state.userStats.accuracy.length);
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
        const date = new Date(quiz.date).toISOString().split('T')[0];
        if (!quizzesByDate[date]) {
          quizzesByDate[date] = 0;
        }
        quizzesByDate[date]++;
      });
      return quizzesByDate;
    },

    getQuizHistory: state => state.quizHistory,
    isLoading: state => state.isLoading,
    hasError: state => !!state.error,
    getError: state => state.error
  }
});

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
} 