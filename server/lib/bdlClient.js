import { getCached, setCache } from "./cache.js";

const BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/v1";
const BALLDONTLIE_API_KEY = process.env.BALLDONTLIE_API_KEY;

export async function bdlFetch(endpoint) {
  const url = `${BALLDONTLIE_BASE_URL}${endpoint}`;

  const cached = getCached(url);
  if (cached) {
    console.log(`[CACHE HIT] ${endpoint}`);
    return cached;
  }

  console.log(`[FETCH] ${endpoint}`);

  const res = await fetch(url, {
    headers: { Authorization: BALLDONTLIE_API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Balldontlie error ${res.status}: ${text.substring(0, 200)}`);
  }

  const json = await res.json();
  setCache(url, json);
  return json;
}

/** Team lookup map (ID -> team info). Populated on startup. */
export const teamMap = new Map();

/** Game data cache for cross-route lookups. */
export const gameCache = new Map();

export async function loadTeams() {
  try {
    const response = await bdlFetch("/teams");
    const teams = response.data ?? [];
    teams.forEach((team) => {
      teamMap.set(team.id, {
        id: team.id,
        abbreviation: team.abbreviation,
        name: team.name,
        full_name: team.full_name,
        city: team.city,
      });
    });
    console.log(`Loaded ${teamMap.size} teams into lookup map`);
  } catch (error) {
    console.error("Error loading teams:", error);
  }
}
