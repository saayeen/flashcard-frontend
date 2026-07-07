import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { FlashcardPackage } from "../../types/index";
import { getThemeGradient } from "../packages/themes";
import BottomNav from "../navigation/BottomNav";
import "./Profile.css";
import "./PublicProfile.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface PublicUser {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
    description?: string;
    isPublic: boolean;
}

export default function PublicProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, getToken } = useAuth();

    const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
    const [packages, setPackages] = useState<FlashcardPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [tab, setTab] = useState<"desc" | "paquetes">("desc");

    const [following, setFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        if (currentUser?.uid === userId) {
            navigate("/profile", { replace: true });
            return;
        }
        loadProfile();
    }, [userId, currentUser]);

    const loadProfile = async () => {
        try {
            const token = currentUser ? await getToken() : null;
            const authHeaders: HeadersInit = token
                ? { "Authorization": `Bearer ${token}` }
                : {};

            const [userRes, pkgsRes, followersRes, followingRes] = await Promise.all([
                fetch(`${API_URL}/users/${userId}`),
                fetch(`${API_URL}/users/${userId}/packages`),
                fetch(`${API_URL}/users/${userId}/followers/count`),
                fetch(`${API_URL}/users/${userId}/following/count`, { headers: authHeaders }),
            ]);

            if (!userRes.ok) { setNotFound(true); return; }
            setProfileUser(await userRes.json());
            if (pkgsRes.ok) setPackages(await pkgsRes.json());
            if (followersRes.ok) {
                const data = await followersRes.json();
                setFollowersCount(data.count ?? 0);
            }
            if (followingRes.ok) {
                const data = await followingRes.json();
                setFollowingCount(data.count ?? 0);
            }

            // verificar si ya sigue
            if (token) {
                const isFollowingRes = await fetch(`${API_URL}/users/${userId}/is-following`, {
                    headers: authHeaders,
                });
                if (isFollowingRes.ok) {
                    const data = await isFollowingRes.json();
                    setFollowing(data.following ?? false);
                }
            }
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!currentUser) { navigate("/"); return; }
        setFollowLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/users/${userId}/follow`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            if (res.ok) {
                const wasFollowing = following;
                setFollowing(!wasFollowing);
                setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
            }
        } catch {}
        finally { setFollowLoading(false); }
    };

    if (loading) return (
        <div className="profile-page">
            <div className="pubprofile-loading">Cargando perfil...</div>
        </div>
    );

    if (notFound || !profileUser) return (
        <div className="profile-page">
            <div className="pubprofile-loading">
                <p>Perfil no encontrado</p>
                <button className="pubprofile-action-btn" onClick={() => navigate(-1)}>Volver</button>
            </div>
        </div>
    );

    const handle = profileUser.email?.split("@")[0];

    return (
        <div className="profile-page" style={{ paddingBottom: 80 }}>
            {/* HEADER */}
            <div className="profile-header">
                <button className="profile-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <h1 className="profile-header-title">{profileUser.name}</h1>
                <div style={{ width: 30 }} />
            </div>

            {/* HERO */}
            <div className="profile-hero">
                <div className="profile-avatar-wrapper">
                    {profileUser.photoUrl
                        ? <img src={profileUser.photoUrl} className="profile-avatar" alt="avatar" />
                        : <div className="profile-avatar-placeholder">
                            {profileUser.name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                    }
                </div>

                <button
                    className={`pubprofile-follow-btn ${following ? "following" : ""}`}
                    onClick={handleFollow}
                    disabled={followLoading}
                >
                    {followLoading ? "..." : following ? "✓ Siguiendo" : "+ Seguir"}
                </button>

                <h2 className="profile-name">{profileUser.name}</h2>
                <p className="profile-handle">@{handle}</p>

                <div className="profile-stats-row">
                    <div className="profile-stat">
                        <span className="profile-stat-number">{packages.length}</span>
                        <span className="profile-stat-label">Paquetes</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat">
                        <span className="profile-stat-number">{followingCount}</span>
                        <span className="profile-stat-label">Siguiendo</span>
                    </div>
                    <div className="profile-stat-divider" />
                    <div className="profile-stat">
                        <span className="profile-stat-number">{followersCount}</span>
                        <span className="profile-stat-label">Seguidores</span>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="profile-tabs">
                <button className={`profile-tab ${tab === "desc" ? "active" : ""}`} onClick={() => setTab("desc")}>
                    Descripción
                </button>
                <button className={`profile-tab ${tab === "paquetes" ? "active" : ""}`} onClick={() => setTab("paquetes")}>
                    Paquetes
                </button>
            </div>

            {/* TAB: DESCRIPCIÓN */}
            {tab === "desc" && (
                <div className="profile-body">
                    {profileUser.description && (
                        <div className="profile-section">
                            <p className="pubprofile-description">"{profileUser.description}"</p>
                        </div>
                    )}
                    <div className="profile-section">
                        <h3 className="profile-section-title">Paquetes publicados</h3>
                        {packages.length === 0 && <p className="profile-empty">Sin paquetes públicos aún.</p>}
                        <div className="profile-packages">
                            {packages.slice(0, 3).map(pkg => (
                                <div
                                    key={pkg.id}
                                    className="profile-package-card"
                                    style={{ background: getThemeGradient(pkg.theme) }}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    <div>
                                        <p className="profile-pkg-name">{pkg.name}</p>
                                        <p className="profile-pkg-sub">{pkg.cardCount} tarjetas · by @{handle}</p>
                                    </div>
                                    <span className="profile-pkg-badge">{pkg.cardCount} 🗂</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: PAQUETES */}
            {tab === "paquetes" && (
                <div className="profile-body">
                    {packages.length === 0 && <p className="profile-empty">Sin paquetes públicos.</p>}
                    <div className="profile-packages">
                        {packages.map(pkg => (
                            <div
                                key={pkg.id}
                                className="profile-package-card"
                                style={{ background: getThemeGradient(pkg.theme) }}
                                onClick={() => navigate(`/packages/${pkg.id}`)}
                            >
                                <div>
                                    <p className="profile-pkg-name">{pkg.name}</p>
                                    <p className="profile-pkg-sub">{pkg.cardCount} tarjetas · {pkg.category}</p>
                                </div>
                                <span className="profile-pkg-badge">{pkg.cardCount} 🗂</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

function BackIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}