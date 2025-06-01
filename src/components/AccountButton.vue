<template>
  <div class="account-button">
    <button 
      class="user-icon" 
      :title="user ? 'Account' : 'Login / Sign Up'"
      @click="handleAccountClick"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>

    <!-- User Menu (when logged in) -->
    <div v-if="user && showMenu" class="user-menu">
      <div class="user-info">
        <span class="user-name">{{ user.user_metadata.name || user.email }}</span>
        <span class="user-email">{{ user.email }}</span>
      </div>
      <div class="menu-items">
        <button class="menu-item" @click="handleProfile">
          <span>Profile</span>
        </button>
        <button class="menu-item" @click="handleSettings">
          <span>Settings</span>
        </button>
        <button class="menu-item logout" @click="handleLogout">
          <span>Logout</span>
        </button>
      </div>
    </div>

    <!-- Auth Modal -->
    <AuthModal 
      :show="showAuthModal"
      @close="showAuthModal = false"
      @login="handleLogin"
      @signup="handleSignup"
      @resendConfirmation="handleResendConfirmation"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';
import { useQuizHistory } from '../composables/useQuizHistory';
import { supabase } from '../lib/supabase';
import AuthModal from './AuthModal.vue';

const { user, signIn, signUp, signOut, temporaryHistory } = useAuth();
const { migrateTemporaryHistory } = useQuizHistory();

const showMenu = ref(false);
const showAuthModal = ref(false);

const handleAccountClick = () => {
  if (user.value) {
    showMenu.value = !showMenu.value;
  } else {
    showAuthModal.value = true;
  }
};

const handleLogin = async (credentials) => {
  try {
    console.log('Attempting login with:', { ...credentials, password: '***' });
    const { data, error } = await signIn(credentials);
    
    if (error) {
      console.error('Login error:', error);
      throw error;
    }

    if (data) {
      showAuthModal.value = false;
      // Ask user if they want to migrate temporary history
      if (temporaryHistory.value.length > 0) {
        const shouldMigrate = confirm(
          'Would you like to save your quiz history to your account?'
        );
        if (shouldMigrate) {
          await migrateTemporaryHistory();
        }
      }
      return { success: true };
    }
  } catch (err) {
    console.error('Login error:', err);
    throw err;
  }
};

const handleSignup = async (userData) => {
  try {
    console.log('Attempting signup with:', { ...userData, password: '***' });
    const { data, error } = await signUp(userData);
    console.log('Signup response:', { data, error });
    
    if (error) {
      console.error('Signup error:', error);
      throw error;
    }

    if (data) {
      // Check if email confirmation was sent
      if (!data.user?.confirmation_sent_at) {
        console.error('Email confirmation was not sent');
        throw new Error('Failed to send confirmation email. Please try again or contact support.');
      }

      console.log('Email confirmation sent at:', data.user.confirmation_sent_at);
      showAuthModal.value = false;
      // Automatically migrate temporary history for new users
      if (temporaryHistory.value.length > 0) {
        await migrateTemporaryHistory();
      }
      return { success: true };
    }
  } catch (err) {
    console.error('Signup error:', err);
    throw err;
  }
};

const handleLogout = async () => {
  await signOut();
  showMenu.value = false;
};

const handleProfile = () => {
  // Implement profile navigation
  console.log('Navigate to profile');
  showMenu.value = false;
};

const handleSettings = () => {
  // Implement settings navigation
  console.log('Navigate to settings');
  showMenu.value = false;
};

const handleResendConfirmation = async (email) => {
  try {
    console.log('Attempting to resend confirmation email to:', email);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) {
      console.error('Error resending confirmation:', error);
      throw error;
    }

    console.log('Confirmation email resent successfully');
    return { success: true };
  } catch (err) {
    console.error('Error resending confirmation email:', err);
    throw err;
  }
};

// Close menu when clicking outside
const handleClickOutside = (event) => {
  if (showMenu.value && !event.target.closest('.account-button')) {
    showMenu.value = false;
  }
};

// Add click outside listener
window.addEventListener('click', handleClickOutside);
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

.user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 240px;
  overflow: hidden;
}

.user-info {
  padding: 1rem;
  background: #f8f9fa;
  border-bottom: 1px solid #eee;
}

.user-name {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.user-email {
  display: block;
  font-size: 0.9rem;
  color: #666;
}

.menu-items {
  padding: 0.5rem;
}

.menu-item {
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  color: #333;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-item.logout {
  color: #f44336;
}

.menu-item.logout:hover {
  background-color: #ffebee;
}
</style> 