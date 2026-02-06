import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  homeTeamAbbr?: string | null;
  awayTeamAbbr?: string | null;
  startTime: string;
  status?: string;
  time?: string | null;
};

type NbaPlayer = {
  id: string;
  name: string;
  team: string;
  position: string;
  avgMinutes?: number;
  gamesPlayed?: number;
};

/** ESPN CDN team logos (500px). Use abbreviation e.g. LAL, BOS. */
const teamLogoUrl = (abbr: string | null | undefined) =>
  abbr ? `https://a.espncdn.com/i/teamlogos/nba/500/${abbr}.png` : null;

/** Player avatar: initials-based (reliable, no external ID needed). */
const playerAvatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=96&background=1e3a5f&color=fff&bold=true&format=svg`;

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
  opponentTeamAbbr?: string | null;
  seasonAvgPoints: number;
  last10Games: PlayerGameLog[];
  last10VsOpponent: PlayerGameLog[];
  avgPpgVsOpponent?: number;
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { opponent: string; points: number; date: string; aboveAvg: boolean } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl shadow-black/20">
        <p className="text-xs text-muted-foreground">{data.date}</p>
        <p className="text-sm font-medium text-foreground">vs {data.opponent}</p>
        <p className={`text-base font-bold ${data.aboveAvg ? "text-green-500" : "text-red-500"}`}>
          {data.points} PTS
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip for vs-opponent chart (date + points)
const VsOpponentTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; points: number; aboveAvg: boolean } }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl shadow-black/20">
        <p className="text-xs text-muted-foreground">{data.date}</p>
        <p className={`text-base font-bold ${data.aboveAvg ? "text-green-500" : "text-red-500"}`}>
          {data.points} PTS
        </p>
      </div>
    );
  }
  return null;
};

// Player Stats Chart Component
const PlayerStatsChart = ({ playerStats }: { playerStats: PlayerStatsResponse }) => {
  const [vsOpponentLastX, setVsOpponentLastX] = useState<number | "all">("all");

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

  // Vs opponent: which games to show (most recent first from API, so "Last 3" = first 3)
  const vsOpponentTotal = playerStats.last10VsOpponent.length;
  const vsOpponentDisplayGames = useMemo(() => {
    const n = vsOpponentLastX === "all" ? vsOpponentTotal : Math.min(vsOpponentLastX, vsOpponentTotal);
    return playerStats.last10VsOpponent.slice(0, n);
  }, [playerStats.last10VsOpponent, vsOpponentLastX, vsOpponentTotal]);

  const vsOpponentAvgPpg = useMemo(() => {
    if (vsOpponentDisplayGames.length === 0) return 0;
    const total = vsOpponentDisplayGames.reduce((sum, g) => sum + g.points, 0);
    return Math.round((total / vsOpponentDisplayGames.length) * 10) / 10;
  }, [vsOpponentDisplayGames]);

  // Compare vs-opponent games to season avg (not vs-opponent avg)
  const vsOpponentChartData = useMemo(() => {
    return [...vsOpponentDisplayGames].reverse().map((g, index) => ({
      game: index + 1,
      points: g.points,
      date: g.date,
      aboveAvg: g.points >= avgPoints,
    }));
  }, [vsOpponentDisplayGames, avgPoints]);

  const vsOpponentMaxPoints = useMemo(() => {
    if (vsOpponentDisplayGames.length === 0) return 10;
    const max = Math.max(...vsOpponentDisplayGames.map((g) => g.points), avgPoints);
    return Math.ceil(max / 5) * 5 + 5;
  }, [vsOpponentDisplayGames, avgPoints]);

  // Options for "Last X": 2,3,4,5,6 that are <= total, plus "All"
  const vsOpponentOptions = useMemo(() => {
    const nums: (number | "all")[] = [];
    for (const n of [2, 3, 4, 5, 6]) {
      if (n <= vsOpponentTotal) nums.push(n);
    }
    nums.push("all");
    return nums;
  }, [vsOpponentTotal]);

  // When player or games change, reset to "all" if current selection is invalid
  useEffect(() => {
    if (vsOpponentLastX !== "all" && vsOpponentLastX > vsOpponentTotal) {
      setVsOpponentLastX("all");
    }
  }, [vsOpponentTotal, vsOpponentLastX]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-foreground tracking-tight">
          {playerStats.player.name}
        </h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Last 10 games (2025-26) · Season avg:{" "}
          <span className="font-semibold text-primary">{avgPoints} PPG</span>
          {playerStats.last10VsOpponent.length > 0 && playerStats.opponentTeamAbbr != null && (
            <>
              {" "}
              · Vs {playerStats.opponentTeamAbbr}:{" "}
              <span className="font-semibold text-foreground">
                {playerStats.avgPpgVsOpponent ?? 0} PPG in {playerStats.last10VsOpponent.length} game
                {playerStats.last10VsOpponent.length !== 1 ? "s" : ""} this season
              </span>
            </>
          )}
        </p>
      </div>

      {/* Vs tonight's opponent: bar chart + "Last X" selector */}
      {playerStats.last10VsOpponent.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vs {playerStats.opponentTeamAbbr ?? playerStats.opponentTeam} this season
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground mr-1">Show:</span>
              {vsOpponentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setVsOpponentLastX(opt)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    vsOpponentLastX === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {opt === "all" ? "All" : `Last ${opt}`}
                </button>
              ))}
            </div>
          </div>
          {vsOpponentDisplayGames.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                {vsOpponentDisplayGames.length} game{vsOpponentDisplayGames.length !== 1 ? "s" : ""} vs this team · Avg in these:{" "}
                <span className="font-semibold text-foreground">{vsOpponentAvgPpg} PPG</span>
                {" "}(dotted line = season avg {avgPoints})
              </p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vsOpponentChartData}
                    margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
                  >
                    <XAxis
                      dataKey="game"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, vsOpponentMaxPoints]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                      width={32}
                    />
                    <Tooltip
                      content={<VsOpponentTooltip />}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }}
                    />
                    <ReferenceLine
                      y={avgPoints}
                      stroke="hsl(var(--foreground))"
                      strokeDasharray="5 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Season avg ${avgPoints}`,
                        position: "right",
                        fill: "hsl(var(--foreground))",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                    <Bar dataKey="points" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {vsOpponentChartData.map((entry, index) => (
                        <Cell
                          key={`vs-cell-${index}`}
                          fill={entry.aboveAvg ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {vsOpponentDisplayGames.map((g, index) => (
                  <div
                    key={`vs-${index}-${g.date}-${g.opponent}`}
                    className="rounded-lg border border-primary/20 bg-background/60 px-3 py-2 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground">{g.date}</span>
                      <span className="font-bold text-primary">{g.points} PTS</span>
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      <span>REB {g.rebounds}</span>
                      <span>AST {g.assists}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Points Bar Chart - larger */}
      <div className="h-[320px] w-full rounded-xl bg-muted/30 p-4 border border-border/50">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, maxPoints]}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }} />
            <ReferenceLine
              y={avgPoints}
              stroke="hsl(var(--foreground))"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Avg ${avgPoints}`,
                position: "right",
                fill: "hsl(var(--foreground))",
                fontSize: 12,
                fontWeight: "bold",
              }}
            />
            <Bar dataKey="points" radius={[6, 6, 0, 0]} maxBarSize={48}>
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
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-[#22c55e]" />
          <span className="text-muted-foreground">Above avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-md bg-[#ef4444]" />
          <span className="text-muted-foreground">Below avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-foreground" />
          <span className="text-muted-foreground">Avg ({avgPoints})</span>
        </div>
      </div>

      {/* Game Log - larger */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Game log
        </h4>
        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
          {playerStats.last10Games.map((g, index) => (
            <div
              key={`${index}-${g.date}-${g.opponent}`}
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                g.points >= avgPoints
                  ? "border-green-500/40 bg-green-500/10"
                  : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">vs {g.opponent}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{g.date}</span>
                </div>
                <span className={`font-bold ${g.points >= avgPoints ? "text-green-500" : "text-red-500"}`}>
                  {g.points} PTS
                </span>
              </div>
              <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
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
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Top bar - official-style */}
      <header className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <svg
                viewBox="0 0 100 100"
                className="w-10 h-10 text-primary"
                style={{ animation: "spin 12s linear infinite" }}
              >
                <defs>
                  <radialGradient id="ballGradient" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ea580c" />
                  </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="48" fill="url(#ballGradient)" />
                <g stroke="#1a1a1a" strokeWidth="2" fill="none">
                  <path d="M 2 50 Q 50 50 98 50" />
                  <path d="M 50 2 Q 50 50 50 98" />
                  <path d="M 50 2 Q 25 50 50 98" />
                  <path d="M 50 2 Q 75 50 50 98" />
                </g>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Hoop Insights
              </h1>
              <p className="text-[11px] text-muted-foreground">
                Today&apos;s games · Player stats
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Powered by Balldontlie</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 lg:py-6 space-y-5 max-w-[1600px]">
        <section className="grid gap-4 lg:gap-6 grid-cols-1 lg:grid-cols-[minmax(0,260px)_minmax(0,340px)_1fr]">
          {/* Games sidebar - compact */}
          <Card className="p-3 lg:p-4 space-y-3 overflow-hidden">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Today&apos;s Games</h2>
            </div>

            {gamesLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Loading…</span>
              </div>
            )}

            {gamesError && (
              <p className="text-xs text-destructive">
                Failed to load games. Check backend.
              </p>
            )}

            {!gamesLoading && !games?.length && (
              <p className="text-xs text-muted-foreground">No games today.</p>
            )}

            <div className="space-y-1.5">
              {games?.map((game) => {
                const isActive = game.id === selectedGameId;
                const awayLogo = teamLogoUrl(game.awayTeamAbbr);
                const homeLogo = teamLogoUrl(game.homeTeamAbbr);
                return (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => {
                      setSelectedGameId(game.id);
                      setSelectedPlayerId(null);
                    }}
                    className={`w-full rounded-xl border px-2.5 py-2 text-left transition-all hover:border-primary/60 hover:bg-primary/5 flex items-center gap-2 ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 shrink-0 w-14">
                      {awayLogo ? (
                        <img src={awayLogo} alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted" />
                      )}
                      <span className="text-muted-foreground text-[10px]">@</span>
                      {homeLogo ? (
                        <img src={homeLogo} alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-muted" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-medium text-foreground truncate">
                        {game.awayTeamAbbr || "Away"} @ {game.homeTeamAbbr || "Home"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {new Date(game.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {game.status && !game.status.includes("T") && !game.status.includes("-") && (
                          <span className="ml-1 text-primary font-medium">{game.status}</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Players column - with avatars */}
          <Card className="p-4 lg:p-5 space-y-4 overflow-hidden">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Rotation</h2>
            </div>

            {!selectedGame && (
              <p className="text-xs text-muted-foreground py-6 text-center">
                Select a game to see players.
              </p>
            )}

            {selectedGame && playersLoading && (
              <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading players…</span>
              </div>
            )}

            {selectedGame && playersError && (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <p className="text-xs text-destructive">Failed to load players.</p>
                <Button variant="outline" size="sm" onClick={() => refetchPlayers()}>
                  Try again
                </Button>
              </div>
            )}

            {selectedGame && players && (
              <div className="space-y-4">
                {/* Matchup with logos */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2.5 border border-border/50">
                  {teamLogoUrl(selectedGame.awayTeamAbbr) && (
                    <img
                      src={teamLogoUrl(selectedGame.awayTeamAbbr)!}
                      alt=""
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedGame.awayTeam}
                  </span>
                  <span className="text-muted-foreground">@</span>
                  {teamLogoUrl(selectedGame.homeTeamAbbr) && (
                    <img
                      src={teamLogoUrl(selectedGame.homeTeamAbbr)!}
                      alt=""
                      className="h-8 w-8 object-contain"
                    />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {selectedGame.homeTeam}
                  </span>
                </div>

                {players.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No rotation data yet for this game.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {players.map((player) => {
                      const isActive = player.id === selectedPlayerId;
                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all hover:border-primary/60 hover:bg-primary/5 flex items-center gap-3 ${
                            isActive
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card/50"
                          }`}
                        >
                          <Avatar className="h-11 w-11 shrink-0 rounded-full ring-2 ring-border">
                            <AvatarImage
                              src={playerAvatarUrl(player.name)}
                              alt={player.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm font-semibold">
                              {player.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm text-foreground truncate">
                              {player.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {player.team} · {player.position}
                              {player.avgMinutes != null && (
                                <span className="ml-1 text-primary">· {player.avgMinutes} mpg</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Player stats - main content area, larger */}
          <Card className="p-5 lg:p-6 space-y-4 min-h-[480px] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Player stats</h2>
              </div>
            </div>

            {!selectedPlayerId && (
              <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Select a player to view their last 10 games and points trend.
                </p>
              </div>
            )}

            {selectedPlayerId && statsLoading && (
              <div className="flex-1 flex items-center justify-center py-16 text-muted-foreground gap-3">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Loading stats…</span>
              </div>
            )}

            {playerStats && (
              <div className="flex-1 min-w-0">
                <PlayerStatsChart playerStats={playerStats} />
              </div>
            )}
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Index;
