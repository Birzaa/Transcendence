export async function fetchData(type: string, userId: string) {
	try {
		const res = await fetch(`/api/data?type=${encodeURIComponent(type)}&userId=${encodeURIComponent(userId)}`);
		if (!res.ok) {
			const errorText = await res.text();
			console.error('fetchData error:', errorText);
			return null; // ← retourne null au lieu de throw
		}
		return await res.json();
	} catch (err) {
		console.error('fetchData crash:', err);
		return null;
	}
}
