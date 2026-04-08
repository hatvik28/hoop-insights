import { useQuery } from "@tanstack/react-query";
import { fetchGames, fetchPlayers, fetchPlayerStats, fetchPlayerOdds } from "@/services/api";
import type { NbaGame, NbaPlayer, PlayerStatsResponse, PlayerOddsResponse } from "@/types/nba";

const STALE_TIME = 5 * 60 * 1000;

export function useGames() {
  return useQuery<NbaGame[]>({
    queryKey: ["games"],
    staleTime: STALE_TIME,
    queryFn: fetchGames,
  });
}

export function usePlayers(gameId: string | null) {
  return useQuery<NbaPlayer[]>({
    queryKey: ["players", gameId],
    enabled: !!gameId,
    staleTime: STALE_TIME,
    retry: 2,
    queryFn: () => fetchPlayers(gameId!),
  });
}

export function usePlayerStats(
  playerId: string | null,
  gameId: string | undefined,
) {
  return useQuery<PlayerStatsResponse>({
    queryKey: ["playerStats", playerId, gameId],
    enabled: !!playerId && !!gameId,
    staleTime: STALE_TIME,
    queryFn: () => fetchPlayerStats(playerId!, gameId!),
  });
}

export function usePlayerOdds(
  playerName: string | undefined,
  homeTeam: string | undefined,
  awayTeam: string | undefined,
) {
  return useQuery<PlayerOddsResponse>({
    queryKey: ["playerOdds", playerName, homeTeam, awayTeam],
    enabled: !!playerName && !!homeTeam && !!awayTeam,
    staleTime: 15 * 60 * 1000,
    queryFn: () => fetchPlayerOdds(playerName!, homeTeam!, awayTeam!),
  });
}
