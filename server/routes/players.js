import { Router } from "express";
import { bdlFetch, gameCache } from "../lib/bdlClient.js";
import { parseMinutes, calculateAvgMinutes, MIN_AVG_MINUTES } from "../lib/helpers.js";

const router = Router();

router.get("/:gameId/players", async (req, res) => {
  const { gameId } = req.params;

  try {
    let game = gameCache.get(gameId);
    if (!game) {
      const gameResponse = await bdlFetch(`/games/${gameId}`);
      game = gameResponse.data ?? gameResponse;
      gameCache.set(gameId, game);
    }

    const homeTeamId = game.home_team?.id;
    const awayTeamId = game.visitor_team?.id;

    const [homePlayersRes, awayPlayersRes] = await Promise.all([
      homeTeamId ? bdlFetch(`/players/active?team_ids[]=${homeTeamId}&per_page=25`) : { data: [] },
      awayTeamId ? bdlFetch(`/players/active?team_ids[]=${awayTeamId}&per_page=25`) : { data: [] },
    ]);

    const allPlayers = [];
    (homePlayersRes.data ?? []).forEach((p) => {
      allPlayers.push({
        id: p.id.toString(),
        name: `${p.first_name} ${p.last_name}`,
        team: game.home_team?.full_name ?? game.home_team?.name ?? "Home",
        teamId: homeTeamId,
        position: p.position ?? "N/A",
      });
    });
    (awayPlayersRes.data ?? []).forEach((p) => {
      allPlayers.push({
        id: p.id.toString(),
        name: `${p.first_name} ${p.last_name}`,
        team: game.visitor_team?.full_name ?? game.visitor_team?.name ?? "Away",
        teamId: awayTeamId,
        position: p.position ?? "N/A",
      });
    });

    console.log(`Found ${allPlayers.length} total active players for game ${gameId}`);

    const playerIds = allPlayers.map((p) => p.id);
    const chunkSize = 20;
    const statsMap = new Map();

    const chunkPromises = [];
    for (let i = 0; i < playerIds.length; i += chunkSize) {
      const chunk = playerIds.slice(i, i + chunkSize);
      const playerIdsParam = chunk.map((id) => `player_ids[]=${id}`).join("&");
      chunkPromises.push(
        bdlFetch(`/stats?${playerIdsParam}&seasons[]=2025&per_page=100`).catch((err) => {
          console.error(`Error fetching stats batch:`, err.message);
          return { data: [] };
        }),
      );
    }

    const chunkResults = await Promise.all(chunkPromises);
    for (const statsResponse of chunkResults) {
      const stats = statsResponse.data ?? [];
      stats.forEach((stat) => {
        const pid = stat.player?.id?.toString();
        if (pid) {
          if (!statsMap.has(pid)) statsMap.set(pid, []);
          statsMap.get(pid).push(stat);
        }
      });
    }

    const filteredPlayers = allPlayers
      .map((player) => {
        const stats = statsMap.get(player.id) || [];
        const avgMinutes = calculateAvgMinutes(stats);
        return {
          ...player,
          avgMinutes: Math.round(avgMinutes * 10) / 10,
          gamesPlayed: stats.filter((g) => parseMinutes(g.min) > 0).length,
        };
      })
      .filter((p) => p.avgMinutes >= MIN_AVG_MINUTES)
      .sort((a, b) => b.avgMinutes - a.avgMinutes);

    console.log(`Filtered to ${filteredPlayers.length} rotation players (${MIN_AVG_MINUTES}+ min avg)`);
    res.json(filteredPlayers);
  } catch (error) {
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Failed to fetch players" });
  }
});

export default router;
