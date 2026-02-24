export async function syncFavoritesToDB(kuralIds: number[]) {
    await fetch('/api/user/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kuralIds }),
    }).catch(err => console.error('Failed to sync favorites to DB:', err));
}

export async function syncProgressToDB(completedLetters: string[], badges: any[]) {
    await fetch('/api/user/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completedLetters, badges }),
    }).catch(err => console.error('Failed to sync progress to DB:', err));
}
