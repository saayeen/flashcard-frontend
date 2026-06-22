import { useState } from "react";
import { useNavigate } from "react-router-dom";
import jatiImg from "../../assets/jati.png";
import "./Onboarding.css";

const ONBOARDING_KEY = "flashcard_onboarding_seen";

interface Slide {
    title: string;
    body: string;
    cta: string;
    showJati: boolean;
    }

    const slides: Slide[] = [
    {
        title: "Jati",
        body: "¿Qué es Jati?",
        cta: "Toca para descubrir →",
        showJati: true,
    },
    {
        title: "",
        body: "Tu plataforma de estudio con flashcards, en español y gratis",
        cta: "Continuar →",
        showJati: false,
    },
    {
        title: "Empieza",
        body: "Tu compañero de estudio colaborativo",
        cta: "Explorar →",
        showJati: true,
    },
    ];

    export function hasSeenOnboarding(): boolean {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
    }

    export default function Onboarding() {
    const [step, setStep] = useState(0);
    const navigate = useNavigate();
    const isLast = step === slides.length - 1;

    const handleNext = () => {
        if (isLast) {
        localStorage.setItem(ONBOARDING_KEY, "true");
        navigate("/");
        return;
        }
        setStep((s) => s + 1);
    };

    const slide = slides[step];

    return (
        <div className="onboarding-page" onClick={handleNext}>
        <div className="onboarding-card">
            {slide.showJati && (
            <img src={jatiImg} alt="Jati" className="onboarding-mascot" />
            )}

            {slide.title && <h1 className="onboarding-title">{slide.title}</h1>}

            <p className="onboarding-body">{slide.body}</p>

            <div className="onboarding-footer">
            <span className="onboarding-cta">{slide.cta}</span>

            <div className="onboarding-dots">
                {slides.map((_, i) => (
                <span
                    key={i}
                    className={`dot ${i === step ? "dot-active" : ""}`}
                />
                ))}
            </div>
            </div>
        </div>
        </div>
    );
}