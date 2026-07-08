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

interface UserSummary {
    id: string;
    name: string;
    photoUrl?: string | null;
}

export default function PublicProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, getToken } = useAuth();

    const [profileUser, setProfileUser]   = useState<PublicUser | null>(null);
    const [packages, setPackages]         = useState<FlashcardPackage[]>([]);
    const [loading, setLoading]           = useState(true);
    const [notFound, setNotFound]         = useState(false);
    const [tab, setTab]                   = useState<"desc" | "paquetes">("desc");

    const [following, setFollowing]       = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followLoading, setFollowLoading]   = useState(false);

    // listas
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const [followersList, setFollowersList] = useState<UserSummary[]>([]);
    const [followingList, setFollowingList] = useState<UserSummary[]>([]);
    const [loadingList, setLoadingList]     = useState(false);

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
            const authHeaders: HeadersInit = token ? { "Authorization": `Bearer ${token}` } : {};

            const [userRes, pkgsRes, followersRes, followingRes] = await Promise.all([
                fetch(`${API_URL}/users/${userId}`),
                fetch(`${API_URL}/users/${userId}/packages`),
                fetch(`${API_URL}/users/${userId}/followers/count`),
                fetch(`${API_URL}/users/${userId}/following/count`),
            ]);

            if (!userRes.ok) { setNotFound(true); return; }
            setProfileUser(await userRes.json());
            if (pkgsRes.ok)       setPackages(await pkgsRes.json());
            if (followersRes.ok)  setFollowersCount((await followersRes.json()).count ?? 0);
            if (followingRes.ok)  setFollowingCount((await followingRes.json()).count ?? 0);

            if (token) {
                const isFollowingRes = await fetch(`${API_URL}/users/${userId}/is-following`, { headers: authHeaders });
                if (isFollowingRes.ok) setFollowing((await isFollowingRes.json()).following ?? false);
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
                const data = await res.json();
                setFollowing(data.following);
                setFollowersCount(data.followersCount);
            }
        } catch {}
        finally { setFollowLoading(false); }
    };

    const openFollowers = async () => {
        setShowFollowers(true);
        setLoadingList(true);
        try {
            const res = await fetch(`${API_URL}/users/${userId}/followers`);
            if (res.ok) setFollowersList(await res.json());
        } catch {}
        finally { setLoadingList(false); }
    };

    const openFollowing = async () => {
        setShowFollowing(true);
        setLoadingList(true);
        try {
            const res = await fetch(`${API_URL}/users/${userId}/following`);
            if (res.ok) setFollowingList(await res.json());
        } catch {}
        finally { setLoadingList(false); }
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
                    <button className="profile-stat pubprofile-stat-btn" onClick={openFollowing}>
                        <span className="profile-stat-number">{followingCount}</span>
                        <span className="profile-stat-label">Siguiendo</span>
                    </button>
                    <div className="profile-stat-divider" />
                    <button className="profile-stat pubprofile-stat-btn" onClick={openFollowers}>
                        <span className="profile-stat-number">{followersCount}</span>
                        <span className="profile-stat-label">Seguidores</span>
                    </button>
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
                                <div key={pkg.id} className="profile-package-card"
                                    style={{ background: getThemeGradient(pkg.theme) }}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}>
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
                            <div key={pkg.id} className="profile-package-card"
                                style={{ background: getThemeGradient(pkg.theme) }}
                                onClick={() => navigate(`/packages/${pkg.id}`)}>
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

            {/* MODAL SEGUIDORES */}
            {showFollowers && (
                <UserListModal
                    title="Seguidores"
                    users={followersList}
                    loading={loadingList}
                    onClose={() => setShowFollowers(false)}
                    onUserClick={id => { setShowFollowers(false); navigate(`/profile/${id}`); }}
                />
            )}

            {/* MODAL SIGUIENDO */}
            {showFollowing && (
                <UserListModal
                    title="Siguiendo"
                    users={followingList}
                    loading={loadingList}
                    onClose={() => setShowFollowing(false)}
                    onUserClick={id => { setShowFollowing(false); navigate(`/profile/${id}`); }}
                />
            )}
        </div>
    );
}

function UserListModal({ title, users, loading, onClose, onUserClick }: {
    title: string;
    users: { id: string; name: string; photoUrl?: string | null }[];
    loading: boolean;
    onClose: () => void;
    onUserClick: (id: string) => void;
}) {
    return (
        <div className="pubprofile-modal-overlay" onClick={onClose}>
            <div className="pubprofile-modal" onClick={e => e.stopPropagation()}>
                <div className="pubprofile-modal-handle" />
                <h3 className="pubprofile-modal-title">{title}</h3>
                {loading && <p className="pubprofile-modal-empty">Cargando...</p>}
                {!loading && users.length === 0 && (
                    <p className="pubprofile-modal-empty">Ningún usuario aún.</p>
                )}
                <div className="pubprofile-modal-list">
                    {users.map(u => (
                        <button key={u.id} className="pubprofile-modal-user" onClick={() => onUserClick(u.id)}>
                            <div className="pubprofile-modal-avatar">
                                {u.photoUrl
                                    ? <img src={u.photoUrl} alt={u.name} />
                                    : <span>{u.name.slice(0,2).toUpperCase()}</span>
                                }
                            </div>
                            <span className="pubprofile-modal-name">{u.name}</span>
                            <ChevronIcon />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function BackIcon() {
    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ChevronIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}