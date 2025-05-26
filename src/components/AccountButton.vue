<template>
  <div class="account-button">
    <button class="user-icon" title="Account">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>
  </div>
</template>

<script setup>
// Account button logic will go here later
</script>

<style scoped>
.account-button {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
}

.user-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  background-color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-icon:hover {
  background-color: #f5f5f5;
  color: #2196F3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
</style> 