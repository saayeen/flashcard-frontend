import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SearchResult } from "../../types/index";
import BottomNav from "../navigation/BottomNav";
import "./Search.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

const CATEGORIES = [
    { label: "Universidad", emoji: "🎓" },
    { label: "PAES", emoji: "📝" },
    { label: "Carrera", emoji: "💼" },
    { label: "Idiomas", emoji: "🌐" },
    { label: "Licencias", emoji: "📋" },
    { label: "Otros", emoji: "✨" },
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
        const q = searchParams.get("q");
        if (q) {
            setQuery(q);
            doSearch(q);
        } else {
            setResults([]);
        }
    }, [searchParams]);

    const doSearch = async (q: string) => {
        if (!q.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
            setResults(await res.json());
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) setSearchParams({ q: query.trim() });
    };

    const handleCategory = (label: string) => {
        setQuery(label);
        setSearchParams({ q: label });
    };

    const handleTag = (tag: string) => {
        setQuery(tag);
        setSearchParams({ q: tag });
    };

    const clearSearch = () => {
        setQuery("");
        setSearchParams({});
        setResults([]);
    };

    const hasSearched = searchParams.get("q") !== null;

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
                                        <span className="chip-emoji">{cat.emoji}</span>
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
                                : `${results.length} resultado${results.length !== 1 ? "s" : ""} para "${searchParams.get("q")}"`
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
            <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.15)" />
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