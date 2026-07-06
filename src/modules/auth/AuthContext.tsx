import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
    onAuthStateChanged,
    signOut,
    updateProfile as firebaseUpdateProfile,
    reload,
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { auth } from "./firebaseConfig";

interface AuthContextType {
    user: FirebaseUser | null;
    loading: boolean;
    getToken: () => Promise<string | null>;
    logout: () => Promise<void>;
    updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
    reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    getToken: async () => null,
    logout: async () => {},
    updateProfile: async () => {},
    reloadUser: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // fuerza recarga para obtener foto/nombre actualizado
                await reload(firebaseUser);
                setUser({ ...firebaseUser });
            } else {
                setUser(null);
            }
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

    const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
        if (!auth.currentUser) return;
        await firebaseUpdateProfile(auth.currentUser, data);
        await reload(auth.currentUser);
        // fuerza re-render copiando el objeto
        setUser({ ...auth.currentUser });
    };

    const reloadUser = async () => {
        if (!auth.currentUser) return;
        await reload(auth.currentUser);
        setUser({ ...auth.currentUser });
    };

    return (
        <AuthContext.Provider value={{ user, loading, getToken, logout, updateProfile, reloadUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}