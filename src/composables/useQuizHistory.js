import { ref } from 'vue';

export function useQuizHistory() {
  const quizHistory = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  const fetchHistory = async (userId) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Here you would make your actual API call
      // For now, we'll simulate fetching quiz history for specific user
      await new Promise(resolve => setTimeout(resolve, 1000));
      quizHistory.value = [
        {
          id: '1',
          userId: userId,
          date: new Date().toISOString(),
          score: 85,
          predictedScore: 80,
          totalQuestions: 10,
          timeSpent: '12:30',
          category: 'JavaScript',
          questions: [
            {
              id: 'q1',
              question: 'What is a closure in JavaScript?',
              userAnswer: 'A function that has access to variables in its outer scope',
              correctAnswer: 'A function that has access to variables in its outer scope even after the outer function has returned',
              isCorrect: false,
              points: 8,
              predictedDifficulty: 'medium'
            },
            {
              id: 'q2',
              question: 'What is the difference between let and var?',
              userAnswer: 'let has block scope, var has function scope',
              correctAnswer: 'let has block scope, var has function scope',
              isCorrect: true,
              points: 10,
              predictedDifficulty: 'easy'
            }
          ],
          summary: {
            totalScore: 85,
            predictedScore: 80,
            correctAnswers: 8,
            incorrectAnswers: 2,
            accuracy: '80%',
            timePerQuestion: '1:15',
            difficultyLevel: 'Intermediate'
          }
        },
        {
          id: '2',
          userId: userId,
          date: new Date(Date.now() - 86400000).toISOString(),
          score: 92,
          predictedScore: 85,
          totalQuestions: 15,
          timeSpent: '18:45',
          category: 'Python',
          questions: [
            {
              id: 'q1',
              question: 'What is a decorator in Python?',
              userAnswer: 'A function that modifies another function',
              correctAnswer: 'A function that takes another function as an argument and extends its behavior without explicitly modifying it',
              isCorrect: false,
              points: 7,
              predictedDifficulty: 'hard'
            },
            {
              id: 'q2',
              question: 'What is the difference between a list and a tuple?',
              userAnswer: 'Lists are mutable, tuples are immutable',
              correctAnswer: 'Lists are mutable, tuples are immutable',
              isCorrect: true,
              points: 10,
              predictedDifficulty: 'easy'
            }
          ],
          summary: {
            totalScore: 92,
            predictedScore: 85,
            correctAnswers: 13,
            incorrectAnswers: 2,
            accuracy: '87%',
            timePerQuestion: '1:15',
            difficultyLevel: 'Advanced'
          }
        }
      ];
      return true;
    } catch (e) {
      error.value = 'Failed to fetch quiz history. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const addQuizResult = async (result) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Here you would make your actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Ensure the result has all required fields
      const enhancedResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...result,
        summary: {
          totalScore: result.score,
          predictedScore: result.predictedScore || 0,
          correctAnswers: result.questions?.filter(q => q.isCorrect).length || 0,
          incorrectAnswers: result.questions?.filter(q => !q.isCorrect).length || 0,
          accuracy: result.questions ? 
            `${Math.round((result.questions.filter(q => q.isCorrect).length / result.questions.length) * 100)}%` : 
            '0%',
          timePerQuestion: result.timeSpent ? 
            (parseInt(result.timeSpent) / (result.questions?.length || 1)).toFixed(2) + ' min' : 
            'N/A',
          difficultyLevel: calculateDifficultyLevel(result.questions || [])
        }
      };

      quizHistory.value.unshift(enhancedResult);
      return true;
    } catch (e) {
      error.value = 'Failed to save quiz result. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const clearHistory = async (userId) => {
    isLoading.value = true;
    error.value = null;
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      quizHistory.value = quizHistory.value.filter(quiz => quiz.userId !== userId);
      return true;
    } catch (e) {
      error.value = 'Failed to clear quiz history. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Helper function to calculate difficulty level based on questions
  const calculateDifficultyLevel = (questions) => {
    if (!questions.length) return 'N/A';
    
    const difficultyScores = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };
    
    const averageDifficulty = questions.reduce((acc, q) => 
      acc + (difficultyScores[q.predictedDifficulty] || 2), 0) / questions.length;
    
    if (averageDifficulty <= 1.5) return 'Beginner';
    if (averageDifficulty <= 2.2) return 'Intermediate';
    return 'Advanced';
  };

  return {
    quizHistory,
    isLoading,
    error,
    fetchHistory,
    addQuizResult,
    clearHistory
  };
} 