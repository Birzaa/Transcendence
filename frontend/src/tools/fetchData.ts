export async function fetchData(type: string, userId: string) {
	const res = await fetch(`/api/data?type=${encodeURIComponent(type)}&userId=${encodeURIComponent(userId)}`);
	if (!res.ok) {
		const errorText = await res.text(); // <-- pour voir le message exact
		console.error('fetchData error:', errorText);
		throw new Error('Fetch error');
	}
	return await res.json();
}
