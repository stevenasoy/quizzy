<template>
  <div class="auth-modal" v-if="show">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      
      <div class="auth-tabs">
        <button 
          :class="['tab-btn', { active: activeTab === 'login' }]" 
          @click="activeTab = 'login'"
        >
          Login
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'signup' }]" 
          @click="activeTab = 'signup'"
        >
          Sign Up
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="login-email">Email</label>
          <input 
            type="email" 
            id="login-email" 
            v-model="loginForm.email" 
            required
            placeholder="Enter your email"
          >
        </div>
        <div class="form-group">
          <label for="login-password">Password</label>
          <input 
            type="password" 
            id="login-password" 
            v-model="loginForm.password" 
            required
            placeholder="Enter your password"
          >
        </div>
        <button type="submit" class="submit-btn">Login</button>
        <p class="forgot-password">
          <a href="#" @click.prevent="handleForgotPassword">Forgot Password?</a>
        </p>
      </form>

      <!-- Sign Up Form -->
      <form v-else @submit.prevent="handleSignup" class="auth-form">
        <div class="form-group">
          <label for="signup-name">Full Name</label>
          <input 
            type="text" 
            id="signup-name" 
            v-model="signupForm.name" 
            required
            placeholder="Enter your full name"
          >
        </div>
        <div class="form-group">
          <label for="signup-email">Email</label>
          <input 
            type="email" 
            id="signup-email" 
            v-model="signupForm.email" 
            required
            placeholder="Enter your email"
          >
        </div>
        <div class="form-group">
          <label for="signup-password">Password</label>
          <input 
            type="password" 
            id="signup-password" 
            v-model="signupForm.password" 
            required
            placeholder="Create a password"
          >
        </div>
        <div class="form-group">
          <label for="signup-confirm-password">Confirm Password</label>
          <input 
            type="password" 
            id="signup-confirm-password" 
            v-model="signupForm.confirmPassword" 
            required
            placeholder="Confirm your password"
          >
        </div>
        <button type="submit" class="submit-btn">Sign Up</button>
      </form>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'login', 'signup']);

const activeTab = ref('login');
const error = ref('');

// Watch for show prop changes to reset forms
watch(() => props.show, (newValue) => {
  if (newValue) {
    // Reset forms when modal is opened
    loginForm.value = {
      email: '',
      password: ''
    };
    signupForm.value = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    error.value = '';
    activeTab.value = 'login';
  }
});

const loginForm = ref({
  email: '',
  password: ''
});

const signupForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const handleLogin = () => {
  error.value = '';
  // Add validation here
  emit('login', loginForm.value);
};

const handleSignup = () => {
  error.value = '';
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    error.value = 'Passwords do not match';
    return;
  }
  // Add validation here
  emit('signup', signupForm.value);
};

const handleForgotPassword = () => {
  // Implement forgot password functionality
  console.log('Forgot password clicked');
};
</script>

<style scoped>
.auth-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 400px;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0.5rem;
}

.close-btn:hover {
  color: #333;
}

.auth-tabs {
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 2px solid #f0f0f0;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #2196F3;
  border-bottom: 2px solid #2196F3;
  margin-bottom: -2px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.9rem;
  color: #666;
}

.form-group input {
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #2196F3;
}

.submit-btn {
  padding: 1rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.submit-btn:hover {
  background-color: #1976D2;
}

.forgot-password {
  text-align: center;
  margin-top: 1rem;
}

.forgot-password a {
  color: #2196F3;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-password a:hover {
  text-decoration: underline;
}

.error-message {
  color: #f44336;
  text-align: center;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style> 