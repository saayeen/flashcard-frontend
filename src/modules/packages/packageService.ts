import type { FlashcardPackage } from "../../types/index";

const API_URL = "http://localhost:8080";

export async function getPackages(): Promise<FlashcardPackage[]> {
  const response = await fetch(`${API_URL}/packages`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los paquetes");
  }
  return response.json();
}