export function getTodayFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseMinutes(minStr) {
  if (!minStr || minStr === "0:00" || minStr === "00" || minStr === "0") return 0;
  if (typeof minStr === "number") return minStr;

  if (minStr.includes(":")) {
    const [mins, secs] = minStr.split(":").map(Number);
    return mins + (secs || 0) / 60;
  }

  return parseFloat(minStr) || 0;
}

export function calculateAvgMinutes(stats) {
  if (!stats || stats.length === 0) return 0;

  const gamesPlayed = stats.filter((g) => parseMinutes(g.min) > 0);
  if (gamesPlayed.length === 0) return 0;

  const totalMinutes = gamesPlayed.reduce((sum, g) => sum + parseMinutes(g.min), 0);
  return totalMinutes / gamesPlayed.length;
}

export const MIN_AVG_MINUTES = 15;
