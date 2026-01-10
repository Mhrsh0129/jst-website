export const fetchFromLocal = async (endpoint: string) => {
    const BRIDGE_URL = import.meta.env.VITE_BRIDGE_API_URL || "http://localhost:8000";
    try {
        const resp = await fetch(`${BRIDGE_URL}${endpoint}`);
        if (!resp.ok) throw new Error("Local API offline");
        return await resp.json();
    } catch (e) {
        console.warn(`Local Bridge Error for ${endpoint}:`, e);
        return null;
    }
};
