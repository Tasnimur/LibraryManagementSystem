import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<'student' | 'librarian'>('student');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // 1. Get session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        if (error) throw error;

        // 2. If no session, stop here
        if (!session?.user) {
          setLoading(false);
          return;
        }

        // 3. Set user and default role
        setUser(session.user);
        setRole('student'); // Default role
        setLoading(false);

        // 4. Fetch role in background (non-blocking)
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (isMounted && profile?.role) {
              setRole(profile.role as 'student' | 'librarian');
            }
          })
          .catch((error) => {
            console.error('Role fetch error:', error);
          });
      } catch (error) {
        console.error('Auth init error:', error);
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // 5. Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        try {
          if (!session?.user) {
            setUser(null);
            setRole('student');
            setLoading(false);
            return;
          }

          // 6. Set user and default role
          setUser(session.user);
          setRole('student'); // Default role
          setLoading(false);

          // 7. Fetch role in background (non-blocking)
          supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (isMounted && profile?.role) {
                setRole(profile.role as 'student' | 'librarian');
              }
            })
            .catch((error) => {
              console.error('Role fetch error:', error);
            });
        } catch (error) {
          console.error('Auth state error:', error);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { user, role, loading, signOut };
}