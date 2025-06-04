
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  avatar_url: string | null;
  phone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signUp: (email: string, password: string, userData?: any) => Promise<{ user?: User }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  needsPracticeSetup: boolean;
  setNeedsPracticeSetup: (needs: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPracticeSetup, setNeedsPracticeSetup] = useState(false);

  const fetchProfile = async (userId: string) => {
    console.log('AuthContext: Starting profile fetch for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('AuthContext: Profile fetch error:', error);
        throw error;
      }
      
      console.log('AuthContext: Profile fetched successfully:', data);
      setProfile(data);
      
      // Check if doctor needs practice setup
      if (data.role === 'doctor') {
        await checkDoctorPracticeSetup(userId);
      }
      
      return data;
    } catch (err) {
      console.error('AuthContext: Error fetching profile:', err);
      return null;
    }
  };

  const checkDoctorPracticeSetup = async (userId: string) => {
    try {
      console.log('AuthContext: Checking doctor practice setup for:', userId);
      
      // Check if doctor has a staff record (is part of a practice)
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (staffError) {
        console.error('AuthContext: Error checking staff status:', staffError);
        // Don't set needs setup on error, let them proceed
        setNeedsPracticeSetup(false);
        return;
      }

      if (!staffData) {
        console.log('AuthContext: Doctor has no practice association, needs setup');
        setNeedsPracticeSetup(true);
      } else {
        console.log('AuthContext: Doctor is part of a practice');
        setNeedsPracticeSetup(false);
      }
    } catch (err) {
      console.error('AuthContext: Error in practice setup check:', err);
      setNeedsPracticeSetup(false);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // For new signups, wait a moment for the profile to be created by the trigger
          if (event === 'SIGNED_UP' as AuthChangeEvent) {
            console.log('AuthContext: New signup detected, waiting for profile creation');
            setTimeout(async () => {
              await fetchProfile(session.user.id);
              setIsLoading(false);
            }, 1000);
          } else {
            fetchProfile(session.user.id).finally(() => {
              setIsLoading(false);
            });
          }
        } else {
          setProfile(null);
          setNeedsPracticeSetup(false);
          setIsLoading(false);
        }
      }
    );

    // Get initial session
    console.log('AuthContext: Getting initial session');
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('AuthContext: Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      
      console.log('AuthContext: Initial setup complete, setting isLoading to false');
      setIsLoading(false);
    });

    return () => {
      console.log('AuthContext: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData = {}) => {
    console.log('AuthContext: Starting sign up process');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
      console.log('AuthContext: Sign up successful');
      return { user: data.user };
    } catch (err) {
      console.error('AuthContext: Sign up error:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthContext: Starting sign in process');
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      console.log('AuthContext: Sign in successful');
    } catch (err) {
      console.error('AuthContext: Sign in error:', err);
      setError(err instanceof Error ? err.message : "An error occurred");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    console.log('AuthContext: Starting sign out process');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setNeedsPracticeSetup(false);
    console.log('AuthContext: Sign out successful');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isLoading,
        error,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!session,
        needsPracticeSetup,
        setNeedsPracticeSetup,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
