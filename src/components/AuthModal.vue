<template>
  <div class="auth-modal" v-if="show">
    <div class="modal-overlay" @click="handleClose"></div>
    <div class="modal-content">
      <button class="close-btn" @click="handleClose">&times;</button>
      
      <!-- Email Confirmation Message -->
      <div v-if="showConfirmationReminder" class="confirmation-message">
        <div class="info-icon">ⓘ</div>
        <h3>Check Your Email First</h3>
        <p>Please confirm your email address before logging in.</p>
        <p class="sub-text">Can't find the email? Check your spam folder or request a new confirmation email.</p>
        <div class="confirmation-actions">
          <button class="resend-btn" @click="handleResendConfirmation" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Resend Confirmation Email' }}
          </button>
          <button class="back-btn" @click="showConfirmationReminder = false">
            Back to Login
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div v-else-if="showSuccessMessage" class="success-message">
        <div class="success-icon">✓</div>
        <h3>Check Your Email!</h3>
        <p>We've sent a confirmation link to <strong>{{ successEmail }}</strong></p>
        <p class="sub-text">Please click the link in the email to complete your registration.</p>
        <div class="confirmation-actions">
          <button class="resend-btn" @click="handleResendConfirmation" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Resend Email' }}
          </button>
          <button class="back-btn" @click="resetAndShowLogin">
            Back to Login
          </button>
        </div>
      </div>

      <!-- Auth Forms -->
      <div v-else>
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

        <!-- Error Message with Action -->
        <div v-if="error" class="error-message">
          {{ error }}
          <div class="error-actions" v-if="isEmailRegisteredError">
            <button class="switch-to-login-btn" @click="switchToLogin">
              Switch to Login
            </button>
          </div>
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
              :disabled="isLoading"
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
              :disabled="isLoading"
            >
          </div>
          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? 'Signing in...' : 'Login' }}
          </button>
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
              minlength="6"
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
              minlength="6"
            >
          </div>
          <button type="submit" class="submit-btn" :disabled="isLoading">
            {{ isLoading ? 'Creating Account...' : 'Sign Up' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

// Reset states when modal is closed
watch(() => props.show, (newValue) => {
  if (!newValue) {
    resetStates();
  }
});

const emit = defineEmits(['close', 'login', 'signup', 'resendConfirmation']);

const activeTab = ref('login');
const error = ref('');
const isLoading = ref(false);
const showSuccessMessage = ref(false);
const showConfirmationReminder = ref(false);
const successEmail = ref('');

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

const resetStates = () => {
  showSuccessMessage.value = false;
  showConfirmationReminder.value = false;
  error.value = '';
  activeTab.value = 'login';
  clearForms();
};

const handleClose = () => {
  resetStates();
  emit('close');
};

const resetAndShowLogin = () => {
  showSuccessMessage.value = false;
  showConfirmationReminder.value = false;
  activeTab.value = 'login';
  error.value = '';
};

const clearForms = () => {
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
};

const handleLogin = async () => {
  error.value = '';
  isLoading.value = true;

  try {
    await emit('login', loginForm.value);
    clearForms();
  } catch (err) {
    error.value = err.message;
    if (err.message.includes('Email not confirmed')) {
      // Show the confirmation reminder after a short delay
      setTimeout(() => {
        showConfirmationReminder.value = true;
      }, 2000);
    }
  } finally {
    isLoading.value = false;
  }
};

const handleSignup = async () => {
  error.value = '';
  isLoading.value = true;

  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    error.value = 'Passwords do not match';
    isLoading.value = false;
    return;
  }

  if (signupForm.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters';
    isLoading.value = false;
    return;
  }

  try {
    await emit('signup', signupForm.value);
    successEmail.value = signupForm.value.email;
    showSuccessMessage.value = true;
    clearForms();
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleForgotPassword = () => {
  // Implement forgot password functionality
  console.log('Forgot password clicked');
};

const handleResendConfirmation = async () => {
  isLoading.value = true;
  try {
    await emit('resendConfirmation', loginForm.value.email);
    error.value = '';
    showConfirmationReminder.value = false;
    alert('Confirmation email has been resent. Please check your inbox.');
  } catch (err) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const isEmailRegisteredError = computed(() => {
  return error.value?.toLowerCase().includes('already registered');
});

const switchToLogin = () => {
  activeTab.value = 'login';
  error.value = '';
  // Pre-fill the login email if we have it
  if (signupForm.value.email) {
    loginForm.value.email = signupForm.value.email;
    loginForm.value.password = ''; // Clear password for security
  }
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
  margin: 1rem 0;
  padding: 1rem;
  background-color: #ffebee;
  border-radius: 6px;
  font-size: 0.9rem;
}

.error-actions {
  margin-top: 0.75rem;
}

.switch-to-login-btn {
  background: none;
  border: none;
  color: #2196F3;
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.5rem 1rem;
}

.switch-to-login-btn:hover {
  color: #1976D2;
  text-decoration: none;
}

.success-message {
  text-align: center;
  padding: 2rem 1rem;
}

.success-icon {
  width: 60px;
  height: 60px;
  background-color: #4CAF50;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
}

.success-message h3 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.success-message p {
  color: #666;
  margin-bottom: 0.5rem;
  line-height: 1.5;
}

.success-message .sub-text {
  font-size: 0.9rem;
  color: #888;
  margin-top: 1rem;
}

.ok-btn {
  margin-top: 1.5rem;
  padding: 0.8rem 2rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.ok-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.confirmation-message {
  text-align: center;
  padding: 2rem 1rem;
}

.info-icon {
  width: 60px;
  height: 60px;
  background-color: #2196F3;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  margin: 0 auto 1.5rem;
}

.confirmation-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.resend-btn {
  padding: 0.8rem 2rem;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.resend-btn:hover {
  background-color: #1976D2;
}

.resend-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.back-btn {
  padding: 0.8rem 2rem;
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.show-confirmation-btn {
  background: none;
  border: none;
  color: #2196F3;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

.show-confirmation-btn:hover {
  color: #1976D2;
}
</style> 