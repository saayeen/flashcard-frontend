import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { GlobalStats, WeeklyActivity, FlashcardPackage } from "../../types/index";
import { getThemeGradient } from "../packages/themes";
import "./Profile.css";
import dificilImg from "../../assets/Dificil.png";
import casiImg from "../../assets/Casi.png";
import bienImg from "../../assets/Bien.png";
import facilImg from "../../assets/Facil.png";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export default function Profile() {
    const { user, getToken, updateProfile } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [activity, setActivity] = useState<WeeklyActivity[]>([]);
    const [packages, setPackages] = useState<FlashcardPackage[]>([]);
    const [tab, setTab] = useState<"desc" | "stats">("desc");
    const [loading, setLoading] = useState(true);

    // editar perfil
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState("");
    const [editPhotoUrl, setEditPhotoUrl] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

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
                fetch(`${API_URL}/users/me/packages`, { headers }),
            ]);
            if (statsRes.ok) setStats(await statsRes.json());
            if (activityRes.ok) setActivity(await activityRes.json());
            if (pkgsRes.ok) setPackages(await pkgsRes.json());
        } catch {}
        finally { setLoading(false); }
    };

    const openEditModal = () => {
        setEditName(user?.displayName ?? "");
        setEditPhotoUrl(user?.photoURL ?? "");
        setEditError(null);
        setShowEditModal(true);
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) { setEditError("El nombre no puede estar vacío"); return; }
        setSavingProfile(true);
        setEditError(null);
        try {
            await updateProfile({
                displayName: editName.trim(),
                photoURL: editPhotoUrl.trim() || undefined,
            });

            // también actualiza en el backend
            const token = await getToken();
            await fetch(`${API_URL}/users/me`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ name: editName.trim() }),
            });

            setShowEditModal(false);
        } catch {
            setEditError("No se pudo guardar, intenta de nuevo");
        } finally {
            setSavingProfile(false);
        }
    };

    const maxActivity = Math.max(...activity.map(a => a.cardsReviewed), 1);

    return (
        <div className="profile-page">
            {/* HEADER */}
            <div className="profile-header">
                <button className="profile-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="profile-header-title">Mi perfil</h1>
                <button className="profile-settings-btn" onClick={() => navigate("/settings")}>
                    <SettingsIcon />
                </button>
            </div>

            {/* HERO */}
            <div className="profile-hero">
                {/* AVATAR con lápiz */}
                <div className="profile-avatar-wrapper">
                    {user?.photoURL
                        ? <img src={user.photoURL} className="profile-avatar" alt="avatar" />
                        : <div className="profile-avatar-placeholder">
                            {user?.displayName?.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                    }
                    <button className="profile-avatar-edit-btn" onClick={openEditModal} aria-label="Editar foto">
                        <PencilIcon />
                    </button>
                </div>

                {/* NOMBRE con lápiz */}
                <div className="profile-name-row">
                    <h2 className="profile-name">{user?.displayName}</h2>
                    <button className="profile-name-edit-btn" onClick={openEditModal} aria-label="Editar nombre">
                        <PencilIcon />
                    </button>
                </div>

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

            {/* TABS */}
            <div className="profile-tabs">
                <button className={`profile-tab ${tab === "desc" ? "active" : ""}`} onClick={() => setTab("desc")}>
                    Descripción
                </button>
                <button className={`profile-tab ${tab === "stats" ? "active" : ""}`} onClick={() => setTab("stats")}>
                    Mis estadísticas
                </button>
            </div>

            {/* TAB: DESCRIPCIÓN */}
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

            {/* TAB: ESTADÍSTICAS */}
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
                            <span className="profile-stats-label">sesiones completadas</span>
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
                                <img src={dificilImg} alt="Difícil" className="dist-icon" />
                                <span className="dist-number">{stats.distribution.difficult}</span>
                                <span className="dist-label">Difícil</span>
                            </div>

                            <div className="profile-dist-card dist-almost">
                                <img src={casiImg} alt="Casi" className="dist-icon" />
                                <span className="dist-number">{stats.distribution.almost}</span>
                                <span className="dist-label">Casi</span>
                            </div>

                            <div className="profile-dist-card dist-good">
                                <img src={bienImg} alt="Bien" className="dist-icon" />
                                <span className="dist-number">{stats.distribution.good}</span>
                                <span className="dist-label">Bien</span>
                            </div>

                            <div className="profile-dist-card dist-easy">
                                <img src={facilImg} alt="Fácil" className="dist-icon" />
                                <span className="dist-number">{stats.distribution.easy}</span>
                                <span className="dist-label">Fácil</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITAR PERFIL */}
            {showEditModal && (
                <div className="profile-modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="profile-modal" onClick={e => e.stopPropagation()}>
                        <div className="profile-modal-handle" />
                        <h3 className="profile-modal-title">Editar perfil</h3>

                        {/* preview avatar */}
                        <div className="profile-modal-avatar">
                            {editPhotoUrl
                                ? <img src={editPhotoUrl} alt="preview" className="profile-modal-avatar-img" />
                                : <div className="profile-modal-avatar-placeholder">
                                    {editName.slice(0,2).toUpperCase() || "?"}
                                  </div>
                            }
                        </div>

                        <div className="profile-modal-field">
                            <label className="profile-modal-label">Nombre</label>
                            <input
                                className="profile-modal-input"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                placeholder="Tu nombre"
                                maxLength={60}
                            />
                        </div>

                        <div className="profile-modal-field">
                            <label className="profile-modal-label">URL de foto (opcional)</label>
                            <input
                                className="profile-modal-input"
                                value={editPhotoUrl}
                                onChange={e => setEditPhotoUrl(e.target.value)}
                                placeholder="https://..."
                            />
                            <p className="profile-modal-hint">Pega el link de una imagen de perfil</p>
                        </div>

                        {editError && <p className="profile-modal-error">{editError}</p>}

                        <div className="profile-modal-actions">
                            <button className="profile-modal-cancel" onClick={() => setShowEditModal(false)}>
                                Cancelar
                            </button>
                            <button className="profile-modal-save" onClick={handleSaveProfile} disabled={savingProfile}>
                                {savingProfile ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BackIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function SettingsIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/></svg>;
}
function PencilIcon() {
    return <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
}