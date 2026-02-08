import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { HarmoniaClient } from "@harmonia/sdk-core";

type HarmoniaContextValue = {
  client: HarmoniaClient;
  ready: boolean;
  error: string | null;
};

const HarmoniaContext = createContext<HarmoniaContextValue | null>(null);

export type HarmoniaProviderProps = {
  projectId: string;
  apiBaseUrl: string;
  children: React.ReactNode;
};

export function HarmoniaProvider(props: HarmoniaProviderProps) {
  const client = useMemo(() => new HarmoniaClient({ projectId: props.projectId, apiBaseUrl: props.apiBaseUrl }), [props.projectId, props.apiBaseUrl]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await client.loadConfig();
        if (!alive) return;
        setReady(true);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load config");
      }
    })();
    return () => {
      alive = false;
    };
  }, [client]);

  return <HarmoniaContext.Provider value={{ client, ready, error }}>{props.children}</HarmoniaContext.Provider>;
}

export function useHarmonia() {
  const ctx = useContext(HarmoniaContext);
  if (!ctx) throw new Error("useHarmonia must be used within HarmoniaProvider");
  return ctx;
}
