export type NbaGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamAbbr?: string | null;
  awayTeamAbbr?: string | null;
  startTime: string;
  status?: string;
  time?: string | null;
};

export type NbaPlayer = {
  id: string;
  name: string;
  team: string;
  position: string;
  avgMinutes?: number;
  gamesPlayed?: number;
};

export type PlayerGameLog = {
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
};

export type PlayerStatsResponse = {
  player: {
    id: string;
    name: string;
  };
  opponentTeam: string;
  opponentTeamAbbr?: string | null;
  seasonAvgPoints: number;
  last10Games: PlayerGameLog[];
  last10VsOpponent: PlayerGameLog[];
  avgPpgVsOpponent?: number;
};

export type PlayerOddsLine = {
  bookmaker: string;
  bookmakerKey: string;
  line: number;
  overPrice: number;
  underPrice: number | null;
};

export type PlayerOddsResponse = {
  odds: PlayerOddsLine[];
  message?: string;
};
