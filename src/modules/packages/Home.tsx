import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FlashcardPackage } from "../../types/index";
import { getPackages } from "./packageService";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { useAuth } from "../auth/AuthContext";
import jatiImg from "../../assets/jati.png";
import "./Home.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface LastSession {
    id: number;
    packageId: number;
}

export default function Home() {
    const [packages, setPackages] = useState<FlashcardPackage[]>([]);
    const [lastSession, setLastSession] = useState<LastSession | null>(null);
    const [lastPackage, setLastPackage] = useState<FlashcardPackage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, getToken } = useAuth();
    const firstName = user?.displayName?.split(" ")[0];
    const navigate = useNavigate();

    useEffect(() => {
        getPackages()
            .then(setPackages)
            .catch(() => setError("No se pudieron cargar los paquetes"))
            .finally(() => setLoading(false));

        if (user) {
            loadLastSession();
        }
    }, [user]);

    const loadLastSession = async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/study/last-session`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (!res.ok) return;
            const session: LastSession = await res.json();
            setLastSession(session);

            const pkgRes = await fetch(`${API_URL}/packages/${session.packageId}`);
            if (pkgRes.ok) {
                const pkg = await pkgRes.json();
                setLastPackage(pkg);
            }
        } catch {
            // sin sesión previa, no pasa nada
        }
    };

    return (
        <div className="home-page">
            <Header />

            <div className="home-greeting">
                <div className="home-greeting-text">
                    <h1 className="home-hello">
                        {firstName ? `Hola, ${firstName}` : "Explora Jati"}
                    </h1>
                    <p className="home-sub">
                        {firstName ? "¿Listo para estudiar hoy?" : "Descubre paquetes de flashcards"}
                    </p>
                </div>
                <img src={jatiImg} alt="Jati" className="home-jati" />
            </div>

            {lastSession && lastPackage && (
                <div className="home-section">
                    <h2 className="home-section-title">Continuar estudiando</h2>
                    <div className="home-continue-card" onClick={() => navigate(`/packages/${lastPackage.id}`)}>
                        <div className="continue-card-left">
                            <div className="continue-card-icon">📖</div>
                            <div>
                                <p className="continue-card-name">{lastPackage.name}</p>
                                <p className="continue-card-sub">{lastPackage.cardCount} tarjetas · {lastPackage.category}</p>
                            </div>
                        </div>
                        <button
                            className="continue-card-btn"
                            onClick={e => { e.stopPropagation(); navigate(`/packages/${lastPackage.id}/study`); }}
                        >
                            Estudiar
                        </button>
                    </div>
                </div>
            )}

            <div className="home-section">
                <h2 className="home-section-title">Paquetes públicos</h2>

                {loading && <p className="home-status">Cargando...</p>}
                {error && <p className="home-status home-error">{error}</p>}
                {!loading && !error && packages.length === 0 && (
                    <p className="home-status">Todavía no hay paquetes públicos.</p>
                )}

                <div className="package-grid">
                    {packages.map((pkg) => (
                        <div className="package-card" key={pkg.id} onClick={() => navigate(`/packages/${pkg.id}`)}>
                            <span className="package-category">{pkg.category}</span>
                            <h2 className="package-name">{pkg.name}</h2>
                            <p className="package-description">{pkg.description}</p>
                            <span className="package-count">{pkg.cardCount} tarjetas</span>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}