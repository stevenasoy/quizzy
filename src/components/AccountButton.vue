<template>
  <div class="account-button">
    <button 
      class="user-icon" 
      :title="isAuthenticated ? 'Account' : 'Login / Sign Up'"
      @click="handleAccountClick"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </button>

    <!-- User Menu (when logged in) -->
    <div v-if="isAuthenticated && showMenu" class="user-menu">
      <div class="user-info">
        <span class="user-name">{{ user.name }}</span>
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
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import AuthModal from './AuthModal.vue';
import { useAuth } from '../composables/useAuth';

const { user, isAuthenticated, login, signup, logout } = useAuth();
const showMenu = ref(false);
const showAuthModal = ref(false);

const handleAccountClick = () => {
  if (isAuthenticated.value) {
    showMenu.value = !showMenu.value;
  } else {
    showAuthModal.value = true;
  }
};

const handleLogin = async (credentials) => {
  try {
    const success = await login(credentials);
    if (success) {
      showAuthModal.value = false;
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
};

const handleSignup = async (userData) => {
  try {
    const success = await signup(userData);
    if (success) {
      showAuthModal.value = false;
    }
  } catch (error) {
    console.error('Signup failed:', error);
  }
};

const handleLogout = async () => {
  try {
    await logout();
    showMenu.value = false;
  } catch (error) {
    console.error('Logout failed:', error);
  }
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