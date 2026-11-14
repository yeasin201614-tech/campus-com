import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, isMobileSupabaseConfigured } from "@/lib/supabase";
import type { Profile, University } from "@campus/shared";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  university: University | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  profile: null,
  university: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserData(userId: string) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    setProfile((prof as Profile | null) ?? null);

    if (prof?.primary_university_id) {
      const { data: uni } = await supabase
        .from("universities")
        .select("*")
        .eq("id", prof.primary_university_id)
        .maybeSingle();
      setUniversity((uni as University | null) ?? null);
    } else {
      setUniversity(null);
    }
  }

  useEffect(() => {
    if (!isMobileSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadUserData(sess.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        loadUserData(sess.user.id);
      } else {
        setProfile(null);
        setUniversity(null);
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        university,
        loading,
        refreshProfile: async () => {
          if (session?.user) await loadUserData(session.user.id);
        },
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
