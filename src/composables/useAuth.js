import { ref } from 'vue';

export function useAuth() {
  const user = ref(null);
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  const login = async (credentials) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Here you would make your actual API call
      // For now, we'll simulate a successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      user.value = {
        id: '1',
        name: 'John Doe',
        email: credentials.email,
      };
      isAuthenticated.value = true;
      return true;
    } catch (e) {
      error.value = 'Failed to login. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const signup = async (userData) => {
    isLoading.value = true;
    error.value = null;
    try {
      // Here you would make your actual API call
      // For now, we'll simulate a successful signup
      await new Promise(resolve => setTimeout(resolve, 1000));
      user.value = {
        id: '1',
        name: userData.name,
        email: userData.email,
      };
      isAuthenticated.value = true;
      return true;
    } catch (e) {
      error.value = 'Failed to create account. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    isLoading.value = true;
    try {
      // Here you would make your actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      user.value = null;
      isAuthenticated.value = false;
      return true;
    } catch (e) {
      error.value = 'Failed to logout. Please try again.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    signup,
    logout
  };
} 