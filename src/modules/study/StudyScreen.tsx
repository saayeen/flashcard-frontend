import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { Flashcard } from "../../types/index";
import jatiImg from "../../assets/jati.png";
import dificilImg from "../../assets/Dificil.png";
import casiImg from "../../assets/Casi.png";
import bienImg from "../../assets/Bien.png";
import facilImg from "../../assets/Facil.png";
import "./StudyScreen.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

type Phase = "studying" | "summary";

interface SessionSummary {
    sessionId: number;
    totalCards: number;
    difficult: number;
    almost: number;
    good: number;
    easy: number;
}

// modo oscuro —  (pastel, suaves)
const CARD_GRADIENTS_DARK = [
    "linear-gradient(135deg, #f9a8d4, #fb7185)",
    "linear-gradient(135deg, #a5f3fc, #38bdf8)",
    "linear-gradient(135deg, #bbf7d0, #34d399)",
    "linear-gradient(135deg, #fde68a, #f59e0b)",
    "linear-gradient(135deg, #c4b5fd, #8b5cf6)",
    "linear-gradient(135deg, #fed7aa, #f97316)",
];

// modo claro — mas oscuros/saturados
const CARD_GRADIENTS_LIGHT = [
    "linear-gradient(135deg, #f9a8d4, #fb7185)",
    "linear-gradient(135deg, #a5f3fc, #38bdf8)",
    "linear-gradient(135deg, #bbf7d0, #34d399)",
    "linear-gradient(135deg, #fde68a, #f59e0b)",
    "linear-gradient(135deg, #c4b5fd, #8b5cf6)",
    "linear-gradient(135deg, #fed7aa, #f97316)",
];

const QUALITY_CONFIG = [
    { quality: 1, label: "Difícil", time: "1m",  timeColor: "#ef4444", img: dificilImg },
    { quality: 2, label: "Casi",    time: "6m",  timeColor: "#f59e0b", img: casiImg   },
    { quality: 3, label: "Bien",    time: "10m", timeColor: "#3b82f6", img: bienImg   },
    { quality: 4, label: "Fácil",   time: "5d",  timeColor: "#22c55e", img: facilImg  },
];

export default function StudyScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [cards, setCards]             = useState<Flashcard[]>([]);
    const [sessionId, setSessionId]     = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped]         = useState(false);
    const [phase, setPhase]             = useState<Phase>("studying");
    const [summary, setSummary]         = useState<SessionSummary | null>(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [animating, setAnimating]     = useState(false);

    const [isDark, setIsDark] = useState(
        () => document.documentElement.getAttribute("data-theme") === "dark"
            );

            useEffect(() => {
                const observer = new MutationObserver(() => {
                    setIsDark(document.documentElement.getAttribute("data-theme") === "dark");
                });
                observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
                return () => observer.disconnect();
            }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const token = await getToken();
                const [cardsRes, sessionRes] = await Promise.all([
                    fetch(`${API_URL}/packages/${id}/cards`),
                    fetch(`${API_URL}/study/sessions`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ packageId: Number(id) }),
                    }),
                ]);
                setCards(await cardsRes.json());
                setSessionId((await sessionRes.json()).id);
            } catch {
                setError("No se pudo iniciar la sesión");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id]);

    const handleQuality = async (quality: number) => {
        if (!sessionId || animating) return;
        setAnimating(true);

        const card = cards[currentIndex];
        try {
            const token = await getToken();
            await fetch(`${API_URL}/study/sessions/${sessionId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ cardId: card.id, quality }),
            });
        } catch {}

        if (currentIndex + 1 >= cards.length) {
            await finishSession();
        } else {
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setFlipped(false);
                setAnimating(false);
            }, 200);
        }
    };

    const finishSession = async () => {
        if (!sessionId) return;
        try {
            const token = await getToken();
            const res = await fetch(`${API_URL}/study/sessions/${sessionId}/finish`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
            });
            setSummary(await res.json());
        } catch {}
        setPhase("summary");
        setAnimating(false);
    };

    if (loading) return (
        <div className="study-loading">
            <img src={jatiImg} alt="Jati" className="study-loading-logo" />
            <p>Preparando sesión...</p>
        </div>
    );

    if (error) return (
        <div className="study-loading">
            <p>{error}</p>
            <button className="study-error-btn" onClick={() => navigate(-1)}>Volver</button>
        </div>
    );

    if (cards.length === 0) return (
        <div className="study-loading">
            <p>No hay tarjetas para estudiar</p>
            <button className="study-error-btn" onClick={() => navigate(-1)}>Volver</button>
        </div>
    );

    /* ── RESUMEN ── */
    if (phase === "summary" && summary) {
        return (
            <div className="study-page study-summary-page">
                <div className="summary-container">
                    <div className="summary-header">
                        <div className="summary-jati">
                            <img src={jatiImg} alt="Jati" className="summary-jati-img" />
                        </div>
                        <h1 className="summary-title">¡Completaste el paquete!</h1>
                        <p className="summary-sub">{summary.totalCards} tarjetas estudiadas</p>
                    </div>

                    <div className="summary-grid">
                        {[
                            { img: dificilImg, number: summary.difficult, label: "Difícil", cls: "summary-difficult" },
                            { img: casiImg,    number: summary.almost,    label: "Casi",    cls: "summary-almost"   },
                            { img: bienImg,    number: summary.good,      label: "Bien",    cls: "summary-good"     },
                            { img: facilImg,   number: summary.easy,      label: "Fácil",   cls: "summary-easy"     },
                        ].map(({ img, number, label, cls }) => (
                            <div key={label} className={`summary-stat ${cls}`}>
                                <img src={img} alt={label} className="summary-stat-jati" />
                                <span className="stat-number">{number}</span>
                                <span className="stat-label">{label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="summary-actions">
                        <button className="summary-btn-primary" onClick={() => navigate(`/packages/${id}`)}>
                            Ver paquete
                        </button>
                        <button className="summary-btn-secondary" onClick={() => navigate("/")}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ── ESTUDIANDO ── */
    const card = cards[currentIndex];
    const progress = ((currentIndex) / cards.length) * 100;
    const gradients = isDark ? CARD_GRADIENTS_DARK : CARD_GRADIENTS_LIGHT;
    const gradient = gradients[currentIndex % gradients.length];

    return (
        <div className="study-page">
            {/* HEADER */}
            <div className="study-header">
                <button className="study-back-btn" onClick={() => navigate(-1)}>
                    <BackIcon />
                </button>
                <div className="study-progress-bar">
                    <div className="study-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="study-counter">{currentIndex + 1}/{cards.length}</span>
            </div>

            {/* TARJETA */}
            <div className="study-card-container" onClick={() => !animating && setFlipped(!flipped)}>
                <div className={`study-card ${flipped ? "flipped" : ""} ${animating ? "animating" : ""}`}>
                    <div className="study-card-front" style={{ background: gradient }}>
                        {!flipped && (
                            <span className="study-tap-hint">Toca para ver respuesta</span>
                        )}
                        <p className="study-card-text">{card.question}</p>
                    </div>
                    <div className="study-card-back" style={{ background: gradient }}>
                        <p className="study-card-text">{card.answer}</p>
                    </div>
                </div>
            </div>

            {/* BOTONES DE CALIDAD */}
            {flipped && (
                <div className="study-actions">
                    <div className="study-buttons">
                        {QUALITY_CONFIG.map(({ quality, label, time, timeColor, img }) => (
                            <button
                                key={quality}
                                className={`quality-btn quality-${quality}`}
                                onClick={e => { e.stopPropagation(); handleQuality(quality); }}
                                disabled={animating}
                            >
                                <img src={img} alt={label} className="quality-jati" />
                                <span className="quality-label">{label}</span>
                                <span className="quality-time" style={{ color: timeColor }}>{time}</span>
                            </button>
                        ))}
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