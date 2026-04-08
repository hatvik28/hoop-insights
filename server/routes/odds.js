import { Router } from "express";
import { getCached, setCache } from "../lib/cache.js";

const router = Router();

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";
const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes — odds don't shift that fast

const oddsCache = new Map();

function getOddsCached(key) {
  const entry = oddsCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    oddsCache.delete(key);
    return null;
  }
  return entry.data;
}

function setOddsCache(key, data) {
  oddsCache.set(key, { data, expiresAt: Date.now() + ODDS_CACHE_TTL_MS });
}

async function fetchNbaEvents() {
  const cacheKey = "odds_nba_events";
  const cached = getOddsCached(cacheKey);
  if (cached) return cached;

  const url = `${ODDS_API_BASE}/sports/basketball_nba/events?apiKey=${ODDS_API_KEY}`;
  console.log("[ODDS] Fetching NBA events (free call)");

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odds API error ${res.status}: ${text.substring(0, 200)}`);
  }

  const events = await res.json();
  setOddsCache(cacheKey, events);
  return events;
}

function normalizeTeamName(name) {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

function findEventForGame(events, homeTeam, awayTeam) {
  const homeNorm = normalizeTeamName(homeTeam);
  const awayNorm = normalizeTeamName(awayTeam);

  return events.find((e) => {
    const eHome = normalizeTeamName(e.home_team);
    const eAway = normalizeTeamName(e.away_team);
    return (
      (eHome.includes(homeNorm) || homeNorm.includes(eHome)) &&
      (eAway.includes(awayNorm) || awayNorm.includes(eAway))
    );
  });
}

async function fetchEventOdds(eventId) {
  const cacheKey = `odds_event_${eventId}`;
  const cached = getOddsCached(cacheKey);
  if (cached) {
    console.log(`[ODDS CACHE HIT] event ${eventId}`);
    return cached;
  }

  const url = `${ODDS_API_BASE}/sports/basketball_nba/events/${eventId}/odds?apiKey=${ODDS_API_KEY}&regions=us&markets=player_points&oddsFormat=american`;
  console.log(`[ODDS FETCH] event ${eventId} (costs 1 credit)`);

  const res = await fetch(url);

  const remaining = res.headers.get("x-requests-remaining");
  if (remaining) console.log(`[ODDS] Credits remaining: ${remaining}`);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Odds API error ${res.status}: ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  setOddsCache(cacheKey, data);
  return data;
}

function extractPlayerOdds(eventOdds, playerName) {
  const bookmakers = eventOdds.bookmakers ?? [];
  const playerNameLower = playerName.toLowerCase();

  const results = [];

  for (const bookmaker of bookmakers) {
    const market = bookmaker.markets?.find((m) => m.key === "player_points");
    if (!market) continue;

    const playerOutcomes = market.outcomes.filter(
      (o) => o.description && o.description.toLowerCase() === playerNameLower,
    );

    if (playerOutcomes.length === 0) continue;

    const over = playerOutcomes.find((o) => o.name === "Over");
    const under = playerOutcomes.find((o) => o.name === "Under");

    if (over) {
      results.push({
        bookmaker: bookmaker.title,
        bookmakerKey: bookmaker.key,
        line: over.point,
        overPrice: over.price,
        underPrice: under?.price ?? null,
      });
    }
  }

  return results;
}

// GET /api/odds?playerName=LeBron+James&homeTeam=Los+Angeles+Lakers&awayTeam=Golden+State+Warriors
router.get("/", async (req, res) => {
  const { playerName, homeTeam, awayTeam } = req.query;

  if (!playerName || !homeTeam || !awayTeam) {
    return res.status(400).json({ message: "Missing playerName, homeTeam, or awayTeam" });
  }

  if (!ODDS_API_KEY) {
    return res.status(500).json({ message: "ODDS_API_KEY not configured" });
  }

  try {
    const events = await fetchNbaEvents();
    const event = findEventForGame(events, homeTeam, awayTeam);

    if (!event) {
      return res.json({ odds: [], message: "No matching event found" });
    }

    const eventOdds = await fetchEventOdds(event.id);
    const playerOdds = extractPlayerOdds(eventOdds, playerName);

    res.json({ odds: playerOdds });
  } catch (error) {
    console.error("Error fetching odds:", error);
    res.status(500).json({ message: "Failed to fetch odds" });
  }
});

export default router;
