import type { FlashcardPackage } from "../../types/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// todos los públicos — Home / Trending
export async function getPackages(): Promise<FlashcardPackage[]> {
    const res = await fetch(`${API_URL}/packages`);
    if (!res.ok) throw new Error("No se pudieron cargar los paquetes");
    return res.json();
}

// paquetes originales del usuario (creados por él)
export async function getMyPackages(token: string): Promise<FlashcardPackage[]> {
    const res = await fetch(`${API_URL}/users/me/packages`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("No se pudieron cargar tus paquetes");
    return res.json();
}

// paquetes copiados (fork)
export async function getMyForkedPackages(token: string): Promise<FlashcardPackage[]> {
    const res = await fetch(`${API_URL}/users/me/packages/forked`, {
        headers: { "Authorization": `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("No se pudieron cargar los paquetes copiados");
    return res.json();
}