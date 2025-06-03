<template>
  <div class="create-quiz">
    <div class="upload-container">
      <h1>Create New Quiz</h1>
      
      <div class="file-upload-section">
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
          <div class="error-message" v-for="(error, index) in extractionErrors" :key="'error-'+index">
            {{ error.fileName }}: {{ error.message }}
          </div>
          <div class="error-message" v-for="(file, index) in unsupportedFiles" :key="'unsupported-'+index">
            {{ file.name }}: Unsupported file format
          </div>
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
          {{ isLoading ? 'Generating Questions...' : 'Generate Quiz' }}
        </button>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
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
import { useRouter } from 'vue-router';

const router = useRouter();
const fileInput = ref(null);
const selectedFiles = ref([]);
const unsupportedFiles = ref([]);
const extractionErrors = ref([]);
const questionCount = ref('');
const isLoading = ref(false);
const error = ref('');

const hasFileErrors = computed(() => {
  return extractionErrors.value.length > 0 || unsupportedFiles.value.length > 0;
});

const isFormValid = computed(() => {
  return selectedFiles.value.length > 0 && questionCount.value > 0;
});

onMounted(() => {
  // Check if there's a quiz to retake
  const quizToRetake = localStorage.getItem('quizToRetake');
  if (quizToRetake) {
    const quiz = JSON.parse(quizToRetake);
    questionCount.value = quiz.questionCount.toString();
    // Create a dummy file with the same name
    const file = new File([''], quiz.fileName, { type: 'text/plain' });
    selectedFiles.value = [file];
    localStorage.removeItem('quizToRetake');
  }
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
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
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

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  
  isLoading.value = true;
  error.value = '';
  
  try {
    const quizData = {
      id: crypto.randomUUID(),
      topic: selectedFiles.value[0].name,
      questionCount: Number(questionCount.value),
      created_at: new Date().toISOString(),
      questions: [] // This would normally contain the generated questions
    };

    // Store in localStorage
    const savedQuizzes = JSON.parse(localStorage.getItem('quizzes') || '[]');
    savedQuizzes.unshift(quizData);
    localStorage.setItem('quizzes', JSON.stringify(savedQuizzes));
    
    router.push('/');
  } catch (err) {
    error.value = err.message || 'An error occurred while generating the quiz';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.create-quiz {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.upload-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  text-align: center;
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
}

.upload-area:hover {
  border-color: #2196F3;
  background-color: #f8f9fa;
}

.file-input {
  display: none;
}

.supported-formats {
  margin-top: 1rem;
  text-align: left;
  display: inline-block;
}

.supported-formats ul {
  list-style: none;
  padding: 0;
}

.format-icon {
  margin-right: 0.5rem;
}

.selected-files {
  margin-top: 1.5rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.remove-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0 0.5rem;
}

.questions-section {
  margin-top: 2rem;
}

.question-input input {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  margin-top: 2rem;
  transition: all 0.3s ease;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background-color: #45a049;
  transform: translateY(-2px);
}

.error-section {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  border-radius: 4px;
}

.error-message {
  color: #856404;
  margin-bottom: 0.5rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.typewriter {
  font-size: 1.5rem;
  color: #333;
}

.dots {
  display: flex;
}

.dots span {
  font-size: 1.5rem;
  color: #333;
  animation: dot 1.4s infinite;
  animation-fill-mode: both;
}

.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}
</style> 