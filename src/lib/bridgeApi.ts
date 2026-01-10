export const fetchFromLocal = async (endpoint: string) => {
    try {
        const resp = await fetch(`http://localhost:8000${endpoint}`);
        if (!resp.ok) throw new Error("Local API offline");
        return await resp.json();
    } catch (e) {
        console.warn(`Local Bridge Error for ${endpoint}:`, e);
        return null;
    }
};
