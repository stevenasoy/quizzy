<template>
  <div class="file-error-display" v-if="hasErrors">
    <div class="error-section" v-if="extractionErrors.length > 0">
      <h3 class="error-title">
        <span class="error-icon">⚠️</span>
        File Extraction Errors
      </h3>
      <ul class="error-list">
        <li v-for="(error, index) in extractionErrors" :key="index" class="error-item">
          <div class="error-header">
            <span class="file-name">{{ error.fileName }}</span>
            <span class="error-type">(Extraction Failed)</span>
          </div>
          <p class="error-message">{{ error.message }}</p>
        </li>
      </ul>
    </div>

    <div class="error-section" v-if="unsupportedFiles.length > 0">
      <h3 class="error-title">
        <span class="error-icon">❌</span>
        Unsupported Files
      </h3>
      <ul class="error-list">
        <li v-for="(file, index) in unsupportedFiles" :key="index" class="error-item">
          <div class="error-header">
            <span class="file-name">{{ file.name }}</span>
            <span class="error-type">(Unsupported Format)</span>
          </div>
          <p class="error-message">
            This file type is not supported. Supported formats are: PDF, DOCX, PPTX, TXT, PNG, JPG, JPEG, TIFF, BMP
          </p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  extractionErrors: {
    type: Array,
    default: () => []
  },
  unsupportedFiles: {
    type: Array,
    default: () => []
  }
});

const hasErrors = computed(() => {
  return props.extractionErrors.length > 0 || props.unsupportedFiles.length > 0;
});
</script>

<style scoped>
.file-error-display {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #fff5f5;
  border-radius: 8px;
  border: 1px solid #ffdddd;
}

.error-section {
  margin-bottom: 1.5rem;
}

.error-section:last-child {
  margin-bottom: 0;
}

.error-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #d32f2f;
  margin-bottom: 1rem;
  font-size: 1.1em;
}

.error-icon {
  font-size: 1.2em;
}

.error-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.error-item {
  background-color: white;
  border: 1px solid #ffdddd;
  border-radius: 6px;
  padding: 0.8rem;
  margin-bottom: 0.8rem;
}

.error-item:last-child {
  margin-bottom: 0;
}

.error-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.file-name {
  font-weight: 500;
  color: #333;
  word-break: break-word;
  flex: 1;
  margin-right: 1rem;
}

.error-type {
  color: #d32f2f;
  font-size: 0.9em;
  white-space: nowrap;
}

.error-message {
  color: #666;
  font-size: 0.9em;
  margin: 0;
  padding-left: 0.5rem;
  border-left: 3px solid #ffdddd;
}
</style> 