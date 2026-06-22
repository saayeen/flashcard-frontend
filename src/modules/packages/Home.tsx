import { useEffect, useState } from "react";
import type { FlashcardPackage } from "../../types/index";
import { getPackages } from "./packageService";
import Header from "../navigation/Header";
import BottomNav from "../navigation/BottomNav";
import { useAuth } from "../auth/AuthContext";
import jatiImg from "../../assets/Jati.png";
import "./Home.css";

export default function Home() {
    const [packages, setPackages] = useState<FlashcardPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const firstName = user?.displayName?.split(" ")[0];

    useEffect(() => {
        getPackages()
        .then(setPackages)
        .catch(() => setError("No se pudieron cargar los paquetes"))
        .finally(() => setLoading(false));
    }, []);

    return (
        <div className="home-page">
        <Header />

        <div className="home-greeting">
    <h1 className="home-hello">
        {firstName ? `Hola, ${firstName}` : "Explora Jati"} 
        <img src={jatiImg} alt="Jati" className="home-jati" />
    </h1>
    </div>

        {loading && <p className="home-status">Cargando paquetes...</p>}
        {error && <p className="home-status home-error">{error}</p>}

        {!loading && !error && packages.length === 0 && (
            <p className="home-status">Todavía no hay paquetes públicos.</p>
        )}

        <div className="package-grid">
            {packages.map((pkg) => (
            <div className="package-card" key={pkg.id}>
                <span className="package-category">{pkg.category}</span>
                <h2 className="package-name">{pkg.name}</h2>
                <p className="package-description">{pkg.description}</p>
                <span className="package-count">{pkg.cardCount} tarjetas</span>
            </div>

            
            ))}
        </div>

        <BottomNav />
        </div>
    );
}