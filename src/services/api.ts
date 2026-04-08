import type { NbaGame, NbaPlayer, PlayerStatsResponse, PlayerOddsResponse } from "@/types/nba";

export async function fetchGames(): Promise<NbaGame[]> {
  const res = await fetch("/api/games");
  if (!res.ok) throw new Error("Failed to load games");
  return res.json();
}

export async function fetchPlayers(gameId: string): Promise<NbaPlayer[]> {
  const res = await fetch(`/api/games/${gameId}/players`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Failed to load players");
  }
  return res.json();
}

export async function fetchPlayerStats(
  playerId: string,
  gameId: string,
): Promise<PlayerStatsResponse> {
  const res = await fetch(`/api/players/${playerId}/stats?gameId=${gameId}`);
  if (!res.ok) throw new Error("Failed to load player stats");
  return res.json();
}

export async function fetchPlayerOdds(
  playerName: string,
  homeTeam: string,
  awayTeam: string,
): Promise<PlayerOddsResponse> {
  const params = new URLSearchParams({ playerName, homeTeam, awayTeam });
  const res = await fetch(`/api/odds?${params}`);
  if (!res.ok) throw new Error("Failed to load odds");
  return res.json();
}
