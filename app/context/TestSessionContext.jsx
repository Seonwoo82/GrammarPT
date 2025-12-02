"use client";

import { createContext, useContext, useMemo, useState } from "react";

const TestSessionContext = createContext(null);

const initialState = {
  testInfo: null,
  questions: null,
  results: null,
  selectedAnswers: null,
  sessionId: null,
  sessionStartedAt: null,
};

export function TestSessionProvider({ children }) {
  const [state, setState] = useState(initialState);

  const value = useMemo(
    () => ({
      ...state,
      setSession: (payload) => setState((prev) => ({ ...prev, ...payload })),
      resetSession: () => setState(initialState),
    }),
    [state]
  );

  return (
    <TestSessionContext.Provider value={value}>
      {children}
    </TestSessionContext.Provider>
  );
}

export function useTestSession() {
  const context = useContext(TestSessionContext);
  if (!context) {
    throw new Error("useTestSession must be used within TestSessionProvider");
  }
  return context;
}
