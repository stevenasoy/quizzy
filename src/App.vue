<template>
  <div class="app-container">
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
            accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg,.tiff,.bmp"
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
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import FileErrorDisplay from './components/FileErrorDisplay.vue';
import QuizResults from './components/QuizResults.vue';
import FlashcardQuiz from './components/FlashcardQuiz.vue';

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

  try {
    const fileContents = await Promise.all(
      selectedFiles.value.map(file => readFileContent(file))
    );

    extractedContent.value = fileContents.join('\n\n');
    const requestedQuestionCount = Math.min(Number(questionCount.value) * 3, 30);
    
    const response = await generateQuestions(extractedContent.value, requestedQuestionCount);
    const processedQuiz = processQuizResponse(response, extractedContent.value);
    
    adaptiveQuestions.value = selectQuestions(processedQuiz.questions);
    predictedScore.value = calculatePredictedScore();

  } catch (err) {
    error.value = `Error generating questions: ${err.response?.data?.error?.message || err.message}`;
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
  quizStarted.value = false;
  quizFinished.value = true;
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
    if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type.startsWith('image/')
    ) {
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
            resolve("[Could not extract file text]");
          }
        })
        .catch(() => {
          extractionErrors.value.push({
            fileName: file.name,
            message: 'Server error while extracting text'
          });
          resolve("[Could not extract file text]");
        });
    } else if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => {
        extractionErrors.value.push({
          fileName: file.name,
          message: 'Error reading text file'
        });
        resolve("[Could not read file]");
      };
      reader.readAsText(file);
    } else {
      resolve(`[${file.name} is not a supported file type.]`);
    }
  });
}

async function generateQuestions(content, count) {
  const prompt = `Create a quiz with ${count} COMPLETELY UNIQUE and DIVERSE questions based on this text. Each question MUST cover a different concept or aspect. NO REPETITIVE or SIMILAR questions allowed.

CRITICAL REQUIREMENTS:
1. Each explanation MUST be a direct quote or paraphrased content from the original text
2. Explanations should reference specific parts of the text that justify the correct answer
3. Do NOT make up explanations - they must be based on the actual content provided
4. If a concept isn't clearly explained in the text, don't create a question about it
5. Automatically determine appropriate difficulty (easy/medium/hard) based on:
   - Easy: Basic facts, definitions, or simple concepts
   - Medium: Understanding relationships between concepts
   - Hard: Analysis, evaluation, or complex relationships

Format requirements for each question:

For multiple choice questions:
1. Question: [unique question text]
2. Options (mark correct with *):
   A) [option]
   B) [option]
   C) [option]
   D) [option]
3. Explanation: [quote or paraphrase relevant text that explains the correct answer]
4. Difficulty: [AI determines: easy|medium|hard]

For true/false questions:
1. True/False: [unique question text]
2. Answer: [Write ONLY "True*" if true is correct, or "False*" if false is correct]
3. Explanation: [quote or paraphrase relevant text that explains why the statement is true or false]
4. Difficulty: [AI determines: easy|medium|hard]

IMPORTANT:
- Each question MUST cover a different topic/concept
- NO similar or overlapping questions
- Make questions engaging and thought-provoking
- Ensure clear, unambiguous wording
- ALL explanations must come from the provided text
- For true/false questions, ALWAYS mark the correct answer with an asterisk (*)
- Distribute difficulties naturally based on content complexity

Text to base questions on:
${content}`;

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.VUE_APP_GEMINI_API_KEY}`,
    {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
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

  return response.data.candidates[0].content.parts[0].text;
}

function processQuizResponse(response, content) {
  const questions = [];
  const lines = response.split('\n');
  let currentQuestion = null;
  let collectingOptions = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    if (/^\d*\.?\s*(Question:|Q:|Easy Question:|Hard Question:|Medium Question:)/i.test(line)) {
      if (currentQuestion) {
        findExplanationFromContent(currentQuestion, content);
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: line.replace(/^\d*\.?\s*(Question:|Q:|Easy Question:|Hard Question:|Medium Question:)/i, '').trim(),
        type: 'multiple-choice',
        options: {},
        correctAnswer: '',
        explanation: '',
        difficulty: 'medium'
      };
      collectingOptions = true;
    } else if (/^\d*\.?\s*(True\/False:|True or False:)/i.test(line)) {
      if (currentQuestion) {
        findExplanationFromContent(currentQuestion, content);
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: line.replace(/^\d*\.?\s*(True\/False:|True or False:)/i, '').trim(),
        type: 'true-false',
        options: { 
          'true': 'True',
          'false': 'False'
        },
        correctAnswer: '',
        explanation: '',
        difficulty: 'medium'
      };
      collectingOptions = true;
    } else if (currentQuestion && collectingOptions) {
      if (currentQuestion.type === 'multiple-choice') {
        const optionMatch = line.match(/^([A-Da-d])[).]\s*(.*)/);
        if (optionMatch) {
          const letter = optionMatch[1].toUpperCase();
          let option = optionMatch[2].trim();
          
          // Check for asterisk at start or end of option
          if (option.startsWith('*') || option.endsWith('*')) {
            currentQuestion.correctAnswer = letter;
            option = option.replace(/^\*|\*$/g, '').trim();
          }
          currentQuestion.options[letter] = option;
        } else if (line.toLowerCase().startsWith('explanation:')) {
          collectingOptions = false;
        }
      } else if (currentQuestion.type === 'true-false') {
        // Look for the Answer: line specifically
        if (line.toLowerCase().startsWith('answer:')) {
          const answer = line.substring(7).trim().toLowerCase();
          if (answer.includes('true*') || answer.includes('*true')) {
            currentQuestion.correctAnswer = 'true';
          } else if (answer.includes('false*') || answer.includes('*false')) {
            currentQuestion.correctAnswer = 'false';
          }
        } else if (line.toLowerCase().startsWith('explanation:')) {
          collectingOptions = false;
        }
      }
    }
  }
  
  if (currentQuestion) {
    findExplanationFromContent(currentQuestion, content);
    questions.push(currentQuestion);
  }

  // Validate and fix questions
  const validQuestions = questions.filter(q => {
    if (q.type === 'multiple-choice') {
      // Must have at least 2 options and a correct answer
      const hasEnoughOptions = Object.keys(q.options).length >= 2;
      if (!hasEnoughOptions || !q.correctAnswer) {
        console.warn('Invalid multiple choice question:', q);
        return false;
      }
      return true;
    } else if (q.type === 'true-false') {
      // For true/false questions, try to infer the answer from the explanation if not explicitly set
      if (!q.correctAnswer && q.explanation) {
        const lowerExplanation = q.explanation.toLowerCase();
        if (lowerExplanation.includes('this statement is true')) {
          q.correctAnswer = 'true';
        } else if (lowerExplanation.includes('this statement is false')) {
          q.correctAnswer = 'false';
        }
      }
      
      // If still no answer, warn and default to false (since defaulting to true might be misleading)
      if (!q.correctAnswer) {
        console.warn('True/False question missing correct answer, inferring from context:', q);
        // Look for negative indicators in the question
        const questionLower = q.text.toLowerCase();
        const hasNegativeIndicators = ['only', 'solely', 'never', 'always', 'all', 'none'].some(word => 
          questionLower.includes(word)
        );
        q.correctAnswer = hasNegativeIndicators ? 'false' : 'true';
      }
      return true;
    }
    return false;
  });

  if (validQuestions.length === 0) {
    throw new Error('No valid questions could be generated from the content.');
  }
  
  return { questions: validQuestions };
}

// New helper function to find explanations from content
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
  
  // Find the most relevant paragraph
  let bestMatch = {
    paragraph: '',
    matchCount: 0,
    matchScore: 0
  };

  paragraphs.forEach(paragraph => {
    const normalizedParagraph = paragraph.toLowerCase();
    let matchCount = 0;
    let score = 0;
    
    // Check for exact phrase matches first
    if (normalizedParagraph.includes(question.text.toLowerCase())) {
      score += 10;
    }
    
    // Then check individual terms
    searchTerms.forEach(term => {
      if (normalizedParagraph.includes(term)) {
        matchCount++;
        score += 1;
        
        // Bonus points for terms appearing in close proximity
        const termIndex = normalizedParagraph.indexOf(term);
        searchTerms.forEach(otherTerm => {
          if (term !== otherTerm) {
            const otherIndex = normalizedParagraph.indexOf(otherTerm);
            if (otherIndex !== -1 && Math.abs(termIndex - otherIndex) < 50) {
              score += 0.5;
            }
          }
        });
      }
    });

    if (score > bestMatch.matchScore || (score === bestMatch.matchScore && matchCount > bestMatch.matchCount)) {
      bestMatch = {
        paragraph: paragraph.trim(),
        matchCount,
        matchScore: score
      };
    }
  });

  // If we found a matching paragraph, create an explanation
  if (bestMatch.matchScore > 0) {
    let explanation = bestMatch.paragraph;
    
    // Trim the explanation if it's too long
    if (explanation.length > 200) {
      const sentences = explanation.match(/[^.!?]+[.!?]+/g) || [];
      explanation = sentences
        .filter(sentence => 
          searchTerms.some(term => sentence.toLowerCase().includes(term))
        )
        .join(' ');
    }
    
    // Add context about correctness
    if (question.type === 'true-false') {
      const isTrue = question.correctAnswer === 'true';
      explanation = `This statement is ${isTrue ? 'true' : 'false'} because: ${explanation}`;
    } else {
      explanation = `The correct answer is "${question.options[question.correctAnswer]}" because: ${explanation}`;
    }
    
    question.explanation = explanation;
  } else {
    // Fallback explanation
    if (question.type === 'true-false') {
      question.explanation = `This statement is ${question.correctAnswer === 'true' ? 'true' : 'false'} according to the provided content.`;
    } else {
      question.explanation = `The correct answer is "${question.options[question.correctAnswer]}" based on the provided content.`;
    }
  }
}

function selectQuestions(questions) {
  const shuffledQuestions = [...questions]
    .sort(() => Math.random() - 0.5)
    .filter((question, index, self) => 
      index === self.findIndex((q) => 
        q.text.toLowerCase().replace(/[^\w\s]/g, '') === 
        question.text.toLowerCase().replace(/[^\w\s]/g, '')
      )
    );

  const selectedQuestions = [];
  const targetPerDifficulty = Math.ceil(Number(questionCount.value) / 3);
  const difficultyCount = { easy: 0, medium: 0, hard: 0 };

  for (const difficulty of ['easy', 'medium', 'hard']) {
    const questionsOfDifficulty = shuffledQuestions.filter(q => 
      q.difficulty === difficulty && !selectedQuestions.includes(q)
    );
    
    for (const question of questionsOfDifficulty) {
      if (difficultyCount[difficulty] < targetPerDifficulty && 
          selectedQuestions.length < Number(questionCount.value)) {
        selectedQuestions.push(question);
        difficultyCount[difficulty]++;
      }
    }
  }

  while (selectedQuestions.length < Number(questionCount.value)) {
    const remainingQuestion = shuffledQuestions.find(q => !selectedQuestions.includes(q));
    if (remainingQuestion) {
      selectedQuestions.push(remainingQuestion);
    } else {
      break;
    }
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
</script>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  font-family: "Helvetica", "Arial", sans-serif;
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
</style> 