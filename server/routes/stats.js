import { Router } from "express";
import { bdlFetch, gameCache, teamMap } from "../lib/bdlClient.js";

const router = Router();

function toGameLog(g) {
  const gameData = g.game ?? {};
  const statTeamId = g.team?.id;
  const homeTeamId = gameData.home_team_id ?? gameData.home_team?.id;
  const visitorTeamId = gameData.visitor_team_id ?? gameData.visitor_team?.id;
  const isHome = statTeamId === homeTeamId;
  const opponentTeamId = isHome ? visitorTeamId : homeTeamId;
  const opponentTeamInfo = teamMap.get(opponentTeamId);
  return {
    date: gameData.date
      ? new Date(gameData.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "",
    opponent: opponentTeamInfo?.abbreviation || "OPP",
    points: g.pts ?? 0,
    rebounds: g.reb ?? 0,
    assists: g.ast ?? 0,
    minutes: g.min ?? "0",
  };
}


router.get("/:playerId/stats", async (req, res) => {
  const { playerId } = req.params;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ message: "Missing gameId query param" });
  }

  try {
    const cachedGame = gameCache.get(gameId);
    const [playerResponse, gameResult] = await Promise.all([
      bdlFetch(`/players/${playerId}`),
      cachedGame
        ? Promise.resolve(cachedGame)
        : bdlFetch(`/games/${gameId}`).then((r) => r.data ?? r),
    ]);

    const player = playerResponse.data ?? playerResponse;
    const playerName = `${player.first_name} ${player.last_name}`;
    console.log(`\n=== Fetching stats for ${playerName} (ID: ${playerId}) ===`);

    const game = gameResult;
    if (!cachedGame) gameCache.set(gameId, game);

    const playerTeamId = player.team?.id;
    const isHomeTeam = playerTeamId === game.home_team?.id;
    const opponentTeam = isHomeTeam ? game.visitor_team : game.home_team;

    const statsResponse = await bdlFetch(
      `/stats?player_ids[]=${playerId}&seasons[]=2025&per_page=100`,
    );

    let gameStats = statsResponse.data ?? [];
    console.log(`Found ${gameStats.length} game stats for 2025 season`);

    if (gameStats.length === 0) {
      console.log("No 2025 stats, trying 2024...");
      const stats2024 = await bdlFetch(
        `/stats?player_ids[]=${playerId}&seasons[]=2024&per_page=100`,
      );
      gameStats = stats2024.data ?? [];
      console.log(`Found ${gameStats.length} game stats for 2024`);
    }

    gameStats.sort((a, b) => {
      const dateA = new Date(a.game?.date ?? 0);
      const dateB = new Date(b.game?.date ?? 0);
      return dateB - dateA;
    });

    let seasonAvgPoints = 0;
    if (gameStats.length > 0) {
      const gamesPlayed = gameStats.filter(
        (g) => g.min && g.min !== "0:00" && g.min !== "00",
      );
      const totalPoints = gamesPlayed.reduce((sum, g) => sum + (g.pts ?? 0), 0);
      seasonAvgPoints =
        gamesPlayed.length > 0
          ? Math.round((totalPoints / gamesPlayed.length) * 10) / 10
          : 0;
    }

    const tonightOpponentTeamId = opponentTeam?.id;
    const last10Games = gameStats.slice(0, 10).map(toGameLog);

    const gamesVsOpponent = gameStats
      .filter((g) => {
        const gameData = g.game ?? {};
        const statTeamId = g.team?.id;
        const homeTeamId = gameData.home_team_id ?? gameData.home_team?.id;
        const visitorTeamId = gameData.visitor_team_id ?? gameData.visitor_team?.id;
        const isHome = statTeamId === homeTeamId;
        const opponentInGame = isHome ? visitorTeamId : homeTeamId;
        return opponentInGame === tonightOpponentTeamId;
      })
      .map(toGameLog);

    let avgPpgVsOpponent = 0;
    if (gamesVsOpponent.length > 0) {
      const withMinutes = gamesVsOpponent.filter(
        (g) => g.minutes && g.minutes !== "0:00" && g.minutes !== "00" && g.minutes !== "0",
      );
      const totalPts = withMinutes.reduce((sum, g) => sum + g.points, 0);
      avgPpgVsOpponent =
        withMinutes.length > 0
          ? Math.round((totalPts / withMinutes.length) * 10) / 10
          : 0;
    }

    const opponentAbbr =
      teamMap.get(tonightOpponentTeamId)?.abbreviation ??
      opponentTeam?.abbreviation ??
      null;

    console.log(
      `Vs tonight's opponent: ${gamesVsOpponent.length} games, ${avgPpgVsOpponent} PPG`,
    );
    console.log(`=== End Player Stats ===\n`);

    res.json({
      player: { id: playerId, name: playerName },
      opponentTeam: opponentTeam?.full_name ?? opponentTeam?.name ?? "Opponent",
      opponentTeamAbbr: opponentAbbr,
      seasonAvgPoints,
      last10Games,
      last10VsOpponent: gamesVsOpponent,
      avgPpgVsOpponent,
    });
  } catch (error) {
    console.error("Error fetching player stats:", error);
    res.status(500).json({ message: "Failed to fetch player stats" });
  }
});

export default router;
