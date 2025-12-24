import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Activity, BarChart3, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";

type NbaGame = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status?: string;
  time?: string | null;
};

type NbaPlayer = {
  id: string;
  name: string;
  team: string;
  position: string;
};

type PlayerGameLog = {
  date: string;
  opponent: string;
  points: number;
  rebounds: number;
  assists: number;
};

type PlayerStatsResponse = {
  player: {
    id: string;
    name: string;
  };
  opponentTeam: string;
  seasonAvgPoints: number;
  last10Games: PlayerGameLog[];
  last10VsOpponent: PlayerGameLog[];
};

// Custom tooltip for the bar chart
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { opponent: string; points: number; date: string; aboveAvg: boolean } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-muted-foreground">{data.date}</p>
        <p className="text-xs font-medium text-foreground">vs {data.opponent}</p>
        <p className={`text-sm font-bold ${data.aboveAvg ? "text-green-500" : "text-red-500"}`}>
          {data.points} PTS
        </p>
      </div>
    );
  }
  return null;
};

// Player Stats Chart Component
const PlayerStatsChart = ({ playerStats }: { playerStats: PlayerStatsResponse }) => {
  // Use season average from API, or fallback to calculating from last 10 games
  const avgPoints = useMemo(() => {
    if (playerStats.seasonAvgPoints) return playerStats.seasonAvgPoints;
    if (!playerStats.last10Games.length) return 0;
    const total = playerStats.last10Games.reduce((sum, g) => sum + g.points, 0);
    return Math.round((total / playerStats.last10Games.length) * 10) / 10;
  }, [playerStats.seasonAvgPoints, playerStats.last10Games]);

  // Prepare chart data (reverse so oldest game is on left)
  const chartData = useMemo(() => {
    return [...playerStats.last10Games].reverse().map((g, index) => ({
      game: index + 1,
      points: g.points,
      opponent: g.opponent,
      date: g.date,
      aboveAvg: g.points >= avgPoints,
    }));
  }, [playerStats.last10Games, avgPoints]);

  // Get max points for Y axis
  const maxPoints = useMemo(() => {
    const max = Math.max(...playerStats.last10Games.map((g) => g.points), avgPoints);
    return Math.ceil(max / 5) * 5 + 5; // Round up to nearest 5 and add padding
  }, [playerStats.last10Games, avgPoints]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {playerStats.player.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          Last 10 Games (2025-26) • Season Avg:{" "}
          <span className="font-semibold text-foreground">{avgPoints} PPG</span>
        </p>
      </div>

      {/* Points Bar Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="game"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, maxPoints]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }} />
            <ReferenceLine
              y={avgPoints}
              stroke="hsl(var(--foreground))"
              strokeDasharray="4 4"
              strokeWidth={2}
              label={{
                value: `${avgPoints}`,
                position: "right",
                fill: "hsl(var(--foreground))",
                fontSize: 11,
                fontWeight: "bold",
              }}
            />
            <Bar dataKey="points" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.aboveAvg ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
          <span className="text-muted-foreground">Above Average</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#ef4444]" />
          <span className="text-muted-foreground">Below Average</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t-2 border-dashed border-foreground" />
          <span className="text-muted-foreground">Avg ({avgPoints})</span>
        </div>
      </div>

      {/* Game Log */}
      <div>
        <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
          Game Log
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {playerStats.last10Games.map((g, index) => (
            <div
              key={`${index}-${g.date}-${g.opponent}`}
              className={`rounded-md border px-2 py-1.5 text-[11px] ${
                g.points >= avgPoints
                  ? "border-green-500/30 bg-green-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">vs {g.opponent}</span>
                  <span className="text-muted-foreground ml-2">{g.date}</span>
                </div>
                <span className={`font-bold ${g.points >= avgPoints ? "text-green-500" : "text-red-500"}`}>
                  {g.points} PTS
                </span>
              </div>
              <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                <span>REB {g.rebounds}</span>
                <span>AST {g.assists}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const {
    data: games,
    isLoading: gamesLoading,
    isError: gamesError,
  } = useQuery<NbaGame[]>({
    queryKey: ["games"],
    queryFn: async () => {
      const res = await fetch("/api/games");
      if (!res.ok) throw new Error("Failed to load games");
      return res.json();
    },
  });

  const {
    data: players,
    isLoading: playersLoading,
    isError: playersError,
    refetch: refetchPlayers,
  } = useQuery<NbaPlayer[]>({
    queryKey: ["players", selectedGameId],
    enabled: !!selectedGameId,
    retry: 2,
    queryFn: async () => {
      const res = await fetch(`/api/games/${selectedGameId}/players`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load players");
      }
      return res.json();
    },
  });

  const selectedGame = games?.find((g) => g.id === selectedGameId) ?? null;

  const {
    data: playerStats,
    isLoading: statsLoading,
  } = useQuery<PlayerStatsResponse>({
    queryKey: ["playerStats", selectedPlayerId, selectedGame?.id],
    enabled: !!selectedPlayerId && !!selectedGame,
    queryFn: async () => {
      const res = await fetch(
        `/api/players/${selectedPlayerId}/stats?gameId=${selectedGame?.id}`,
      );
      if (!res.ok) throw new Error("Failed to load player stats");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Spinning Basketball Logo */}
      <div className="flex justify-center pt-8 pb-2">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 animate-pulse" />
          
          {/* Basketball SVG */}
          <svg
            viewBox="0 0 100 100"
            className="w-20 h-20 md:w-24 md:h-24 relative z-10 drop-shadow-2xl"
            style={{
              animation: "spin 8s linear infinite",
            }}
          >
            {/* Main ball */}
            <defs>
              <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#c2410c" />
              </radialGradient>
              <filter id="innerShadow">
                <feOffset dx="0" dy="2" />
                <feGaussianBlur stdDeviation="2" result="offset-blur" />
                <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
                <feFlood floodColor="#000" floodOpacity="0.3" result="color" />
                <feComposite operator="in" in="color" in2="inverse" result="shadow" />
                <feComposite operator="over" in="shadow" in2="SourceGraphic" />
              </filter>
            </defs>
            
            <circle cx="50" cy="50" r="48" fill="url(#ballGradient)" filter="url(#innerShadow)" />
            
            {/* Basketball lines */}
            <g stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round">
              {/* Horizontal line */}
              <path d="M 2 50 Q 50 50 98 50" />
              {/* Vertical line */}
              <path d="M 50 2 Q 50 50 50 98" />
              {/* Left curve */}
              <path d="M 50 2 Q 25 50 50 98" />
              {/* Right curve */}
              <path d="M 50 2 Q 75 50 50 98" />
            </g>
            
            {/* Highlight */}
            <ellipse cx="35" cy="30" rx="12" ry="8" fill="rgba(255,255,255,0.25)" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <main className="container mx-auto px-4 py-4 md:py-8 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              NBA Real-Time Game Explorer
            </h1>
            <p className="text-muted-foreground mt-1">
              Browse today&apos;s games, drill into players, and see their last
              10 games and matchup history.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4 text-primary" />
            <span>Powered by Balldontlie</span>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.1fr,1.3fr,1.2fr]">
          {/* Games column */}
          <Card className="p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">NBA Games</h2>
              </div>
            </div>

            {gamesLoading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading games...</span>
              </div>
            )}

            {gamesError && (
              <p className="text-sm text-destructive">
                Failed to load games. Make sure the backend server is running.
              </p>
            )}

            {!gamesLoading && !games?.length && (
              <p className="text-sm text-muted-foreground">
                No games available yet.
              </p>
            )}

            <div className="space-y-2">
              {games?.map((game) => {
                const isActive = game.id === selectedGameId;
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => {
                      setSelectedGameId(game.id);
                      setSelectedPlayerId(null);
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-primary/5 ${
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card/60"
                    }`}
                  >
                    <div className="font-medium text-foreground">
                      {game.awayTeam} @ {game.homeTeam}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(game.startTime).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      })}
                      {game.status && !game.status.includes("T") && !game.status.includes("-") && (
                        <span className="ml-2 text-primary font-medium">{game.status}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Players column */}
          <Card className="p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Players</h2>
              </div>
            </div>

            {!selectedGame && (
              <p className="text-sm text-muted-foreground">
                Select a game on the left to see players.
              </p>
            )}

            {selectedGame && playersLoading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading players...</span>
              </div>
            )}

            {selectedGame && playersError && (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <p className="text-sm text-destructive">
                  Failed to load players. You may have hit the API rate limit.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchPlayers()}
                >
                  Try Again
                </Button>
              </div>
            )}

            {selectedGame && players && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Matchup
                  </h3>
                  <p className="text-sm">
                    {selectedGame.awayTeam} @ {selectedGame.homeTeam}
                  </p>
                </div>

                {players.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Player data not yet available for this game. Lineups are typically released closer to game time.
                  </p>
                ) : (
                <div className="grid grid-cols-2 gap-3">
                  {players.map((player) => {
                    const isActive = player.id === selectedPlayerId;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => setSelectedPlayerId(player.id)}
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition hover:border-primary hover:bg-primary/5 ${
                          isActive
                            ? "border-primary bg-primary/10"
                            : "border-border bg-card/60"
                        }`}
                      >
                        <div className="font-medium text-foreground">
                          {player.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {player.team} • {player.position}
                        </div>
                      </button>
                    );
                  })}
                </div>
                )}
              </div>
            )}
          </Card>

          {/* Player stats column */}
          <Card className="p-4 md:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Player Props View</h2>
              </div>
            </div>

            {!selectedPlayerId && (
              <p className="text-sm text-muted-foreground">
                Select a player from the middle column to see their last 10
                games and matchup history.
              </p>
            )}

            {selectedPlayerId && statsLoading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading stats…</span>
              </div>
            )}

            {playerStats && (
              <PlayerStatsChart playerStats={playerStats} />
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
