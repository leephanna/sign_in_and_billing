import { useEffect, useState } from "react";
import { HarmoniaUser } from "@harmonia/sdk-core";
import { useHarmonia } from "./context.js";

export function useAuth() {
  const { client, ready } = useHarmonia();
  const [user, setUser] = useState<HarmoniaUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const me = await client.me();
        setUser(me);
      } catch {
        setUser(null);
      }
    })();
  }, [ready, client]);

  async function signUp(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await client.signUp(email, password);
      setUser(res.user);
      return res.user;
    } catch (e: any) {
      setError(e?.message || "Sign up failed");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await client.signIn(email, password);
      setUser(res.user);
      return res.user;
    } catch (e: any) {
      setError(e?.message || "Sign in failed");
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    await client.signOut();
    setUser(null);
  }

  return { user, ready, isLoading, error, signUp, signIn, signOut };
}
