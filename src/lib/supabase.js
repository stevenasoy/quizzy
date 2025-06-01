import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.VUE_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Initializing Supabase with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Auth helper functions
export const auth = {
  async signUp({ email, password, ...metadata }) {
    console.log('Supabase signUp called with:', { email, metadata });
    try {
      // First, create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,  // Store name in auth metadata as backup
            email: email
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (authError) {
        console.error('Signup auth error:', authError);
        // Handle specific auth errors
        if (authError.message?.toLowerCase().includes('user already registered')) {
          throw new Error('This email is already registered. Please try logging in instead.');
        }
        throw authError;
      }

      // Then, try to create the user profile in the users table
      if (authData?.user) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                email: email,
                name: metadata.name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_login: new Date().toISOString()
              }
            ]);

          if (profileError) {
            // Log the error but don't throw since the auth user was created successfully
            console.warn('Non-critical error creating user profile:', profileError);
          }
        } catch (profileError) {
          // Log the error but don't throw since the auth user was created successfully
          console.warn('Non-critical error in profile creation:', profileError);
        }
      }

      console.log('Signup successful:', authData);
      return { data: authData, error: null };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  async signIn({ email, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and confirm your account before signing in.');
        }
        throw error;
      }

      // Update last login timestamp
      if (data?.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id);

        if (updateError) {
          console.error('Error updating last login:', updateError);
        }
      }

      console.log('Sign in successful:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // User profile management
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }
};

// Quiz history database operations
export const quizHistory = {
  async saveQuiz(quizData) {
    try {
      const { data, error } = await supabase
        .from('quiz_history')
        .insert([quizData])
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Save quiz error:', error);
      throw error;
    }
  },

  async getQuizzes() {
    try {
      const { data, error } = await supabase
        .from('quiz_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get quizzes error:', error);
      throw error;
    }
  },

  async migrateTemporaryHistory(quizzes) {
    try {
      const { data, error } = await supabase
        .from('quiz_history')
        .insert(quizzes)
        .select();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Migrate history error:', error);
      throw error;
    }
  }
}; 