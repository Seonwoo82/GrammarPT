"use client";

import { TestSessionProvider } from "./context/TestSessionContext.jsx";

export function Providers({ children }) {
  return <TestSessionProvider>{children}</TestSessionProvider>;
}
