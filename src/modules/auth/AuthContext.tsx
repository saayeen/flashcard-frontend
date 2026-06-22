import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebaseConfig";

interface AuthContextType {
   user: FirebaseUser | null;
  loading: boolean;
  getToken: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  getToken: async () => null,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
        });
        return unsubscribe;
    }, []);


    const logout = async () => {
    await signOut(auth);
};

    const getToken = async () => {
        if (!auth.currentUser) return null;
        return await auth.currentUser.getIdToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, getToken, logout }}>
        {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}