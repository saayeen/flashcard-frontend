import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SearchResult } from "../../types/index";
import BottomNav from "../navigation/BottomNav";
import "./Search.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const CATEGORIES = [
    { label: "Universidad", icon: <UniIcon /> },
    { label: "PAES",        icon: <PaesIcon /> },
    { label: "Idiomas",     icon: <LangIcon /> },
    { label: "Licencias",   icon: <LicIcon /> },
    { label: "Ciencias",    icon: <SciIcon /> },
    { label: "Otros",       icon: <OtrosIcon /> },
];

const POPULAR_TAGS = ["inglés", "biología", "historia", "física", "matemáticas", "programación"];

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [trending, setTrending] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/search/trending`)
            .then(r => r.json())
            .then(setTrending)
            .catch(() => {});
    }, []);

    useEffect(() => {
        const q = searchParams.get("q") ?? "";
        const category = searchParams.get("category") ?? "";
        if (q) setQuery(q);
        if (q || category) doSearch(q, category || undefined);
        else setResults([]);
    }, [searchParams]);

    const doSearch = async (q: string, category?: string) => {
        if (!q.trim() && !category) return;
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (category) params.set("category", category);
            const res = await fetch(`${API_URL}/search?${params.toString()}`);
            setResults(await res.json());
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            setSearchParams({ q: query.trim() });
        }
    };

    const handleCategory = (label: string) => {
        setQuery("");
        setSearchParams({ category: label });
    };

    const handleTag = (tag: string) => {
        setQuery(tag);
        setSearchParams({ q: tag });
    };

    const hasSearched = searchParams.get("q") !== null || searchParams.get("category") !== null;
    const activeCategory = searchParams.get("category");
    const searchLabel = activeCategory
        ? `Categoría: ${activeCategory}`
        : `"${searchParams.get("q")}"`;

    const clearSearch = () => {
        setQuery("");
        setSearchParams({});
        setResults([]);
    };

    return (
        <div className="search-page">
            {/* BARRA DE BÚSQUEDA */}
            <div className="search-topbar">
                <form className="search-form" onSubmit={handleSubmit}>
                    <div className={`search-input-wrapper ${focused ? "focused" : ""}`}>
                        <SearchIcon />
                        <input
                            className="search-input"
                            placeholder="Buscar paquetes..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            autoFocus
                        />
                        {query && (
                            <button
                                type="button"
                                className="search-clear-btn"
                                onClick={clearSearch}
                                aria-label="Limpiar búsqueda"
                            >
                                <ClearIcon />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="search-body">
                {/* ESTADO SIN BÚSQUEDA */}
                {!hasSearched && (
                    <>
                        {/* CATEGORÍAS */}
                        <section className="search-section">
                            <h2 className="search-section-title">Categorías</h2>
                            <div className="search-categories-grid">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.label}
                                        className="search-category-chip"
                                        onClick={() => handleCategory(cat.label)}
                                    >
                                        <span className="chip-icon">{cat.icon}</span>
                                        <span className="chip-label">{cat.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* ETIQUETAS POPULARES */}
                        <section className="search-section">
                            <h2 className="search-section-title">Etiquetas populares</h2>
                            <div className="search-tags-row">
                                {POPULAR_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        className="search-tag-pill"
                                        onClick={() => handleTag(tag)}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* BÚSQUEDAS RECIENTES / TENDENCIAS */}
                        {trending.length > 0 && (
                            <section className="search-section">
                                <h2 className="search-section-title">Recientes</h2>
                                <div className="search-recent-list">
                                    {trending.slice(0, 4).map(pkg => (
                                        <button
                                            key={pkg.id}
                                            className="search-recent-item"
                                            onClick={() => navigate(`/packages/${pkg.id}`)}
                                        >
                                            <ClockIcon />
                                            <span className="search-recent-name">{pkg.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* RESULTADOS */}
                {hasSearched && (
                    <section className="search-section">
                        <h2 className="search-section-title">
                            {loading
                                ? "Buscando..."
                                : `${results.length} resultado${results.length !== 1 ? "s" : ""} para ${searchLabel}`
                            }
                        </h2>

                        {!loading && results.length === 0 && (
                            <div className="search-empty">
                                <span className="search-empty-icon">🔍</span>
                                <p className="search-empty-title">Sin resultados</p>
                                <p className="search-empty-sub">Prueba con otro término o categoría</p>
                            </div>
                        )}

                        {loading && (
                            <div className="search-skeleton-list">
                                {[1, 2, 3].map(i => <div key={i} className="search-skeleton" />)}
                            </div>
                        )}

                        <div className="search-results-list">
                            {results.map(pkg => (
                                <div
                                    className="search-result-card"
                                    key={pkg.id}
                                    onClick={() => navigate(`/packages/${pkg.id}`)}
                                >
                                    <div className="search-result-info">
                                        <span className="search-result-category">{pkg.category}</span>
                                        <h3 className="search-result-name">{pkg.name}</h3>
                                        {pkg.description && (
                                            <p className="search-result-desc">{pkg.description}</p>
                                        )}
                                        <div className="search-result-meta">
                                            <span>{pkg.cardCount} tarjetas</span>
                                            <span className="meta-dot">·</span>
                                            <span>por {pkg.authorName}</span>
                                        </div>
                                    </div>
                                    <ChevronIcon />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

function SearchIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function ClearIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" fill="rgba(0,0,0,0.08)" />
            <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
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

function UniIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 3L2 8l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
            <path d="M6 10.5v5c0 2 2.686 3.5 6 3.5s6-1.5 6-3.5v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M22 8v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function PaesIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function LangIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}

function LicIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="16" cy="14" r="2" stroke="currentColor" strokeWidth="1.6"/>
        </svg>
    );
}

function SciIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 3v8L4 19a1 1 0 0 0 .9 1.4h14.2A1 1 0 0 0 20 19l-5-8V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 3h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            <circle cx="10" cy="15" r="1" fill="currentColor"/>
            <circle cx="14" cy="17" r="1" fill="currentColor"/>
        </svg>
    );
}

function OtrosIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
    );
}