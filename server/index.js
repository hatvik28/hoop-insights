import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Balldontlie API configuration (ALL-STAR tier) ---
const BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/v1";
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;

// --- Simple in-memory cache to reduce API calls ---
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter to get fresher stats)

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Helper to fetch from Balldontlie API
async function bdlFetch(endpoint) {
  const url = `${BALLDONTLIE_BASE_URL}${endpoint}`;
  const cacheKey = url;

  const cached = getCached(cacheKey);
  if (cached) {
    // eslint-disable-next-line no-console
    console.log(`[CACHE HIT] ${endpoint}`);
    return cached;
  }

  // eslint-disable-next-line no-console
  console.log(`[FETCH] ${endpoint}`);

  const res = await fetch(url, {
    headers: {
      "Authorization": BALLDONTLIE_API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Balldontlie error ${res.status}: ${text.substring(0, 200)}`);
  }

  const json = await res.json();
  setCache(cacheKey, json);
  return json;
}

// Get today's date in YYYY-MM-DD format
function getTodayFormatted() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Store game and player data for lookups
const gameCache = new Map();

// --- Routes ---

// List of today's games
app.get("/api/games", async (req, res) => {
  try {
    const today = getTodayFormatted();
    const response = await bdlFetch(`/games?dates[]=${today}`);
    const games = response.data ?? [];

    // Log the first game to see available fields
    if (games.length > 0) {
      // eslint-disable-next-line no-console
      console.log("Sample game data:", JSON.stringify(games[0], null, 2));
    }

    const mapped = games.map((g) => {
      // Cache game data
      gameCache.set(g.id.toString(), g);

      // The API returns date as "YYYY-MM-DD" - append T12:00:00 to avoid timezone shifts
      // Also check for datetime or time fields if available
      let startTime = g.datetime || g.date;
      
      // If it's just a date (no time component), add noon to prevent day shift
      if (startTime && !startTime.includes('T') && !startTime.includes(':')) {
        startTime = `${startTime}T12:00:00`;
      }

      return {
        id: g.id.toString(),
        homeTeam: g.home_team?.full_name ?? g.home_team?.name ?? "Home",
        awayTeam: g.visitor_team?.full_name ?? g.visitor_team?.name ?? "Away",
        homeTeamId: g.home_team?.id,
        awayTeamId: g.visitor_team?.id,
        startTime: startTime,
        status: g.status,
        // Include time if available from API
        time: g.time || null,
      };
    });

    // eslint-disable-next-line no-console
    console.log(`Found ${mapped.length} games for ${today}`);
    res.json(mapped);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching games:", error);
    res.status(500).json({ message: "Failed to fetch games" });
  }
});

// Players for a given game - fetch active players for both teams
app.get("/api/games/:gameId/players", async (req, res) => {
  const { gameId } = req.params;

  try {
    // Get game info from cache or fetch games
    let game = gameCache.get(gameId);
    
    if (!game) {
      // Fetch the specific game
      const gameResponse = await bdlFetch(`/games/${gameId}`);
      game = gameResponse.data ?? gameResponse;
      gameCache.set(gameId, game);
    }

    const homeTeamId = game.home_team?.id;
    const awayTeamId = game.visitor_team?.id;

    // Fetch active players for both teams
    const allPlayers = [];

    if (homeTeamId) {
      const homePlayers = await bdlFetch(`/players/active?team_ids[]=${homeTeamId}&per_page=25`);
      (homePlayers.data ?? []).forEach((p) => {
        allPlayers.push({
          id: p.id.toString(),
          name: `${p.first_name} ${p.last_name}`,
          team: game.home_team?.full_name ?? game.home_team?.name ?? "Home",
          teamId: homeTeamId,
          position: p.position ?? "N/A",
        });
      });
    }

    if (awayTeamId) {
      const awayPlayers = await bdlFetch(`/players/active?team_ids[]=${awayTeamId}&per_page=25`);
      (awayPlayers.data ?? []).forEach((p) => {
        allPlayers.push({
          id: p.id.toString(),
          name: `${p.first_name} ${p.last_name}`,
          team: game.visitor_team?.full_name ?? game.visitor_team?.name ?? "Away",
          teamId: awayTeamId,
          position: p.position ?? "N/A",
        });
      });
    }

    // eslint-disable-next-line no-console
    console.log(`Returning ${allPlayers.length} players for game ${gameId}`);
    res.json(allPlayers);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching players:", error);
    res.status(500).json({ message: "Failed to fetch players" });
  }
});

// Player stats: last 10 games using Game Player Stats endpoint
app.get("/api/players/:playerId/stats", async (req, res) => {
  const { playerId } = req.params;
  const { gameId } = req.query;

  if (!gameId) {
    return res.status(400).json({ message: "Missing gameId query param" });
  }

  try {
    // Get player info
    const playerResponse = await bdlFetch(`/players/${playerId}`);
    const player = playerResponse.data ?? playerResponse;
    const playerName = `${player.first_name} ${player.last_name}`;

    // eslint-disable-next-line no-console
    console.log(`\n=== Fetching stats for ${playerName} (ID: ${playerId}) ===`);

    // Get game info for opponent
    let game = gameCache.get(gameId);
    if (!game) {
      const gameResponse = await bdlFetch(`/games/${gameId}`);
      game = gameResponse.data ?? gameResponse;
      gameCache.set(gameId, game);
    }

    const playerTeamId = player.team?.id;
    const isHomeTeam = playerTeamId === game.home_team?.id;
    const opponentTeam = isHomeTeam ? game.visitor_team : game.home_team;

    // Fetch player's game stats for 2025-26 season (season=2025)
    // Request more games (100) to ensure we get recent ones
    const statsResponse = await bdlFetch(
      `/stats?player_ids[]=${playerId}&seasons[]=2025&per_page=100`
    );
    
    let gameStats = statsResponse.data ?? [];
    
    // eslint-disable-next-line no-console
    console.log(`Found ${gameStats.length} game stats for 2025 season`);

    // If no stats for 2025, try 2024
    if (gameStats.length === 0) {
      // eslint-disable-next-line no-console
      console.log("No 2025 stats, trying 2024...");
      const stats2024 = await bdlFetch(
        `/stats?player_ids[]=${playerId}&seasons[]=2024&per_page=100`
      );
      gameStats = stats2024.data ?? [];
      // eslint-disable-next-line no-console
      console.log(`Found ${gameStats.length} game stats for 2024`);
    }

    // Sort by game date (most recent first)
    gameStats.sort((a, b) => {
      const dateA = new Date(a.game?.date ?? 0);
      const dateB = new Date(b.game?.date ?? 0);
      return dateB - dateA;
    });

    // Log the dates we're getting to debug
    if (gameStats.length > 0) {
      const dates = gameStats.slice(0, 5).map(g => g.game?.date);
      // eslint-disable-next-line no-console
      console.log(`Most recent game dates after sorting:`, dates);
    }

    // Calculate season average
    let seasonAvgPoints = 0;
    if (gameStats.length > 0) {
      // Filter out games where player didn't play (0 minutes)
      const gamesPlayed = gameStats.filter(g => g.min && g.min !== "0:00" && g.min !== "00");
      const totalPoints = gamesPlayed.reduce((sum, g) => sum + (g.pts ?? 0), 0);
      seasonAvgPoints = gamesPlayed.length > 0 
        ? Math.round((totalPoints / gamesPlayed.length) * 10) / 10 
        : 0;
      
      // eslint-disable-next-line no-console
      console.log(`Games played: ${gamesPlayed.length}, Total points: ${totalPoints}, Avg: ${seasonAvgPoints}`);
    }

    // Log the first stat to see the data structure
    if (gameStats.length > 0) {
      // eslint-disable-next-line no-console
      console.log("Sample stat game data:", JSON.stringify(gameStats[0].game, null, 2));
    }

    // Map to our format - take last 10 games
    const last10Games = gameStats.slice(0, 10).map((g) => {
      // Get opponent from game data
      const gameData = g.game ?? {};
      const statTeamId = g.team?.id;
      
      // Determine if player's team was home or away, then get opponent
      const isHome = statTeamId === gameData.home_team?.id;
      const opponentTeam = isHome ? gameData.visitor_team : gameData.home_team;
      
      // Try abbreviation first, then fall back to name-based abbreviation
      let opponent = opponentTeam?.abbreviation;
      if (!opponent && opponentTeam?.name) {
        // Create abbreviation from team name (e.g., "Raptors" -> "TOR")
        opponent = opponentTeam.name.substring(0, 3).toUpperCase();
      }
      if (!opponent && opponentTeam?.full_name) {
        // Try to extract from full name (e.g., "Toronto Raptors")
        const parts = opponentTeam.full_name.split(" ");
        opponent = parts[parts.length - 1].substring(0, 3).toUpperCase();
      }
      opponent = opponent || "OPP";

      return {
        date: gameData.date 
          ? new Date(gameData.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
          : "",
        opponent: opponent,
        points: g.pts ?? 0,
        rebounds: g.reb ?? 0,
        assists: g.ast ?? 0,
        minutes: g.min ?? "0",
      };
    });

    if (last10Games.length > 0) {
      // eslint-disable-next-line no-console
      console.log(`Sample game:`, last10Games[0]);
    }

    // eslint-disable-next-line no-console
    console.log(`=== End Player Stats ===\n`);

    res.json({
      player: {
        id: playerId,
        name: playerName,
      },
      opponentTeam: opponentTeam?.full_name ?? opponentTeam?.name ?? "Opponent",
      seasonAvgPoints,
      last10Games,
      last10VsOpponent: [],
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching player stats:", error);
    res.status(500).json({ message: "Failed to fetch player stats" });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API server listening on http://localhost:${PORT}`);
  if (!BALLDONTLIE_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn("WARNING: BALLDONTLIE_API_KEY not set! Set it with: $env:BALLDONTLIE_API_KEY = 'your-key'");
  }
});
