<template>
  <div class="app-container">
    <Sidebar 
      :quiz-history="quizHistory" 
      @create-quiz="handleCreateQuiz"
      @retake-quiz="handleRetakeQuiz"
      @clear-history="clearHistory"
    />
    <div class="main-content">
      <div class="upload-container">
        <h1>QUIZZy</h1>
        
        <div v-if="!quizStarted && !quizFinished && predictedScore === null" class="file-upload-section">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import FileErrorDisplay from './components/FileErrorDisplay.vue';
import QuizResults from './components/QuizResults.vue';
import FlashcardQuiz from './components/FlashcardQuiz.vue';
import Sidebar from './components/Sidebar.vue';

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

// Add quiz history state
const quizHistory = ref([]);

// Add isRetaking flag to track retakes
const isRetaking = ref(false);
const retakeIndex = ref(-1);

// Load quiz history from localStorage on mount
onMounted(() => {
  const savedHistory = localStorage.getItem('quizHistory');
  if (savedHistory) {
    quizHistory.value = JSON.parse(savedHistory);
  }
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
    predictedScore.value = calculatePredictedScore();

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
  // Update the adaptiveQuestions with user answers
  adaptiveQuestions.value = adaptiveQuestions.value.map((question, index) => ({
    ...question,
    userAnswer: responses[index]?.userAnswer,
    isCorrect: responses[index]?.correct
  }));
  quizFinished.value = true;
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

      const uniqueNewQuestions = newQuestions.filter(newQ => 
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

function processQuizResponse(response, content) {
  const questions = [];
  let currentQuestion = null;
  
  // Split by double newlines to separate questions
  const sections = response.split(/\n\s*\n/);
  
  for (const section of sections) {
    const lines = section.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check for question start
      if (line.startsWith('Question:') || line.startsWith('True/False:')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        const isMultipleChoice = line.startsWith('Question:');
        currentQuestion = {
          text: line.replace(/^(Question:|True\/False:)/i, '').trim(),
          type: isMultipleChoice ? 'multiple-choice' : 'true-false',
          options: isMultipleChoice ? {} : { 'true': 'True', 'false': 'False' },
          correctAnswer: '',
          explanation: '',
          difficulty: 'medium'
        };
        continue;
      }

      if (!currentQuestion) continue;

      // Handle options for multiple choice
      if (currentQuestion.type === 'multiple-choice') {
        const optionMatch = line.match(/^([A-D])[).]\s*(.*)/i);
        if (optionMatch) {
          const letter = optionMatch[1].toUpperCase();
          let option = optionMatch[2].trim();
          currentQuestion.options[letter] = option;
        }
        
        // Check for answer line
        if (line.startsWith('Answer:')) {
          const answerMatch = line.match(/Answer:\s*([A-D])\*/i);
          if (answerMatch) {
            currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
          }
        }
      }

      // Handle true/false answer
      if (currentQuestion.type === 'true-false' && line.startsWith('Answer:')) {
        const answer = line.toLowerCase();
        if (answer.includes('true*')) {
          currentQuestion.correctAnswer = 'true';
        } else if (answer.includes('false*')) {
          currentQuestion.correctAnswer = 'false';
        }
      }

      // Handle difficulty
      if (line.startsWith('Difficulty:')) {
        const difficulty = line.substring(11).trim().toLowerCase();
        if (['easy', 'medium', 'hard'].includes(difficulty)) {
          currentQuestion.difficulty = difficulty;
        }
      }
    }
  }

  // Add the last question if exists
  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  // Validate questions
  const validQuestions = questions.filter(q => {
    // Basic validation
    if (!q.text || !q.type) return false;

    // Validate multiple choice questions
    if (q.type === 'multiple-choice') {
      const hasEnoughOptions = Object.keys(q.options).length >= 2;
      const hasCorrectAnswer = !!q.correctAnswer && !!q.options[q.correctAnswer];
      return hasEnoughOptions && hasCorrectAnswer;
    }

    // Validate true/false questions
    if (q.type === 'true-false') {
      return q.correctAnswer === 'true' || q.correctAnswer === 'false';
    }

    return false;
  });

  if (validQuestions.length === 0) {
    console.error('Raw response:', response);
    console.error('Parsed questions:', questions);
    throw new Error('No valid questions could be generated from the content.');
  }

  // Add explanations from content
  validQuestions.forEach(q => findExplanationFromContent(q, content));

  return { questions: validQuestions };
}

function findExplanationFromContent(question, content) {
  // Split content into paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  
  // Create search terms from the question and answer
  const searchTerms = [
    ...question.text.toLowerCase().replace(/[.,?!]/g, '').split(' '),
    ...(question.type === 'multiple-choice' && question.options[question.correctAnswer] 
      ? question.options[question.correctAnswer].toLowerCase().split(' ') 
      : [])
  ].filter(word => word.length > 3);
  
  // Find relevant paragraphs with scoring
  const relevantParagraphs = paragraphs.map(paragraph => {
    const normalizedParagraph = paragraph.toLowerCase();
    let score = 0;
    
    // Score exact phrase matches higher
    if (normalizedParagraph.includes(question.text.toLowerCase())) {
      score += 15;
    }
    
    // Score keyword matches
    searchTerms.forEach(term => {
      if (normalizedParagraph.includes(term)) {
        score += 2;
      }
    });

    return {
      text: paragraph.trim(),
      score
    };
  }).filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 1); // Get most relevant paragraph

  if (relevantParagraphs.length > 0) {
    question.explanation = relevantParagraphs[0].text;
  } else {
    // Basic fallback explanations
    if (question.type === 'true-false') {
      const isTrue = question.correctAnswer === 'true';
      question.explanation = `This statement is ${isTrue ? 'true' : 'false'} based on the provided content.`;
    } else {
      const correctOption = question.options[question.correctAnswer];
      question.explanation = `The correct answer is "${correctOption}" according to the material.`;
    }
  }
}

function selectQuestions(questions) {
  // First, shuffle all questions
  const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
  
  // Remove duplicates while preserving order
  const uniqueQuestions = shuffledQuestions.filter((question, index, self) => 
    index === self.findIndex((q) => 
      q.text.toLowerCase().replace(/[^\w\s]/g, '') === 
      question.text.toLowerCase().replace(/[^\w\s]/g, '')
    )
  );

  // Return all unique questions if we don't have enough
  if (uniqueQuestions.length <= Number(questionCount.value)) {
    return uniqueQuestions;
  }

  // Select the requested number of questions while maintaining difficulty distribution
  const targetPerDifficulty = Math.ceil(Number(questionCount.value) / 3);
  const selectedQuestions = [];
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };

  // First pass: try to get equal distribution
  uniqueQuestions.forEach(question => {
    const difficulty = question.difficulty || 'medium';
    if (difficultyCount[difficulty] < targetPerDifficulty && 
        selectedQuestions.length < Number(questionCount.value)) {
      selectedQuestions.push(question);
      difficultyCount[difficulty]++;
    }
  });

  // Second pass: fill remaining slots if any
  if (selectedQuestions.length < Number(questionCount.value)) {
    uniqueQuestions.forEach(question => {
      if (!selectedQuestions.includes(question) && 
          selectedQuestions.length < Number(questionCount.value)) {
        selectedQuestions.push(question);
      }
    });
  }

  return selectedQuestions;
}

function calculatePredictedScore() {
  const contentCoverage = analyzeContentForCoverage();
  const contentComplexity = analyzeContentComplexity();
  const questionDiversity = analyzeQuestionDiversity();
  
  // Weight factors
  const coverageWeight = 0.4;
  const complexityWeight = 0.3;
  const diversityWeight = 0.3;
  
  // Calculate weighted score
  const predictedScore = (
    contentCoverage * coverageWeight +
    contentComplexity * complexityWeight +
    questionDiversity * diversityWeight
  );
  
  return Math.max(0, Math.min(100, Math.round(predictedScore)));
}

function analyzeContentForCoverage() {
  // Analyze how well the content matches with generated questions
  const totalContent = extractedContent.value.length;
  if (totalContent === 0) return 0;
  
  // Calculate coverage based on content length and number of questions
  const averageContentPerQuestion = 500; // baseline characters per question
  const expectedQuestions = Math.ceil(totalContent / averageContentPerQuestion);
  const actualQuestions = Number(questionCount.value);
  
  const coverage = Math.min(actualQuestions / expectedQuestions, 1) * 100;
  return coverage;
}

function analyzeContentComplexity() {
  const content = extractedContent.value.toLowerCase();
  
  // Define complexity indicators
  const complexityIndicators = [
    'analyze', 'compare', 'contrast', 'evaluate', 'explain',
    'describe', 'discuss', 'examine', 'interpret', 'justify',
    'therefore', 'however', 'although', 'furthermore', 'consequently'
  ];
  
  // Count complexity indicators
  let complexityScore = 0;
  complexityIndicators.forEach(indicator => {
    const regex = new RegExp(indicator, 'g');
    const matches = content.match(regex);
    if (matches) {
      complexityScore += matches.length;
    }
  });
  
  // Normalize score to 0-100 range
  const normalizedScore = Math.min(complexityScore * 5, 100);
  return normalizedScore;
}

function analyzeQuestionDiversity() {
  if (!adaptiveQuestions.value.length) return 0;
  
  // Count different types of questions
  const types = new Set(adaptiveQuestions.value.map(q => q.type));
  const typesDiversity = (types.size / 2) * 50; // 2 is max types (multiple-choice and true-false)
  
  // Analyze question text similarity to ensure diverse topics
  const questionTexts = adaptiveQuestions.value.map(q => q.text.toLowerCase());
  let uniqueTopics = 0;
  const processedKeywords = new Set();
  
  questionTexts.forEach(text => {
    const keywords = text.split(' ')
      .filter(word => word.length > 4) // Consider only significant words
      .map(word => word.replace(/[^a-z]/g, '')); // Clean up words
      
    keywords.forEach(keyword => {
      if (!processedKeywords.has(keyword)) {
        uniqueTopics++;
        processedKeywords.add(keyword);
      }
    });
  });
  
  const topicsDiversity = Math.min(uniqueTopics / questionTexts.length * 50, 50);
  
  return typesDiversity + topicsDiversity;
}

// Results formatting
const formatQuestionsForResults = computed(() => {
  return adaptiveQuestions.value.map((q, index) => ({
    text: q.text,
    type: q.type,
    options: q.options,
    userAnswer: userResponses.value[index]?.userAnswer,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    isCorrect: userResponses.value[index]?.correct
  }));
});

const formatUserAnswersForResults = computed(() => {
  return userResponses.value.map(r => r.userAnswer);
});

const correctAnswersCount = computed(() => {
  return userResponses.value.filter(r => r.correct).length;
});

// Update the calculateScore function
const calculateScore = () => {
  if (!userResponses.value.length) return 0;
  const correctAnswers = userResponses.value.filter(r => r.correct).length;
  return Math.round((correctAnswers / userResponses.value.length) * 100);
};

// Update the saveQuizResults function to handle retakes
const saveQuizResults = () => {
  const quizResult = {
    fileName: selectedFiles.value[0]?.name || 'Untitled Quiz',
    questionCount: Number(questionCount.value),
    predictedScore: predictedScore.value,
    actualScore: calculateScore(),
    date: new Date(),
    fileContent: extractedContent.value
  };
  
  if (isRetaking.value && retakeIndex.value !== -1) {
    // Update existing record
    quizHistory.value[retakeIndex.value] = {
      ...quizHistory.value[retakeIndex.value],
      actualScore: quizResult.actualScore,
      date: quizResult.date
    };
  } else {
    // Add new record
    quizHistory.value.unshift(quizResult);
  }
  
  localStorage.setItem('quizHistory', JSON.stringify(quizHistory.value));
  
  // Reset retake flags
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
    const requestedQuestionCount = Math.min(Number(questionCount.value) * 3, 30);
    
    const response = await generateQuestions(extractedContent.value, requestedQuestionCount);
    const processedQuiz = processQuizResponse(response, extractedContent.value);
    
    adaptiveQuestions.value = selectQuestions(processedQuiz.questions);
    predictedScore.value = calculatePredictedScore();
  } catch (err) {
    error.value = `Error generating questions: ${err.response?.data?.error?.message || err.message}`;
    // Reset retake flags on error
    isRetaking.value = false;
    retakeIndex.value = -1;
  } finally {
    isLoading.value = false;
  }
};

// Update handleCreateQuiz to reset retake flags
const handleCreateQuiz = () => {
  // Reset the quiz state
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
    quizHistory.value = [];
    localStorage.removeItem('quizHistory');
  }
};

// Helper function to check if two questions are too similar
function isSimilarQuestion(q1, q2) {
  // Convert both questions to lowercase and remove punctuation
  const normalize = text => text.toLowerCase().replace(/[^\w\s]/g, '');
  const q1Text = normalize(q1.text);
  const q2Text = normalize(q2.text);

  // If the questions are exactly the same, they're similar
  if (q1Text === q2Text) return true;

  // If they're different types (MC vs T/F), they're not similar
  if (q1.type !== q2.type) return false;

  // For multiple choice questions, check if the options are too similar
  if (q1.type === 'multiple-choice' && q2.type === 'multiple-choice') {
    const q1Options = Object.values(q1.options).map(normalize);
    const q2Options = Object.values(q2.options).map(normalize);
    const commonOptions = q1Options.filter(opt => q2Options.includes(opt));
    if (commonOptions.length >= 3) return true; // If 3 or more options are the same, consider them similar
  }

  // Check for word overlap ratio
  const q1Words = new Set(q1Text.split(/\s+/));
  const q2Words = new Set(q2Text.split(/\s+/));
  const commonWords = new Set([...q1Words].filter(x => q2Words.has(x)));
  const overlapRatio = commonWords.size / Math.min(q1Words.size, q2Words.size);

  return overlapRatio > 0.7; // If more than 70% of words overlap, consider them similar
}
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
  justify-content: center;
}

.upload-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 90%;
  max-width: 600px;
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
</style> 