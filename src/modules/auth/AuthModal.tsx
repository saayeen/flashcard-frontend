import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig";
import jatiImg from "../../assets/jati.png";
import "./AuthModal.css";

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ambos botones llaman a la misma función — Firebase + tu backend
  // ya manejan "crear si no existe, entrar si existe" automáticamente
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        throw new Error("No se pudo iniciar sesión en el servidor");
      }

      onClose();
    } catch (err) {
      console.error("Error en login:", err);
      setError("No pudimos iniciar sesión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <img src={jatiImg} alt="Jati" className="auth-modal-mascot" />

        <h2 className="auth-modal-title">Empieza con Jati</h2>
        <p className="auth-modal-subtitle">
          Tu compañero de estudio colaborativo
        </p>

        <div className="auth-modal-actions">
          <button
            className="google-btn google-btn-primary"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <GoogleIcon />}
            {loading ? "Conectando..." : "Crear cuenta con Google"}
          </button>
        </div>

        <p className="auth-modal-switch">
          ¿Ya tienes cuenta?{" "}
          <button
            className="auth-modal-link"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Inicia sesión
          </button>
        </p>

        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#fff" opacity="0.9" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#fff" opacity="0.7" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.87-3.04.87-2.34 0-4.32-1.58-5.03-3.71H.95v2.33A9 9 0 0 0 9 18z" />
      <path fill="#fff" opacity="0.5" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.05l3.02-2.33z" />
      <path fill="#fff" opacity="0.8" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}