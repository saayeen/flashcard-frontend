import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";
import AuthModal from "./AuthModal";

interface AuthGateContextType {
  requireAuth: (onSuccess?: () => void) => void;
}

const AuthGateContext = createContext<AuthGateContextType>({
  requireAuth: () => {},
});

export function AuthGateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const requireAuth = (onSuccess?: () => void) => {
    if (user) {
      onSuccess?.();
      return;
    }
    setShowModal(true);
  };

  return (
    <AuthGateContext.Provider value={{ requireAuth }}>
      {children}
      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate() {
  return useContext(AuthGateContext);
}