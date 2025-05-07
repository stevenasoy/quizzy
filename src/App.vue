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
            <p>Supported formats: PDF, DOCX, PPTX, TXT, PNG, JPG, JPEG, TIFF, BMP</p>
          </div>
        </div>
        
        <div v-if="selectedFiles.length > 0" class="selected-files">
          <h3>Selected Files:</h3>
          <ul>
            <li v-for="(file, index) in selectedFiles" :key="index">
              {{ file.name }}
              <button @click="removeFile(index)" class="remove-btn">×</button>
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

      <FlashcardQuiz
        v-else
        :questions="flashcardQuestions"
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
import FlashcardQuiz from './components/FlashcardQuiz.vue';

const selectedFiles = ref([]);
const questionCount = ref('');
const fileInput = ref(null);
const generatedQuestions = ref([]);
const isLoading = ref(false);
const error = ref('');
const showQuestions = ref(false);
const flashcardQuestions = ref([]);

const isFormValid = computed(() => {
  return selectedFiles.value.length > 0 && questionCount.value > 0;
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
  const validFiles = files.filter(file => {
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
    return validTypes.includes(file.type);
  });
  
  selectedFiles.value = [...selectedFiles.value, ...validFiles];
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    if (
      file.type === "application/pdf" ||
      file.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type.startsWith('image/')
    ) {
      // PDF, PPTX, DOCX, or Image - send to backend for extraction
      const formData = new FormData();
      formData.append('file', file);
      fetch(process.env.VUE_APP_API_URL || 'http://127.0.0.1:5001/extract-file', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.text) resolve(data.text);
          else resolve("[Could not extract file text]");
        })
        .catch(() => resolve("[Could not extract file text]"));
    } else if (file.type === "text/plain") {
      // Plain text
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
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
    console.log('Extracted file content sent to Gemini:', combinedContent);

    // Prepare the prompt for Gemini
    const prompt = `You are a quiz generator. ONLY use the following content to create exactly ${questionCount.value} multiple-choice questions (with 4 options each and the correct answer indicated). \nDo NOT use any outside knowledge. \nFormat each question as:\nQuestion: <question text>\nA) <option 1>\nB) <option 2>\nC) <option 3>\nD) <option 4>\nAnswer: <correct option letter>\nCONTENT TO USE:\n${combinedContent}`;

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

    // Parse Gemini's response into flashcard questions
    const generatedText = response.data.candidates[0].content.parts[0].text;
    const parsedQuestions = parseFlashcardQuestions(generatedText);
    flashcardQuestions.value = parsedQuestions;
    showQuestions.value = true;
  } catch (err) {
    console.error('Detailed Error:', err.response ? err.response.data : err);
    error.value = `Error generating questions: ${err.response ? err.response.data.error?.message || 'Unknown error' : err.message}`;
  } finally {
    isLoading.value = false;
  }
};

function parseFlashcardQuestions(text) {
  // Split by 'Question:' and parse each block
  const blocks = text.split(/\n?Question:/).map(b => b.trim()).filter(Boolean);
  const questions = blocks.map(block => {
    const lines = block.split('\n').map(l => l.trim());
    const textLine = lines[0];
    const options = ['A', 'B', 'C', 'D'].map(letter => {
      const optLine = lines.find(l => l.startsWith(letter + ')'));
      return { letter, text: optLine ? optLine.slice(3).trim() : '' };
    });
    const answerLine = lines.find(l => l.startsWith('Answer:'));
    const answer = answerLine ? answerLine.replace('Answer:', '').trim() : '';
    return {
      text: textLine,
      options,
      answer
    };
  }).filter(q => q.text && q.options.every(o => o.text) && q.answer);
  return questions;
}

function resetToMainScreen() {
  showQuestions.value = false;
  flashcardQuestions.value = [];
  generatedQuestions.value = [];
  selectedFiles.value = [];
  questionCount.value = '';
}
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
</style> 