export async function fetchData(type, userId) {
    const res = await fetch(`/api/data?type=${type}&userId=${userId}`);
    if (!res.ok)
        throw new Error('Fetch error');
    return await res.json();
}
