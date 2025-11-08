import { useEffect, useState } from "react";

import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/features/auth/supabase-client";

export type UserProfile = {
  id: string;
  email: string | null;
  name: string | null;
  provider: string | null;
  avatarUrl: string | null;
};

export function useSupabaseSession() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const next = mapSessionToProfile(data.session);
      setProfile(next);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        setProfile(mapSessionToProfile(session));
      },
    );

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { profile, loading, signOut };
}

function mapSessionToProfile(session: Session | null) {
  if (!session) {
    return null;
  }

  const user = session.user;
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata.full_name ?? user.user_metadata.name ?? null,
    avatarUrl: user.user_metadata.avatar_url ?? null,
    provider: session?.user?.app_metadata?.provider ?? null,
  };
}
