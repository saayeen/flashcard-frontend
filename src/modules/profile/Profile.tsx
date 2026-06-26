import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { GlobalStats, WeeklyActivity, FlashcardPackage } from "../../types/index";
import { getThemeGradient } from "../packages/themes";
import "./Profile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function Profile() {
    const { user, logout, getToken } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [activity, setActivity] = useState<WeeklyActivity[]>([]);
    const [packages, setPackages] = useState<FlashcardPackage[]>([]);
    const [tab, setTab] = useState<"desc" | "stats">("desc");
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        if (!user) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const token = await getToken();
            const headers = { "Authorization": `Bearer ${token}` };

            const [statsRes, activityRes, pkgsRes] = await Promise.all([
                fetch(`${API_URL}/stats`, { headers }),
                fetch(`${API_URL}/stats/activity`, { headers }),
                fetch(`${API_URL}/packages`, { headers }),
            ]);

            if (statsRes.ok) setStats(await statsRes.json());
            if (activityRes.ok) setActivity(await activityRes.json());
            if (pkgsRes.ok) {
                const all: FlashcardPackage[] = await pkgsRes.json();
                setPackages(all);
            }
        } catch {}
        finally { setLoading(false); }
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    const maxActivity = Math.max(...activity.map(a => a.cardsReviewed), 1);

    return (
        <div className="profile-page">
            <div className="profile-header">
                <button className="profile-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="profile-header-title">Mi perfil</h1>
                <button className="profile-settings-btn" onClick={handleLogout}>
                    <LogoutIcon />
                </button>
            </div>

            <div className="profile-hero">
                <div className="profile-avatar-wrapper">
                    {user?.photoURL
                        ? <img src={user.photoURL} className="profile-avatar" alt="avatar" />
                        : <div className="profile-avatar-placeholder">
                            {user?.displayName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                    }
                </div>
                <h2 className="profile-name">{user?.displayName}</h2>
                <p className="profile-handle">@{user?.email?.split("@")[0]}</p>

                <div className="profile-stats-row">
                    <div className="profile-stat">
                        <span className="profile-stat-number">0</span>
                        <span className="profile-stat-label">Siguiendo</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat">
                        <span className="profile-stat-number">0</span>
                        <span className="profile-stat-label">Seguidores</span>
                    </div>
                </div>
            </div>

            <div className="profile-tabs">
                <button
                    className={`profile-tab ${tab === "desc" ? "active" : ""}`}
                    onClick={() => setTab("desc")}
                >
                    Descripción
                </button>
                <button
                    className={`profile-tab ${tab === "stats" ? "active" : ""}`}
                    onClick={() => setTab("stats")}
                >
                    Mis estadísticas
                </button>
            </div>

            {tab === "desc" && (
                <div className="profile-body">
                    <div className="profile-section">
                        <h3 className="profile-section-title">Paquetes publicados</h3>
                        {loading && <p className="profile-empty">Cargando...</p>}
                        {!loading && packages.length === 0 && (
                            <p className="profile-empty">No has publicado paquetes aún.</p>
                        )}
                        <div className="profile-packages">
                            {packages.map(pkg => (
                                <div
                                    className="profile-package-card"
                                    key={pkg.id}
                                    style={{ background: getThemeGradient(pkg.theme) }}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    <div>
                                        <p className="profile-pkg-name">{pkg.name}</p>
                                        <p className="profile-pkg-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                    </div>
                                    <span className="profile-pkg-badge">{pkg.isPublic ? "Público" : "Privado"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {tab === "stats" && stats && (
                <div className="profile-body">
                    <div className="profile-streak-card">
                        <span className="profile-streak-emoji">🔥</span>
                        <span className="profile-streak-number">{stats.currentStreak}</span>
                        <span className="profile-streak-label">días seguidos</span>
                    </div>

                    <div className="profile-stats-grid">
                        <div className="profile-stats-card">
                            <span className="profile-stats-number">{stats.totalCardsReviewed}</span>
                            <span className="profile-stats-label">tarjetas estudiadas</span>
                        </div>
                        <div className="profile-stats-card">
                            <span className="profile-stats-number">{stats.totalSessions}</span>
                            <span className="profile-stats-label">paquetes estudiados</span>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3 className="profile-section-title">Esta semana</h3>
                        <div className="profile-activity">
                            {activity.map((a, i) => (
                                <div className="profile-activity-col" key={i}>
                                    <div className="profile-activity-bar-wrapper">
                                        <div
                                            className="profile-activity-bar"
                                            style={{ height: `${(a.cardsReviewed / maxActivity) * 80}px` }}
                                        />
                                    </div>
                                    <span className="profile-activity-day">{DAYS[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="profile-section">
                        <h3 className="profile-section-title">Distribución general</h3>
                        <div className="profile-dist-grid">
                            <div className="profile-dist-card dist-difficult">
                                <span className="dist-emoji">😰</span>
                                <span className="dist-number">{stats.distribution.difficult}</span>
                                <span className="dist-label">Difícil</span>
                            </div>
                            <div className="profile-dist-card dist-almost">
                                <span className="dist-emoji">😅</span>
                                <span className="dist-number">{stats.distribution.almost}</span>
                                <span className="dist-label">Casi</span>
                            </div>
                            <div className="profile-dist-card dist-good">
                                <span className="dist-emoji">😊</span>
                                <span className="dist-number">{stats.distribution.good}</span>
                                <span className="dist-label">Bien</span>
                            </div>
                            <div className="profile-dist-card dist-easy">
                                <span className="dist-emoji">🚀</span>
                                <span className="dist-number">{stats.distribution.easy}</span>
                                <span className="dist-label">Fácil</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BackIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function LogoutIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}