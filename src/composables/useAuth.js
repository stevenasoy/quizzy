import { ref, onMounted } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { auth } from '../lib/supabase';

export function useAuth() {
  const user = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  // Store temporary quiz history
  const temporaryHistory = useLocalStorage('temporaryQuizHistory', []);

  // Initialize auth state
  onMounted(async () => {
    try {
      const { session } = await auth.getSession();
      user.value = session?.user || null;
    } catch (err) {
      error.value = err.message;
      console.error('Auth initialization error:', err);
    } finally {
      isLoading.value = false;
    }

    // Listen for auth state changes
    auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      user.value = session?.user || null;
    });
  });

  const signUp = async ({ email, password, name }) => {
    error.value = null;
    isLoading.value = true;
    try {
      console.log('Signing up with:', { email, name });
      const { data, error: signUpError } = await auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            avatar_url: null
          }
        }
      });
      
      if (signUpError) throw signUpError;
      console.log('Signup successful:', data);
      return { data, error: null };
    } catch (err) {
      console.error('Signup error in composable:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      isLoading.value = false;
    }
  };

  const signIn = async ({ email, password }) => {
    error.value = null;
    isLoading.value = true;
    try {
      const { data, error: signInError } = await auth.signIn({
        email,
        password
      });
      if (signInError) throw signInError;
      return { data, error: null };
    } catch (err) {
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      isLoading.value = false;
    }
  };

  const signOut = async () => {
    error.value = null;
    try {
      const { error: signOutError } = await auth.signOut();
      if (signOutError) throw signOutError;
    } catch (err) {
      error.value = err.message;
      console.error('Signout error:', err);
    }
  };

  return {
    user,
    isLoading,
    error,
    temporaryHistory,
    signUp,
    signIn,
    signOut
  };
} 