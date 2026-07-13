const KEY = "jati-recent-packages";
const MAX_ITEMS = 10;

export function addRecentPackage(id: number) {
    const current = getRecentPackageIds();
    const updated = [id, ...current.filter(x => x !== id)].slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(updated));
}

export function getRecentPackageIds(): number[] {
    try {
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}