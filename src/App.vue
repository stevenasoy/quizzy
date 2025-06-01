<template>
  <div class="app-container">
    <AccountButton @showAuthModal="showAuthModal = true" />
    <Sidebar 
      :quiz-history="quizHistory" 
      @create-quiz="handleCreateQuiz"
      @retake-quiz="handleRetakeQuiz"
      @clear-history="clearHistory"
      @select-quiz="handleQuizSelect"
      @view-stats="showStats = true"
    />
    <div class="main-content">
      <div v-if="showStats" class="stats-view">
        <div class="stats-header-actions">
          <button class="back-btn" @click="showStats = false">
            ← Back to Quiz
          </button>
          <button class="create-quiz-btn" @click="handleCreateQuizFromStats">
            + Create New Quiz
          </button>
        </div>
        <StudyStats :quiz-history="quizHistory" />
      </div>
      
      <div v-else class="upload-container">
        <h1>QUIZZy</h1>
        
        <div v-if="selectedQuiz" class="quiz-details-container">
          <QuizHistoryDetails
            :quiz="selectedQuiz"
            @retake-quiz="handleRetakeQuiz"
            @close="selectedQuiz = null"
          />
        </div>

        <div v-else-if="!quizStarted && !quizFinished" class="file-upload-section">
          <h2>Upload Files</h2>
          <div class="upload-area" 
            @dragover.prevent 
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
            role="button"
            tabindex="0"
            @keydown.enter="triggerFileInput"
          >
            <input 
              type="file" 
              @change="handleFileSelect" 
              accept=".pdf,.docx,.pptx,.txt"
              ref="fileInput"
              class="file-input"
            >
            <div class="upload-prompt">
              <p>Drag and drop files here or click to select</p>
              <div class="supported-formats">
                <p>Supported formats:</p>
                <ul>
                  <li><span class="format-icon">📄</span> Documents (PDF, DOCX)</li>
                  <li><span class="format-icon">📊</span> Presentations (PPTX)</li>
                  <li><span class="format-icon">📝</span> Text files (TXT)</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div v-if="hasFileErrors" class="error-section">
            <FileErrorDisplay
              :extraction-errors="extractionErrors"
              :unsupported-files="unsupportedFiles"
            />
          </div>

          <div v-if="selectedFiles.length > 0" class="selected-files">
            <h3>Selected Files:</h3>
            <ul>
              <li v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                <span class="file-name">{{ file.name }}</span>
                <button @click="removeFile(index)" class="remove-btn" title="Remove file">×</button>
              </li>
            </ul>
          </div>

          <div class="questions-section">
            <h2>Number of Questions</h2>
            <div class="question-input">
              <input
                type="number"
                v-model="questionCount"
                min="1"
                max="20"
                placeholder="Enter number of questions"
              />
            </div>
          </div>

          <button 
            class="submit-btn" 
            :disabled="!isFormValid || isLoading"
            @click="handleSubmit"
          >
            {{ isLoading ? 'Generating Questions...' : 'Submit' }}
          </button>
        </div>

        <div v-if="predictedScore !== null && !quizStarted && !quizFinished">
          <div class="predicted-score-container">
            <h2>Ready to Start!</h2>
            <div class="score-prediction">
              <div class="score-circle" :class="getPredictedScoreClass">
                <span class="predicted-value">{{ predictedScore }}%</span>
                <span class="prediction-label">Predicted Score</span>
              </div>
            </div>
            <p class="prediction-explanation">
              Based on your study material, we predict you'll score around {{ predictedScore }}%.
            </p>
            <button class="start-quiz-btn" @click="startQuiz">Start Quiz</button>
          </div>
        </div>

        <FlashcardQuiz
          v-if="quizStarted && !quizFinished"
          :questions="adaptiveQuestions"
          :total-questions="Number(questionCount)"
          @quiz-completed="handleQuizComplete"
          @update-question="handleQuestionUpdate"
        />

        <QuizResults
          v-if="quizFinished"
          :questions="formatQuestionsForResults"
          :user-answers="formatUserAnswersForResults"
          :score="correctAnswersCount"
          :predicted-score="predictedScore"
          @restart="restartQuiz"
          @go-back="resetToMainScreen"
        />

        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="typewriter">Generating quiz</div>
        <div class="dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>

    <nav class="main-nav">
      <div v-if="dueCount > 0" class="review-button" @click="showReviewSession = true">
        {{ dueCount }} Due for Review
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import FileErrorDisplay from './components/FileErrorDisplay.vue';
import QuizResults from './components/QuizResults.vue';
import FlashcardQuiz from './components/FlashcardQuiz.vue';
import Sidebar from './components/Sidebar.vue';
import QuizHistoryDetails from './components/QuizHistoryDetails.vue';
import AccountButton from './components/AccountButton.vue';
import StudyStats from './components/StudyStats.vue';
import { 
  calculatePredictedScore,
  processQuizResponse,
  isSimilarQuestion
} from './algorithms';
import { updateSpacedRepetition } from './algorithms/spaced-repetition';
import { useStore } from 'vuex';
import { useAuth } from './composables/useAuth';

const store = useStore();
const { user } = useAuth();

// File handling state
const selectedFiles = ref([]);
const fileInput = ref(null);
const unsupportedFiles = ref([]);
const extractionErrors = ref([]);

// Quiz state
const questionCount = ref('');
const isLoading = ref(false);
const error = ref('');
const predictedScore = ref(null);
const quizStarted = ref(false);
const quizFinished = ref(false);
const adaptiveQuestions = ref([]);
const userResponses = ref([]);
const extractedContent = ref('');
const selectedQuiz = ref(null);

// Add isRetaking flag to track retakes
const isRetaking = ref(false);
const retakeIndex = ref(-1);

// Stats view state
const showStats = ref(false);

// Add computed property for quiz history
const quizHistory = computed(() => store.state.quizHistory);

// Initialize store and load data
onMounted(() => {
  // Initialize store
  store.dispatch('initializeStore');
  
  // Load quiz history if user is logged in
  if (user.value) {
    loadQuizzes();
  }
});

// Calculate number of due questions with safety check
const dueCount = computed(() => {
  if (!store.state.quizzes) return 0;
  return store.getters.getDueQuestions.length;
});

// Computed properties
const isFormValid = computed(() => {
  return selectedFiles.value.length > 0 && questionCount.value > 0;
});

const hasFileErrors = computed(() => {
  return extractionErrors.value.length > 0 || unsupportedFiles.value.length > 0;
});

const getPredictedScoreClass = computed(() => {
  if (predictedScore.value >= 80) return 'high';
  if (predictedScore.value >= 60) return 'medium';
  return 'low';
});

// File handling methods
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  addFiles(files);
};

const handleDrop = (event) => {
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
};

const addFiles = (files) => {
  const validTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/tiff',
    'image/bmp'
  ];
  
  const validFiles = [];
  const invalidFiles = [];
  
  files.forEach(file => {
    if (validTypes.includes(file.type)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file);
    }
  });
  
  selectedFiles.value = [...selectedFiles.value, ...validFiles];
  unsupportedFiles.value = [...unsupportedFiles.value, ...invalidFiles];
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// Quiz handling methods
const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isLoading.value = true;
  error.value = '';
  adaptiveQuestions.value = [];
  predictedScore.value = null;
  quizStarted.value = false;
  userResponses.value = [];
  extractedContent.value = '';
  extractionErrors.value = [];

  try {
    console.log('Processing files:', selectedFiles.value.map(f => ({ name: f.name, type: f.type })));
    
    const fileContents = await Promise.all(
      selectedFiles.value.map(file => readFileContent(file))
    );

    const validContents = fileContents.filter(content => content && content.trim().length > 0);
    console.log('Number of files with valid content:', validContents.length);
    
    if (validContents.length === 0) {
      throw new Error('No valid content could be extracted from the selected files.');
    }

    extractedContent.value = validContents.join('\n\n');
    console.log('Total content length:', extractedContent.value.length);
    
    if (extractedContent.value.trim().length < 50) {
      throw new Error('The extracted content is too short to generate meaningful questions.');
    }

    const requestedQuestionCount = Number(questionCount.value);
    console.log('Requesting questions:', requestedQuestionCount);
    
    const questions = await generateQuestions(extractedContent.value, requestedQuestionCount);
    
    if (!questions || questions.length === 0) {
      throw new Error('No valid questions could be generated.');
    }

    console.log('Generated questions:', questions.length);
    adaptiveQuestions.value = questions;
    predictedScore.value = calculatePredictedScore(adaptiveQuestions.value);

  } catch (err) {
    console.error('Error in handleSubmit:', err);
    error.value = err.message || 'An unexpected error occurred while generating questions.';
    adaptiveQuestions.value = [];
    predictedScore.value = null;
  } finally {
    isLoading.value = false;
  }
};

const startQuiz = () => {
  quizStarted.value = true;
  quizFinished.value = false;
};

const handleQuizComplete = (responses) => {
  userResponses.value = responses;
  
  // Update the adaptiveQuestions with user answers and spaced repetition data
  adaptiveQuestions.value = adaptiveQuestions.value.map((question, index) => {
    const response = responses[index];
    const performance = response?.correct ? 5 : 0; // 5 for correct, 0 for incorrect
    
    // Update spaced repetition data
    const updatedSpacedRepetition = updateSpacedRepetition(question, performance);
    
    return {
      ...question,
      userAnswer: response?.userAnswer,
      isCorrect: response?.correct,
      spacedRepetition: updatedSpacedRepetition
    };
  });
  
  // Set quiz states
  quizStarted.value = false;
  quizFinished.value = true;
  
  // Save results
  saveQuizResults();
};

const restartQuiz = () => {
  quizStarted.value = true;
  quizFinished.value = false;
  userResponses.value = [];
};

const resetToMainScreen = () => {
  selectedFiles.value = [];
  unsupportedFiles.value = [];
  extractionErrors.value = [];
  questionCount.value = '';
  error.value = '';
  isLoading.value = false;
  predictedScore.value = null;
  quizStarted.value = false;
  quizFinished.value = false;
  adaptiveQuestions.value = [];
  userResponses.value = [];
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Helper functions
async function readFileContent(file) {
  return new Promise((resolve) => {
    try {
      console.log('File type:', file.type);
      console.log('File name:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const backendUrl = process.env.VUE_APP_BACKEND_URL || 'http://localhost:5001';
      fetch(`${backendUrl}/extract-file`, {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.text) {
            resolve(data.text);
          } else {
            extractionErrors.value.push({
              fileName: file.name,
              message: data.error || 'Failed to extract text from file'
            });
          resolve('');
          }
        })
      .catch(error => {
        console.error('Error processing file:', error);
          extractionErrors.value.push({
            fileName: file.name,
          message: `Error processing file: ${error.message}`
        });
        resolve('');
      });
    } catch (error) {
      console.error('Error preparing file:', error);
        extractionErrors.value.push({
          fileName: file.name,
        message: `Error preparing file: ${error.message}`
      });
      resolve('');
    }
  });
}

async function generateQuestions(content, count) {
  const maxRetries = 3;
  let retryCount = 0;
  let allQuestions = [];

  while (retryCount < maxRetries && allQuestions.length < count) {
    try {
      const remainingCount = count - allQuestions.length;
      const strategy = retryCount % 3;
      let prompt = `Generate exactly ${remainingCount} questions. DO NOT use markdown formatting or asterisks for emphasis.
FOLLOW THIS EXACT FORMAT WITH NO DEVIATIONS:

For Multiple Choice Questions:
Question: What is the question text?
A) First option
B) Second option
C) Third option
D) Fourth option
Answer: A* (or B*, C*, D* - add asterisk to correct answer)
Difficulty: easy (or medium or hard)

For True/False Questions:
True/False: What is the question text?
Answer: True* (or False* - add asterisk to correct answer)
Difficulty: easy (or medium or hard)

REQUIREMENTS:
1. Use the exact format shown above
2. Do not add any extra formatting or text
3. Do not use markdown
4. Do not use bold or italics
5. Each question must end with a difficulty level
6. Questions must be based on this content:

${content}

STRATEGY: `;

      switch (strategy) {
        case 0:
          prompt += 'Create a mix of multiple-choice and true/false questions that directly test understanding of the content.';
          break;
        case 1:
          prompt += 'Create questions that focus on what is NOT mentioned or opposite relationships in the content.';
          break;
        case 2:
          prompt += 'Create questions that test application and inference of the concepts mentioned in the content.';
          break;
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.VUE_APP_GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7 + (retryCount * 0.1),
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response format from Gemini API');
      }

      const responseText = response.data.candidates[0].content.parts[0].text
        .replace(/\*\*/g, '') // Remove markdown bold
        .replace(/\*/g, '*')  // Normalize asterisks
        .replace(/[""]/g, '"'); // Normalize quotes

      console.log('Generated response:', responseText);

      const newQuestions = processQuizResponse(responseText, content).questions;
      
      if (newQuestions.length === 0) {
        console.error('No valid questions parsed from response');
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      // Add unique IDs and initialize spaced repetition data for new questions
      const questionsWithIds = newQuestions.map(q => ({
        ...q,
        id: crypto.randomUUID(),
        spacedRepetition: {
          repetitions: 0,
          ease: 2.5,
          interval: 1,
          nextReviewDate: null,
          lastReviewDate: null
        }
      }));

      const uniqueNewQuestions = questionsWithIds.filter(newQ => 
        !allQuestions.some(existingQ => isSimilarQuestion(newQ, existingQ))
      );

      allQuestions = [...allQuestions, ...uniqueNewQuestions];
      
      if (allQuestions.length >= count) {
        return allQuestions.slice(0, count);
      }

      retryCount++;

    } catch (error) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      retryCount++;
      
      if (error.response?.status === 429) {
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
      } else if (retryCount === maxRetries) {
        throw new Error(`Failed to generate enough unique questions after ${maxRetries} attempts. ${error.response?.data?.error?.message || error.message}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  if (allQuestions.length < count) {
    throw new Error(`Could only generate ${allQuestions.length} unique questions out of ${count} requested. Please try with different content or reduce the number of questions.`);
  }

  return allQuestions;
}

// Results formatting
const formatQuestionsForResults = computed(() => {
  return adaptiveQuestions.value.map((q, index) => ({
    text: q.text,
    type: q.type,
    options: q.options,
    user_answer: userResponses.value[index]?.userAnswer,
    correct_answer: q.correctAnswer,
    is_correct: userResponses.value[index]?.correct,
    explanation: q.explanation
  }));
});

const formatUserAnswersForResults = computed(() => {
  return userResponses.value.map(r => r.userAnswer);
});

const correctAnswersCount = computed(() => {
  return userResponses.value.filter(r => r.correct).length;
});

// Update the calculateScore function
const score = computed(() => {
  if (!userResponses.value || userResponses.value.length === 0) return 0;
  return Math.round((correctAnswersCount.value / userResponses.value.length) * 100);
});

// Update the saveQuizResults function to use Vuex
const saveQuizResults = () => {
  const quizResult = {
    topic: selectedFiles.value[0]?.name || 'Untitled Quiz',
    score: score.value,
    total_questions: adaptiveQuestions.value.length,
    duration: 0, // You can add duration tracking if needed
    created_at: new Date().toISOString(),
    questions: adaptiveQuestions.value.map((q, index) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options,
      user_answer: userResponses.value[index]?.userAnswer,
      correct_answer: q.correctAnswer,
      is_correct: userResponses.value[index]?.correct,
      explanation: q.explanation,
      difficulty: q.difficulty
    }))
  };
  
  // Save quiz result to store
  store.dispatch('addQuizToHistory', quizResult);
  
  // Update the questions in the store with their new spaced repetition data
  store.commit('updateQuestions', adaptiveQuestions.value);
  
  isRetaking.value = false;
  retakeIndex.value = -1;
};

// Update the handleRetakeQuiz function to set retake flags
const handleRetakeQuiz = async (quizToRetake) => {
  // Find the index of the quiz being retaken
  retakeIndex.value = quizHistory.value.findIndex(quiz => 
    quiz.fileName === quizToRetake.fileName && 
    quiz.questionCount === quizToRetake.questionCount &&
    quiz.fileContent === quizToRetake.fileContent
  );
  
  if (retakeIndex.value === -1) {
    console.error('Could not find original quiz to retake');
    return;
  }
  
  isRetaking.value = true;
  
  // Reset quiz state
  quizStarted.value = false;
  quizFinished.value = false;
  predictedScore.value = null;
  error.value = '';
  adaptiveQuestions.value = [];
  userResponses.value = [];
  selectedQuiz.value = null;  // Reset selected quiz
  
  // Set the question count from the previous quiz
  questionCount.value = quizToRetake.questionCount.toString();
  
  // Create a dummy file with the same name
  const file = new File([''], quizToRetake.fileName, {
    type: 'text/plain'
  });
  
  // Set the selected file and content
  selectedFiles.value = [file];
  extractedContent.value = quizToRetake.fileContent;
  
  // Generate new quiz using the stored content
  try {
    isLoading.value = true;
    const requestedQuestionCount = Number(questionCount.value);
    
    const questions = await generateQuestions(extractedContent.value, requestedQuestionCount);
    if (!questions || questions.length === 0) {
      throw new Error('No valid questions could be generated.');
    }
    
    adaptiveQuestions.value = questions;
    predictedScore.value = calculatePredictedScore(adaptiveQuestions.value);
    
    // After generating questions, start the quiz
    quizStarted.value = true;
  } catch (err) {
    error.value = `Error generating questions: ${err.message}`;
    // Reset retake flags on error
    isRetaking.value = false;
    retakeIndex.value = -1;
  } finally {
    isLoading.value = false;
  }
};

// Update handleCreateQuiz to reset retake flags
const handleCreateQuiz = () => {
  showStats.value = false;
  selectedQuiz.value = null;
  quizStarted.value = false;
  quizFinished.value = false;
  predictedScore.value = null;
  selectedFiles.value = [];
  questionCount.value = '';
  error.value = '';
  extractedContent.value = '';
  adaptiveQuestions.value = [];
  userResponses.value = [];
  isRetaking.value = false;
  retakeIndex.value = -1;
};

// Add the clearHistory function
const clearHistory = () => {
  if (confirm('Are you sure you want to clear all quiz history? This cannot be undone.')) {
    store.dispatch('clearQuizHistory');
  }
};

// Add function to handle quiz selection
const handleQuizSelect = (quiz) => {
  if (showStats.value) {
    showStats.value = false;
    // Add small delay to ensure smooth transition
    setTimeout(() => {
      selectedQuiz.value = quiz;
    }, 100);
  } else {
    selectedQuiz.value = quiz;
  }
};

// Add new method to handle create quiz from stats view
const handleCreateQuizFromStats = () => {
  showStats.value = false;
  handleCreateQuiz();
};

const showAuthModal = ref(false);

// Add loadQuizzes function
const loadQuizzes = async () => {
  try {
    if (user.value) {
      // Only load quiz history for authenticated users
      await store.dispatch('loadQuizHistory');
    }
  } catch (err) {
    console.error('Error loading quizzes:', err);
  }
};

// Add auth state change handler
watch(user, async (newUser) => {
  if (newUser) {
    // User just logged in, load their quiz history
    await loadQuizzes();
  } else {
    // User logged out, clear the quiz history from store
    store.commit('clearQuizHistory');
  }
});

const handleQuestionUpdate = (updatedQuestion) => {
  // Update the question in adaptiveQuestions
  const index = adaptiveQuestions.value.findIndex(q => q.id === updatedQuestion.id);
  if (index !== -1) {
    adaptiveQuestions.value[index] = {
      ...adaptiveQuestions.value[index],
      ...updatedQuestion
    };
  }
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  background-color: #f5f5f5;
  font-family: "Helvetica", "Arial", sans-serif;
}

.main-content {
  flex: 1;
  margin-left: 280px; /* Same as sidebar width */
  padding: 2rem;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
  overflow-y: auto;
}

.upload-container {
  width: 90%;
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

h2 {
  color: #444;
  margin-bottom: 1rem;
}

.file-upload-section {
  margin-bottom: 2rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  outline: none;
}

.upload-area:hover {
  border-color: #666;
  background-color: #f8f8f8;
}

.upload-area:focus {
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.file-input {
  display: none;
}

.upload-prompt {
  color: #666;
}

.upload-prompt p {
  margin: 0.5rem 0;
}

.selected-files {
  margin-top: 1rem;
}

.selected-files ul {
  list-style: none;
  padding: 0;
}

.selected-files li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f8f8;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.5rem;
}

.questions-section {
  margin-top: 2rem;
}

.question-input input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 2rem;
  transition: background-color 0.3s;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background-color: #45a049;
}

.questions-list {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.question-item {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
}

.quiz-container {
  margin-top: 2rem;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.question {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: #f8f8f8;
  border-radius: 4px;
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

.next-btn {
  width: auto;
  min-width: 150px;
  margin-top: 1rem;
}

.quiz-results {
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.score-summary {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.questions-review {
  margin-top: 2rem;
}

.question-review {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fff;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.question-number {
  font-weight: bold;
  color: #666;
}

.answer-status {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-weight: bold;
}

.answer-status.correct {
  background-color: #E8F5E9;
  color: #2E7D32;
}

.answer-status.incorrect {
  background-color: #FFEBEE;
  color: #C62828;
}

.question-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #333;
}

.answer-details {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
}

.your-answer, .correct-answer {
  margin-bottom: 0.5rem;
}

.question-explanation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.explanation-text {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-left: 3px solid #2196F3;
  border-radius: 4px;
  color: #333;
  font-size: 0.95rem;
  line-height: 1.5;
}

.explanation-text p {
  margin: 0.5rem 0;
}

.explanation-text strong {
  color: #2196F3;
}

.supported-formats {
  margin-top: 1rem;
  text-align: left;
  display: inline-block;
}

.supported-formats ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.supported-formats li {
  margin: 0.3rem 0;
  color: #555;
}

.format-icon {
  margin-right: 0.5rem;
}

.predicted-score-container {
  text-align: center;
  padding: 2rem;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.score-prediction {
  margin: 2rem 0;
}

.score-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.score-circle.high {
  background-color: #e8f5e9;
  border: 4px solid #4CAF50;
}

.score-circle.medium {
  background-color: #fff3e0;
  border: 4px solid #ff9800;
}

.score-circle.low {
  background-color: #ffebee;
  border: 4px solid #f44336;
}

.predicted-value {
  font-size: 3rem;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.prediction-label {
  font-size: 1rem;
  opacity: 0.8;
}

.prediction-explanation {
  color: #666;
  margin: 1.5rem 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.start-quiz-btn {
  background-color: #2196F3;
  color: white;
  padding: 1rem 2.5rem;
  border: none;
  border-radius: 25px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(33, 150, 243, 0.3);
}

.start-quiz-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(33, 150, 243, 0.4);
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 2rem;
  color: #333;
  font-weight: 500;
}

.typewriter {
  overflow: hidden;
  white-space: nowrap;
  animation: typing 3s steps(14) infinite;
  border-right: 3px solid #4CAF50;
}

.dots {
  display: flex;
}

.dots span {
  opacity: 0;
  animation: dot 1.5s infinite;
  animation-fill-mode: both;
}

.dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 90%, 100% {
    width: 0;
  }
  30%, 60% {
    width: 14ch;
  }
}

@keyframes dot {
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}

.quiz-details-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.review-reminder {
  margin-bottom: 2rem;
  text-align: center;
}

.review-btn {
  background: #2196F3;
  color: white;
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: background-color 0.2s;
}

.review-btn:hover {
  background: #1976D2;
}

.stats-view {
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #2196F3;
}

.stats-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.create-quiz-btn {
  padding: 0.5rem 1.5rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.create-quiz-btn:hover {
  background-color: #45a049;
  transform: translateY(-1px);
}

.review-button {
  background: #2196F3;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.review-button:hover {
  background: #1976D2;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
}

.main-nav {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 1rem;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.review-button {
  background: #2196F3;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.review-button:hover {
  background: #1976D2;
}
</style> 