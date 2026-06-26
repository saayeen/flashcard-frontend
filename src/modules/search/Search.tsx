import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { SearchResult } from "../../types/index";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import "./Search.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Search() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [trending, setTrending] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

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
        }
    }, [searchParams]);

    const doSearch = async (q: string) => {
        if (!q.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data);
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

    const hasSearched = searchParams.get("q") !== null;

    return (
        <div className="search-page">
            <Header />

            <div className="search-bar-container">
                <form className="search-form" onSubmit={handleSubmit}>
                    <div className="search-input-wrapper">
                        <SearchIcon />
                        <input
                            className="search-input"
                            placeholder="Buscar paquetes..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            autoFocus
                        />
                        {query && (
                            <button type="button" className="search-clear-btn" onClick={() => { setQuery(""); setSearchParams({}); setResults([]); }}>
                                ×
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {!hasSearched && (
                <div className="search-trending">
                    <h2 className="search-section-title">Tendencias</h2>
                    <div className="search-results">
                        {trending.map(pkg => (
                            <div className="search-card" key={pkg.id} onClick={() => navigate(`/packages/${pkg.id}`)}>
                                <span className="search-card-category">{pkg.category}</span>
                                <h3 className="search-card-name">{pkg.name}</h3>
                                <p className="search-card-desc">{pkg.description}</p>
                                <div className="search-card-meta">
                                    <span>{pkg.cardCount} tarjetas</span>
                                    <span>por {pkg.authorName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {hasSearched && (
                <div className="search-results-section">
                    <h2 className="search-section-title">
                        {loading ? "Buscando..." : `${results.length} resultados para "${searchParams.get("q")}"`}
                    </h2>
                    {!loading && results.length === 0 && (
                        <div className="search-empty">
                            <span>🔍</span>
                            <p>No encontramos paquetes con ese nombre</p>
                        </div>
                    )}
                    <div className="search-results">
                        {results.map(pkg => (
                            <div className="search-card" key={pkg.id} onClick={() => navigate(`/packages/${pkg.id}`)}>
                                <span className="search-card-category">{pkg.category}</span>
                                <h3 className="search-card-name">{pkg.name}</h3>
                                <p className="search-card-desc">{pkg.description}</p>
                                <div className="search-card-meta">
                                    <span>{pkg.cardCount} tarjetas</span>
                                    <span>por {pkg.authorName}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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