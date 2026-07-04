import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SearchResult, UserResult, TagResult } from "../../types/index";
import BottomNav from "../navigation/BottomNav";
import "./Search.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type SearchTab = "paquetes" | "perfiles" | "tags";

const CATEGORIES = [
    { label: "Universidad", icon: <UniIcon /> },
    { label: "PAES",        icon: <PaesIcon /> },
    { label: "Idiomas",     icon: <LangIcon /> },
    { label: "Licencias",   icon: <LicIcon /> },
    { label: "Ciencias",    icon: <SciIcon /> },
    { label: "Otros",       icon: <OtrosIcon /> },
];

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [activeTab, setActiveTab] = useState<SearchTab>("paquetes");
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);

    const [pkgResults, setPkgResults]   = useState<SearchResult[]>([]);
    const [userResults, setUserResults] = useState<UserResult[]>([]);
    const [tagResults, setTagResults]   = useState<SearchResult[]>([]);
    const [trending, setTrending]       = useState<SearchResult[]>([]);
    const [popularTags, setPopularTags] = useState<TagResult[]>([]);

    const hasSearched = searchParams.get("q") !== null || searchParams.get("category") !== null;
    const activeCategory = searchParams.get("category");
    const searchLabel = activeCategory
        ? `Categoría: ${activeCategory}`
        : `"${searchParams.get("q")}"`;

    useEffect(() => {
        fetch(`${API_URL}/search/trending`).then(r => r.json()).then(setTrending).catch(() => {});
        fetch(`${API_URL}/search/popular-tags`).then(r => r.json()).then(setPopularTags).catch(() => {});
    }, []);

    useEffect(() => {
        const q        = searchParams.get("q") ?? "";
        const category = searchParams.get("category") ?? "";
        if (q) setQuery(q);
        if (q || category) doSearchAll(q, category || undefined);
        else { setPkgResults([]); setUserResults([]); setTagResults([]); }
    }, [searchParams]);

    const doSearchAll = async (q: string, category?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim())  params.set("q", q.trim());
            if (category)  params.set("category", category);

            const [pkgs, users, tags] = await Promise.all([
                fetch(`${API_URL}/search?${params}`).then(r => r.json()),
                q.trim()
                    ? fetch(`${API_URL}/search/users?q=${encodeURIComponent(q)}`).then(r => r.json())
                    : Promise.resolve([]),
                q.trim()
                    ? fetch(`${API_URL}/search/tags?q=${encodeURIComponent(q)}`).then(r => r.json())
                    : Promise.resolve([]),
            ]);
            setPkgResults(Array.isArray(pkgs)   ? pkgs   : []);
            setUserResults(Array.isArray(users) ? users  : []);
            setTagResults(Array.isArray(tags)   ? tags   : []);
        } catch {
            setPkgResults([]); setUserResults([]); setTagResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) setSearchParams({ q: query.trim() });
    };

    const handleCategory = (label: string) => {
        setQuery("");
        setActiveTab("paquetes");
        setSearchParams({ category: label });
    };

    const handleTag = (tag: string) => {
        setQuery(tag);
        setActiveTab("tags");
        setSearchParams({ q: tag });
    };

    const clearSearch = () => {
        setQuery("");
        setSearchParams({});
        setPkgResults([]); setUserResults([]); setTagResults([]);
    };

    const tabCounts: Record<SearchTab, number> = {
        paquetes: pkgResults.length,
        perfiles: userResults.length,
        tags:     tagResults.length,
    };

    return (
        <div className="search-page">
            {/* BARRA */}
            <div className="search-topbar">
                <form className="search-form" onSubmit={handleSubmit}>
                    <div className={`search-input-wrapper ${focused ? "focused" : ""}`}>
                        <SearchIcon />
                        <input
                            className="search-input"
                            placeholder="Buscar paquetes, perfiles, tags..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            autoFocus
                        />
                        {query && (
                            <button type="button" className="search-clear-btn" onClick={clearSearch} aria-label="Limpiar">
                                <ClearIcon />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* TABS — solo con búsqueda activa */}
            {hasSearched && (
                <div className="search-tabs">
                    {(["paquetes", "perfiles", "tags"] as SearchTab[]).map(tab => (
                        <button
                            key={tab}
                            className={`search-tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tabCounts[tab] > 0 && (
                                <span className="search-tab-count">{tabCounts[tab]}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div className="search-body">

                {/* ── SIN BÚSQUEDA ── */}
                {!hasSearched && (
                    <>
                        <section className="search-section">
                            <h2 className="search-section-title">Categorías</h2>
                            <div className="search-categories-grid">
                                {CATEGORIES.map(cat => (
                                    <button key={cat.label} className="search-category-chip" onClick={() => handleCategory(cat.label)}>
                                        <span className="chip-icon">{cat.icon}</span>
                                        <span className="chip-label">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="search-section">
                            <h2 className="search-section-title">Etiquetas populares</h2>
                            <div className="search-tags-row">
                                {popularTags.length > 0
                                    ? popularTags.map(t => (
                                        <button key={t.tag} className="search-tag-pill" onClick={() => handleTag(t.tag)}>
                                            #{t.tag}
                                            <span className="tag-pill-count">{t.packageCount}</span>
                                        </button>
                                    ))
                                    : ["inglés", "biología", "historia", "física", "matemáticas"].map(tag => (
                                        <button key={tag} className="search-tag-pill" onClick={() => handleTag(tag)}>
                                            #{tag}
                                        </button>
                                    ))
                                }
                            </div>
                        </section>

                        {trending.length > 0 && (
                            <section className="search-section">
                                <h2 className="search-section-title">Tendencias</h2>
                                <div className="search-recent-list">
                                    {trending.slice(0, 5).map(pkg => (
                                        <button key={pkg.id} className="search-recent-item" onClick={() => navigate(`/packages/${pkg.id}`)}>
                                            <ClockIcon />
                                            <span className="search-recent-name">{pkg.name}</span>
                                            <span className="search-recent-meta">{pkg.category}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* ── CON BÚSQUEDA ── */}
                {hasSearched && (
                    <section className="search-section">
                        <h2 className="search-section-title">
                            {loading
                                ? "Buscando..."
                                : `${tabCounts[activeTab]} resultado${tabCounts[activeTab] !== 1 ? "s" : ""} para ${searchLabel}`
                            }
                        </h2>

                        {loading && (
                            <div className="search-skeleton-list">
                                {[1,2,3].map(i => <div key={i} className="search-skeleton" />)}
                            </div>
                        )}

                        {/* PAQUETES */}
                        {!loading && activeTab === "paquetes" && (
                            <>
                                {pkgResults.length === 0 && <EmptyState text="No encontramos paquetes" />}
                                <div className="search-results-list">
                                    {pkgResults.map(pkg => (
                                        <div key={pkg.id} className="search-result-card" onClick={() => navigate(`/packages/${pkg.id}`)}>
                                            <div className="search-result-info">
                                                <span className="search-result-category">{pkg.category}</span>
                                                <h3 className="search-result-name">{pkg.name}</h3>
                                                {pkg.description && <p className="search-result-desc">{pkg.description}</p>}
                                                <div className="search-result-meta">
                                                    <span>{pkg.cardCount} tarjetas</span>
                                                    <span className="meta-dot">·</span>
                                                    <span>por {pkg.authorName}</span>
                                                </div>
                                                {pkg.tags && pkg.tags.length > 0 && (
                                                    <div className="search-result-tags">
                                                        {pkg.tags.map(tag => (
                                                            <span key={tag} className="search-result-tag">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronIcon />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* PERFILES */}
                        {!loading && activeTab === "perfiles" && (
                            <>
                                {userResults.length === 0 && <EmptyState text="No encontramos perfiles" />}
                                <div className="search-results-list">
                                    {userResults.map(u => (
                                        <div key={u.id} className="search-user-card">
                                            <div className="search-user-avatar">
                                                {u.photoUrl
                                                    ? <img src={u.photoUrl} alt={u.name} className="search-user-avatar-img" />
                                                    : <span>{u.name.slice(0,2).toUpperCase()}</span>
                                                }
                                            </div>
                                            <div className="search-user-info">
                                                <p className="search-user-name">{u.name}</p>
                                                {u.description && <p className="search-user-desc">{u.description}</p>}
                                                <p className="search-user-meta">{u.packageCount} paquetes públicos</p>
                                            </div>
                                            <ChevronIcon />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* TAGS */}
                        {!loading && activeTab === "tags" && (
                            <>
                                {tagResults.length === 0 && <EmptyState text="No encontramos paquetes con esa etiqueta" />}
                                <div className="search-results-list">
                                    {tagResults.map(pkg => (
                                        <div key={pkg.id} className="search-result-card" onClick={() => navigate(`/packages/${pkg.id}`)}>
                                            <div className="search-result-info">
                                                <span className="search-result-category">{pkg.category}</span>
                                                <h3 className="search-result-name">{pkg.name}</h3>
                                                <div className="search-result-meta">
                                                    <span>{pkg.cardCount} tarjetas</span>
                                                    <span className="meta-dot">·</span>
                                                    <span>por {pkg.authorName}</span>
                                                </div>
                                                {pkg.tags && pkg.tags.length > 0 && (
                                                    <div className="search-result-tags">
                                                        {pkg.tags.map(tag => (
                                                            <span key={tag} className={`search-result-tag ${tag === query.toLowerCase() ? "active-tag" : ""}`}>
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <ChevronIcon />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="search-empty">
            <span className="search-empty-icon"><SearchIcon /></span>
            <p className="search-empty-title">{text}</p>
            <p className="search-empty-sub">Prueba con otro término</p>
        </div>
    );
}

function SearchIcon() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/><path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ClearIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" fill="rgba(0,0,0,0.08)"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function ClockIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
}
function ChevronIcon() {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function UniIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 10.5v5c0 2 2.686 3.5 6 3.5s6-1.5 6-3.5v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M22 8v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function PaesIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function LangIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}
function LicIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="16" cy="14" r="2" stroke="currentColor" strokeWidth="1.6"/></svg>;
}
function SciIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 3v8L4 19a1 1 0 0 0 .9 1.4h14.2A1 1 0 0 0 20 19l-5-8V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="15" r="1" fill="currentColor"/><circle cx="14" cy="17" r="1" fill="currentColor"/></svg>;
}
function OtrosIcon() {
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
}