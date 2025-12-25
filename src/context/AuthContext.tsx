
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  role: string;
  phone?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsPracticeSetup: boolean;
  setNeedsPracticeSetup: (needs: boolean) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: any) => Promise<any>;
  signOut: () => Promise<void>;
  error: string | null;
  refreshPracticeStatus: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPracticeSetup, setNeedsPracticeSetup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if doctor needs practice setup
  const checkDoctorPracticeSetup = async (userId: string, userRole: string) => {
    if (userRole !== 'doctor') {
      setNeedsPracticeSetup(false);
      return;
    }

    try {
      console.log('AuthContext: Checking practice setup for doctor:', userId);

      // Simple check - does the doctor have any staff records?
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .limit(1);

      if (staffError) {
        console.error('AuthContext: Error checking staff records:', staffError);
        // If we can't check staff records, assume they need setup
        setNeedsPracticeSetup(true);
        return;
      }

      const hasActivePractice = staffData && staffData.length > 0;
      console.log('AuthContext: Doctor practice check:', { hasActivePractice, staffData });
      
      setNeedsPracticeSetup(!hasActivePractice);
    } catch (err) {
      console.error('AuthContext: Error in checkDoctorPracticeSetup:', err);
      setNeedsPracticeSetup(true);
    }
  };

  const refreshPracticeStatus = async () => {
    if (user && profile) {
      await checkDoctorPracticeSetup(user.id, profile.role);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log('AuthContext: Fetching profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('AuthContext: Error fetching profile:', profileError);
        throw profileError;
      }

      console.log('AuthContext: Profile fetched:', profileData);
      setProfile(profileData);

      // Check practice setup after profile is loaded
      if (profileData?.role) {
        await checkDoctorPracticeSetup(userId, profileData.role);
      }

      return profileData;
    } catch (err) {
      console.error('AuthContext: Error in fetchProfile:', err);
      setProfile(null);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  };

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: Setting up auth state listener');
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Getting initial session');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext: Error getting initial session:', error);
          if (isMounted) {
            setError(error.message);
            setIsLoading(false);
          }
          return;
        }

        console.log('AuthContext: Initial session:', initialSession?.user?.id || 'none');

        if (initialSession?.user && isMounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Set a timeout to prevent infinite loading
          const timeoutId = setTimeout(() => {
            if (isMounted) {
              console.log('AuthContext: Profile fetch timeout, continuing anyway');
              setIsLoading(false);
            }
          }, 10000); // 10 second timeout

          try {
            await fetchProfile(initialSession.user.id);
            clearTimeout(timeoutId);
          } catch (err) {
            console.error('AuthContext: Error fetching initial profile:', err);
            if (isMounted) {
              setError('Failed to load user profile');
            }
          }
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('AuthContext: Unexpected error in getInitialSession:', err);
        if (isMounted) {
          setError('Authentication initialization failed');
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('AuthContext: Auth state changed:', event, session?.user?.id || 'none');
        
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);

        if (session?.user) {
          // Don't block the auth state change on profile fetching
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              await fetchProfile(session.user.id);
            } catch (err) {
              console.error('AuthContext: Error fetching profile on auth change:', err);
              if (isMounted) {
                setError('Failed to load user profile');
              }
            }
          }, 0);
        } else {
          setProfile(null);
          setNeedsPracticeSetup(false);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          setNeedsPracticeSetup(false);
        }

        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log('AuthContext: Sign in successful:', data.user?.id);
    } catch (err: any) {
      console.error('AuthContext: Sign in error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, metadata: any) => {
    try {
      setError(null);
      setIsLoading(true);

      console.log('AuthContext: Starting signup with metadata:', metadata);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      console.log('AuthContext: Signup successful:', data);

      // If user role is doctor, they'll need practice setup
      if (metadata.role === 'doctor') {
        console.log('AuthContext: Doctor signup detected, will need practice setup');
        setNeedsPracticeSetup(true);
      }

      return data;
    } catch (err: any) {
      console.error('AuthContext: Signup error:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      setSession(null);
      setNeedsPracticeSetup(false);
    } catch (err: any) {
      console.error('AuthContext: Sign out error:', err);
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    needsPracticeSetup,
    setNeedsPracticeSetup,
    signIn,
    signUp,
    signOut,
    error,
    refreshPracticeStatus,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
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
