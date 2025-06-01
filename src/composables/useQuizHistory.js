import { ref } from 'vue';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export function useQuizHistory() {
  const { user } = useAuth();
  const quizHistory = ref([]);

  const saveQuiz = async (quizData) => {
    try {
      // Only save quiz if user is logged in
      if (!user.value) {
        return { data: null, error: null }; // Silently ignore for non-authenticated users
      }

      const { data, error } = await supabase
        .from('quiz_history')
        .insert([{
          ...quizData,
          user_id: user.value.id,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error saving quiz:', error);
      return { data: null, error };
    }
  };

  const fetchQuizzes = async () => {
    try {
      // Only fetch quizzes if user is logged in
      if (!user.value) {
        quizHistory.value = [];
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('quiz_history')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      quizHistory.value = data || [];
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return { data: null, error };
    }
  };

  const clearHistory = async () => {
    try {
      if (!user.value) {
        return { error: null };
      }

      const { error } = await supabase
        .from('quiz_history')
        .delete()
        .eq('user_id', user.value.id);

      if (error) throw error;
      
      quizHistory.value = [];
      return { error: null };
    } catch (error) {
      console.error('Error clearing history:', error);
      return { error };
    }
  };

  return {
    quizHistory,
    saveQuiz,
    fetchQuizzes,
    clearHistory
  };
} 