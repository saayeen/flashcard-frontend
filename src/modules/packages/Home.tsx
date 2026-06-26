import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FlashcardPackage } from "../../types/index";
import { getPackages } from "./packageService";
import BottomNav from "../navigation/BottomNav";
import { useAuth } from "../auth/AuthContext";
import jatiImg from "../../assets/jati.png";
import "./Home.css";
import { getThemeGradient } from "./themes";

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
    const { user, getToken } = useAuth();
    const firstName = user?.displayName?.split(" ")[0];
    const navigate = useNavigate();

    useEffect(() => {
        getPackages()
            .then(setPackages)
            .finally(() => setLoading(false));

        if (user) loadLastSession();
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
            if (pkgRes.ok) setLastPackage(await pkgRes.json());
        } catch {}
    };

    return (
        <div className="home-page">

            <div className="home-hero">
                <div className="home-hero-top">
                    <span className="home-app-name">Jati</span>
                    <button className="home-avatar-btn" onClick={() => navigate("/profile")}>
                        {user?.photoURL
                            ? <img src={user.photoURL} className="home-avatar-img" alt="perfil" />
                            : <span className="home-avatar-initials">
                                {user?.displayName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() ?? "?"}
                        </span>
                        }
                    </button>
                </div>
                <img src={jatiImg} alt="Jati" className="home-hero-elephant" />
                <h1 className="home-hero-title">
                    {firstName ? `¡Hola, ${firstName}!` : "Flashcards"}
                </h1>
                <p className="home-hero-sub">
                    {firstName ? "¿Listo para estudiar hoy?" : "Aprende con Jati"}
                </p>
            </div>

            {lastSession && lastPackage && (
                <div className="home-section">
                    <h2 className="home-section-title">Continuar estudiando</h2>
                    <div
                        className="home-continue-card"
                        style={{ background: getThemeGradient(lastPackage.theme) }}
                        onClick={() => navigate(`/packages/${lastPackage.id}/study`)}
                    >
                        <div>
                            <p className="continue-name">{lastPackage.name}</p>
                            <p className="continue-sub">{lastPackage.cardCount} tarjetas · {lastPackage.category}</p>
                        </div>
                        <div className="continue-arrow">▶</div>
                    </div>
                </div>
            )}

            <div className="home-section">
                <h2 className="home-section-title">Paquetes públicos</h2>
                {loading && <p className="home-status">Cargando...</p>}
                {!loading && packages.length === 0 && (
                    <p className="home-status">Todavía no hay paquetes públicos.</p>
                )}
                <div className="package-grid">
                    {packages.map((pkg) => (
                        <div
                            className="package-card"
                            key={pkg.id}
                            style={{ background: getThemeGradient(pkg.theme) }}
                            onClick={() => navigate(`/packages/${pkg.id}`)}
                        >
                            <div className="package-card-top">
                                <span className="package-category-badge">{pkg.category}</span>
                            </div>
                            <h2 className="package-name">{pkg.name}</h2>
                            <div className="package-card-bottom">
                                <span className="package-count">🗂 {pkg.cardCount}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}