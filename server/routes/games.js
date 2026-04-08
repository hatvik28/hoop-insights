import { Router } from "express";
import { bdlFetch, gameCache } from "../lib/bdlClient.js";
import { getTodayFormatted } from "../lib/helpers.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const today = getTodayFormatted();
    const response = await bdlFetch(`/games?dates[]=${today}`);
    const games = response.data ?? [];

    const mapped = games.map((g) => {
      gameCache.set(g.id.toString(), g);

      let startTime = g.datetime || g.date;
      if (startTime && !startTime.includes("T") && !startTime.includes(":")) {
        startTime = `${startTime}T12:00:00`;
      }

      return {
        id: g.id.toString(),
        homeTeam: g.home_team?.full_name ?? g.home_team?.name ?? "Home",
        awayTeam: g.visitor_team?.full_name ?? g.visitor_team?.name ?? "Away",
        homeTeamAbbr: g.home_team?.abbreviation ?? null,
        awayTeamAbbr: g.visitor_team?.abbreviation ?? null,
        homeTeamId: g.home_team?.id,
        awayTeamId: g.visitor_team?.id,
        startTime,
        status: g.status,
        time: g.time || null,
      };
    });

    console.log(`Found ${mapped.length} games for ${today}`);
    res.json(mapped);
  } catch (error) {
    console.error("Error fetching games:", error);
    res.status(500).json({ message: "Failed to fetch games" });
  }
});

export default router;
