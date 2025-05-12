<template>
  <div class="app-container">
    <div class="upload-container">
      <h1>QUIZZy</h1>
      
      <div v-if="!showQuestions" class="file-upload-section">
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
            <p>Supported formats: PDF, DOCX, PPTX, TXT</p>
          </div>
        </div>
        
        <FileErrorDisplay
          :extraction-errors="extractionErrors"
          :unsupported-files="unsupportedFiles"
        />

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

      <div v-else-if="!hasFileErrors && flashcardQuestions.length > 0">
        <FlashcardQuiz
          :questions="flashcardQuestions"
          @go-back="resetToMainScreen"
        />
      </div>

      <div v-else-if="hasFileErrors">
        <FileErrorDisplay
          :extraction-errors="extractionErrors"
          :unsupported-files="unsupportedFiles"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>

    <template v-if="quiz">
      <div class="quiz-container">
        <h2>Generated Quiz</h2>
        <template v-for="(question, index) in quiz.questions" :key="index">
          <div class="question">
            <h3>Question {{ index + 1 }}: {{ question.text }}</h3>
            <div class="options">
              <template v-if="question.type === 'multiple-choice'">
                <div v-for="(option, letter) in question.options" :key="letter" class="option">
                  <input
                    type="radio"
                    :id="`q${index}-${letter}`"
                    :name="`question${index}`"
                    :value="letter"
                    v-model="userAnswers[index]"
                  />
                  <label :for="`q${index}-${letter}`">{{ letter }}) {{ option }}</label>
                </div>
              </template>
              <template v-else-if="question.type === 'true-false'">
                <TrueFalseQuestion
                  :index="index"
                  :correct-answer="question.correctAnswer"
                  :explanation="question.explanation"
                  :show-feedback="showAnswers && userAnswers[index]"
                  @update:answer="userAnswers[index] = $event"
                />
              </template>
            </div>
            <div v-if="showAnswers && userAnswers[index]" class="feedback">
              <p :class="{ 'correct': userAnswers[index] === question.correctAnswer, 'incorrect': userAnswers[index] !== question.correctAnswer }">
                {{ userAnswers[index] === question.correctAnswer ? 'Correct!' : 'Incorrect!' }}
              </p>
              <p class="explanation">{{ question.explanation }}</p>
            </div>
          </div>
        </template>
        <button @click="checkAnswers" :disabled="!allQuestionsAnswered">Check Answers</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import FlashcardQuiz from './components/FlashcardQuiz.vue';
import TrueFalseQuestion from './components/TrueFalseQuestion.vue';
import FileErrorDisplay from './components/FileErrorDisplay.vue';

const selectedFiles = ref([]);
const questionCount = ref('');
const fileInput = ref(null);
const generatedQuestions = ref([]);
const isLoading = ref(false);
const error = ref('');
const showQuestions = ref(false);
const flashcardQuestions = ref([]);
const quiz = ref(null);
const userAnswers = ref([]);
const showAnswers = ref(false);
const unsupportedFiles = ref([]);
const extractionErrors = ref([]);

const isFormValid = computed(() => {
  return selectedFiles.value.length > 0 && questionCount.value > 0;
});

const hasFileErrors = computed(() => {
  return extractionErrors.value.length > 0 || unsupportedFiles.value.length > 0;
});

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

const readFileContent = async (file) => {
  return new Promise((resolve) => {
    if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type.startsWith('image/')
    ) {
      // PDF, PPTX, DOCX, or Image - send to backend for extraction
      const formData = new FormData();
      formData.append('file', file);
      
      // Use the correct backend URL
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
      // Plain text
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
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isLoading.value = true;
  error.value = '';
  generatedQuestions.value = [];
  flashcardQuestions.value = [];

  try {
    // Read all file contents
    const fileContents = await Promise.all(
      selectedFiles.value.map(file => readFileContent(file))
    );

    // Combine all file contents
    const combinedContent = fileContents.join('\n\n');
    console.log('Extracted file content:', combinedContent);

    // Prepare the prompt for Gemini
    const prompt = `Create a quiz with ${questionCount.value} questions based on this text. Format each question exactly as follows:

For multiple choice questions:
1. Start with "Question: [question text]"
2. List options as:
   A) [option text]
   B) [option text]
   C) [option text]
   D) [option text]
   (Mark correct answer with * after the option)
3. Add "Explanation: [explanation text]"

For true/false questions:
1. Start with "True/False: [question text]"
2. List options as:
   True*
   False
   (or vice versa, with * marking correct answer)
3. Add "Explanation: [explanation text]"

Text: ${combinedContent}`;

    console.log('Sending request to Gemini API...');
    console.log('API Key:', process.env.VUE_APP_GEMINI_API_KEY ? 'Present' : 'Missing');

    // Call Gemini API
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
          maxOutputTokens: 1024,
        }
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API Response:', response.data);

    // Process the response for both quiz and flashcards
    const quizText = response.data.candidates[0].content.parts[0].text;
    console.log('Quiz text from API:', quizText);
    
    const processedQuiz = processQuizResponse(quizText);
    console.log('Processed quiz:', processedQuiz);
    
    // Convert quiz questions to flashcard format
    flashcardQuestions.value = processedQuiz.questions.map(q => ({
      text: q.text,
      options: q.type === 'multiple-choice' 
        ? Object.entries(q.options).map(([letter, text]) => ({ letter, text }))
        : [
            { letter: 'T', text: 'True' },
            { letter: 'F', text: 'False' }
          ],
      answer: q.type === 'multiple-choice' ? q.correctAnswer : (q.correctAnswer === 'true' ? 'T' : 'F'),
      explanation: q.explanation
    }));

    console.log('Flashcard questions:', flashcardQuestions.value);
    console.log('Number of flashcard questions:', flashcardQuestions.value.length);

    // Show the flashcard quiz
    showQuestions.value = true;
    console.log('showQuestions set to:', showQuestions.value);
    console.log('Current state:', {
      showQuestions: showQuestions.value,
      flashcardQuestionsLength: flashcardQuestions.value.length,
      hasQuestions: flashcardQuestions.value.length > 0
    });
  } catch (err) {
    console.error('Detailed Error:', err.response ? err.response.data : err);
    error.value = `Error generating questions: ${err.response ? err.response.data.error?.message || 'Unknown error' : err.message}`;
  } finally {
    isLoading.value = false;
  }
};

const resetToMainScreen = () => {
  showQuestions.value = false;
  flashcardQuestions.value = [];
  generatedQuestions.value = [];
  selectedFiles.value = [];
  unsupportedFiles.value = [];
  extractionErrors.value = [];
  questionCount.value = '';
  error.value = '';
  isLoading.value = false;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const checkAnswers = () => {
  showAnswers.value = true;
};

const allQuestionsAnswered = computed(() => {
  return userAnswers.value.length === quiz.value.questions.length;
});

const processQuizResponse = (response) => {
  console.log('Processing quiz response:', response);
  const questions = [];
  const lines = response.split('\n');
  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    console.log('Processing line:', line);

    if (line.startsWith('Question:')) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: line.replace('Question:', '').trim(),
        type: 'multiple-choice',
        options: {},
        correctAnswer: '',
        explanation: ''
      };
      console.log('Created new multiple-choice question:', currentQuestion);
    } else if (line.startsWith('True/False:')) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }
      currentQuestion = {
        text: line.replace('True/False:', '').trim(),
        type: 'true-false',
        options: {
          true: 'True',
          false: 'False'
        },
        correctAnswer: '',
        explanation: ''
      };
      console.log('Created new true/false question:', currentQuestion);
    } else if (currentQuestion) {
      if (line.match(/^[A-D]\)/)) {
        const option = line.substring(2).trim();
        const letter = line[0];
        currentQuestion.options[letter] = option;
        if (option.includes('*')) {
          currentQuestion.correctAnswer = letter;
          currentQuestion.options[letter] = option.replace('*', '').trim();
        }
        console.log('Added option to question:', { letter, option });
      } else if (line === 'True*' || line === 'False*') {
        currentQuestion.correctAnswer = line === 'True*' ? 'true' : 'false';
        console.log('Set true/false answer:', currentQuestion.correctAnswer);
      } else if (line.startsWith('Explanation:')) {
        currentQuestion.explanation = line.replace('Explanation:', '').trim();
        console.log('Added explanation:', currentQuestion.explanation);
      }
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  console.log('Final processed questions:', questions);
  return { questions };
};
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
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.option {
  margin-bottom: 0.5rem;
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

button {
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

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #45a049;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #f8f8f8;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.file-name {
  flex: 1;
  margin-right: 0.5rem;
  word-break: break-word;
}

.remove-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  color: #ff4444;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.remove-btn:hover {
  background-color: #ffeeee;
}

.unsupported-files {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff3f3;
  border-radius: 4px;
  border: 1px solid #ffdddd;
}

.unsupported-files h3 {
  color: #d32f2f;
  margin-bottom: 0.5rem;
}

.unsupported-label {
  color: #d32f2f;
  font-size: 0.9em;
  margin-left: 0.5rem;
}

.unsupported-files .file-item {
  background-color: #fff;
  border: 1px solid #ffdddd;
}
</style> 