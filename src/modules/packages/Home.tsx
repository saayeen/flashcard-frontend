import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FlashcardPackage } from "../../types/index";
import { getPackages } from "./packageService";
import BottomNav from "../navigation/BottomNav";
import { useAuth } from "../auth/AuthContext";
import { getThemeGradient } from "./themes";
import AuthModal from "../auth/AuthModal";
import "./Home.css";
import AppHeader from "../shared/AppHeader";
import { useTheme } from "../theme/ThemeContext"; 
import bannerClaro from "../../assets/BannerHomeClaro.png";
import bannerOscuro from "../../assets/BannerHomeOscuro.png";

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
    const navigate = useNavigate();
    const [trending, setTrending] = useState<FlashcardPackage[]>([]);
    const firstName = user?.displayName?.split(" ")[0] ?? null;

    const { theme } = useTheme();
    const bannerImg = theme === "dark" ? bannerOscuro : bannerClaro;
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
    getPackages()
        .then(setPackages)
        .finally(() => setLoading(false));

    fetch(`${API_URL}/search/trending`)
        .then(r => r.json())
        .then(data => setTrending(Array.isArray(data) ? data.slice(0, 5) : []))
        .catch(() => {});

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
        <AppHeader user={user} />
            {/* HEADER */}
            <div className="home-body">
                    {/* SALUDO / BANNER */}
                    {user ? (
                        <div className="home-banner" style={{ backgroundImage: `url(${bannerImg})` }}>
                            <div className="home-banner-overlay" />
                            <div className="home-banner-content">
                                <p className="home-greeting-hi">Hola, {firstName}</p>
                                <p className="home-greeting-sub">Continúa estudiando</p>
                            </div>
                        </div>
                    ) : (
                        <div className="home-banner" style={{ backgroundImage: `url(${bannerImg})` }}>
                            <div className="home-banner-overlay" />
                            <div className="home-banner-content">
                                <p className="home-greeting-hi">Bienvenido a Jati</p>
                                <p className="home-greeting-sub">¿Quieres estudiar con cartas?</p>
                                <button className="home-banner-cta" onClick={() => setShowAuthModal(true)}>
                                    Iniciar sesión
                                </button>
                            </div>
                        </div>
                    )}

                {/* CONTINUAR ESTUDIANDO */}
                {lastSession && lastPackage && (
                    <div
                        className="home-continue-card"
                        style={{ background: getThemeGradient(lastPackage.theme) }}
                        onClick={() => navigate(`/packages/${lastPackage.id}/study`)}
                    >
                        <div className="home-continue-info">
                            <p className="continue-label">Continuar estudiando</p>
                            <p className="continue-name">{lastPackage.name}</p>
                            <p className="continue-sub">{lastPackage.cardCount} tarjetas · {lastPackage.category}</p>
                        </div>
                        <div className="continue-arrow">
                            <PlayIcon />
                        </div>
                    </div>
                )}

                {/* TENDENCIAS */}
                <div className="home-section">
                    <div className="home-section-header">
                        <h2 className="home-section-title">Tendencias</h2>
                    </div>

                    {loading && (
                        <div className="home-skeleton-list">
                            {[1, 2, 3].map(i => <div key={i} className="home-skeleton-card" />)}
                        </div>
                    )}

                    {!loading && packages.length === 0 && (
                        <div className="home-empty">
                            <p>Todavía no hay paquetes públicos.</p>
                        </div>
                    )}

                    <div className="home-trending-list">
                        {trending.map((pkg) => (
                            <div
                                className="home-trending-card"
                                key={pkg.id}
                                onClick={() => navigate(`/packages/${pkg.id}`)}
                            >
                                <div
                                    className="home-trending-thumb"
                                    style={{ background: getThemeGradient(pkg.theme) }}
                                />
                                <div className="home-trending-info">
                                    <p className="home-trending-name">{pkg.name}</p>
                                    <p className="home-trending-meta">
                                        {pkg.cardCount} tarjetas · {pkg.category}
                                    </p>
                                    {pkg.avgRating != null && (
                                        <div className="home-trending-rating">
                                            <StarIcon />
                                            <span>{pkg.avgRating.toFixed(1)}</span>
                                        </div>
                                    )}
                                </div>
                                <ChevronIcon />
                            </div>
                        ))}
                    </div>
                </div>

                {/* RECIENTES */}
                {packages.length > 5 && (
                    <div className="home-section">
                        <div className="home-section-header">
                            <h2 className="home-section-title">Recientes</h2>
                        </div>
                        <div className="home-package-grid">
                            {packages.slice(5).map((pkg) => (
                                <div
                                    className="home-package-card"
                                    key={pkg.id}
                                    style={{ background: getThemeGradient(pkg.theme) }}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    <span className="home-package-category">{pkg.category}</span>
                                    <h3 className="home-package-name">{pkg.name}</h3>
                                    <div className="home-package-footer">
                                        <span className="home-package-count">🗂 {pkg.cardCount}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
            {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
        </div>
    );
}


function PlayIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.25)" />
            <path d="M10 8l6 4-6 4V8z" fill="white" />
        </svg>
    );
}

function StarIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
    );
}

function ChevronIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}