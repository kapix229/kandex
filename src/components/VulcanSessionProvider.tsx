"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { VulcanAccount } from "@/services/vulcan-session";

// Re-export the account type from the canonical (server) source so
// consumers can import both the hook and the type from this module.
export type { VulcanAccount };

type VulcanSessionState = {
  loggedIn: boolean;
  account: VulcanAccount | null;
};

type VulcanSessionContextValue = VulcanSessionState & {
  // Replace the entire session atomically (e.g. after a successful
  // login or a logout). Pass `null` for `account` to clear the name.
  setSession: (next: { loggedIn: boolean; account: VulcanAccount | null }) => void;
  // Convenience helpers used by the login modal and the logout button.
  signIn: (account: VulcanAccount) => void;
  signOut: () => void;
};

const VulcanSessionContext = createContext<VulcanSessionContextValue | null>(null);

export function useVulcanSession(): VulcanSessionContextValue {
  const ctx = useContext(VulcanSessionContext);
  if (!ctx) {
    throw new Error(
      "useVulcanSession must be used inside <VulcanSessionProvider>."
    );
  }
  return ctx;
}

export function VulcanSessionProvider({
  children,
  initialLoggedIn,
  initialAccount,
}: {
  children: React.ReactNode;
  initialLoggedIn: boolean;
  initialAccount: VulcanAccount | null;
}) {
  const [state, setState] = useState<VulcanSessionState>({
    loggedIn: initialLoggedIn,
    account: initialAccount,
  });

  // The session cookie is httpOnly by design, so it must never be
  // read through document.cookie. The server resolves it in the root layout
  // and passes the initial state here; login/logout then update this context.

  const setSession = useCallback(
    (next: { loggedIn: boolean; account: VulcanAccount | null }) => {
      setState(next);
    },
    []
  );

  const signIn = useCallback((account: VulcanAccount) => {
    setState({ loggedIn: true, account });
  }, []);

  const signOut = useCallback(() => {
    setState({ loggedIn: false, account: null });
  }, []);

  return (
    <VulcanSessionContext.Provider
      value={{ ...state, setSession, signIn, signOut }}
    >
      {children}
    </VulcanSessionContext.Provider>
  );
}
