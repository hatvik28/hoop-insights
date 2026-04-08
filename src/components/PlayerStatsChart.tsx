import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlayerStatsResponse } from "@/types/nba";

type GameTooltipPayload = {
  date: string;
  opponent: string;
  points: number;
  aboveAverage: boolean;
};

type OpponentTooltipPayload = {
  date: string;
  points: number;
  aboveAverage: boolean;
};

type PlayerStatsChartProps = {
  playerStats: PlayerStatsResponse;
};

const axisStyle = {
  tick: { fontSize: 11, fill: "hsl(var(--muted-foreground))" },
  axisLine: { stroke: "hsl(var(--border))" },
  tickLine: false as const,
};

function GameTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: GameTooltipPayload }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const game = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl shadow-black/20">
      <p className="text-xs text-muted-foreground">{game.date}</p>
      <p className="text-sm font-medium text-foreground">vs {game.opponent}</p>
      <p className={game.aboveAverage ? "text-base font-bold text-green-500" : "text-base font-bold text-red-500"}>
        {game.points} PTS
      </p>
    </div>
  );
}

function OpponentTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: OpponentTooltipPayload }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const game = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl shadow-black/20">
      <p className="text-xs text-muted-foreground">{game.date}</p>
      <p className={game.aboveAverage ? "text-base font-bold text-green-500" : "text-base font-bold text-red-500"}>
        {game.points} PTS
      </p>
    </div>
  );
}

const PlayerStatsChart = ({ playerStats }: PlayerStatsChartProps) => {
  const [selectedOpponentSample, setSelectedOpponentSample] = useState<number | "all">("all");

  const seasonAveragePoints = useMemo(() => {
    if (playerStats.seasonAvgPoints) {
      return playerStats.seasonAvgPoints;
    }

    if (playerStats.last10Games.length === 0) {
      return 0;
    }

    const totalPoints = playerStats.last10Games.reduce((sum, game) => sum + game.points, 0);
    return Math.round((totalPoints / playerStats.last10Games.length) * 10) / 10;
  }, [playerStats.last10Games, playerStats.seasonAvgPoints]);

  const recentGamesChartData = useMemo(
    () =>
      [...playerStats.last10Games].reverse().map((game, index) => ({
        game: index + 1,
        points: game.points,
        opponent: game.opponent,
        date: game.date,
        aboveAverage: game.points >= seasonAveragePoints,
      })),
    [playerStats.last10Games, seasonAveragePoints],
  );

  const recentGamesChartMax = useMemo(() => {
    const highestValue = Math.max(...playerStats.last10Games.map((game) => game.points), seasonAveragePoints);
    return Math.ceil(highestValue / 5) * 5 + 5;
  }, [playerStats.last10Games, seasonAveragePoints]);

  const totalOpponentGames = playerStats.last10VsOpponent.length;

  const availableOpponentSamples = useMemo(() => {
    const sampleOptions: Array<number | "all"> = [];

    for (const sampleSize of [2, 3, 4, 5, 6]) {
      if (sampleSize <= totalOpponentGames) {
        sampleOptions.push(sampleSize);
      }
    }

    sampleOptions.push("all");
    return sampleOptions;
  }, [totalOpponentGames]);

  const displayedOpponentGames = useMemo(() => {
    const limit =
      selectedOpponentSample === "all"
        ? totalOpponentGames
        : Math.min(selectedOpponentSample, totalOpponentGames);

    return playerStats.last10VsOpponent.slice(0, limit);
  }, [playerStats.last10VsOpponent, selectedOpponentSample, totalOpponentGames]);

  const opponentAveragePoints = useMemo(() => {
    if (displayedOpponentGames.length === 0) {
      return 0;
    }

    const totalPoints = displayedOpponentGames.reduce((sum, game) => sum + game.points, 0);
    return Math.round((totalPoints / displayedOpponentGames.length) * 10) / 10;
  }, [displayedOpponentGames]);

  const opponentChartData = useMemo(
    () =>
      [...displayedOpponentGames].reverse().map((game, index) => ({
        game: index + 1,
        points: game.points,
        date: game.date,
        aboveAverage: game.points >= seasonAveragePoints,
      })),
    [displayedOpponentGames, seasonAveragePoints],
  );

  const opponentChartMax = useMemo(() => {
    if (displayedOpponentGames.length === 0) {
      return 10;
    }

    const highestValue = Math.max(...displayedOpponentGames.map((game) => game.points), seasonAveragePoints);
    return Math.ceil(highestValue / 5) * 5 + 5;
  }, [displayedOpponentGames, seasonAveragePoints]);

  useEffect(() => {
    if (selectedOpponentSample !== "all" && selectedOpponentSample > totalOpponentGames) {
      setSelectedOpponentSample("all");
    }
  }, [selectedOpponentSample, totalOpponentGames]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/80">
          Performance
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
          {playerStats.player.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Last 10 games (2025-26) · Season avg:{" "}
          <span className="font-semibold text-primary">{seasonAveragePoints} PPG</span>
          {playerStats.last10VsOpponent.length > 0 && playerStats.opponentTeamAbbr && (
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

      {playerStats.last10VsOpponent.length > 0 && (
        <div className="space-y-4 rounded-[24px] border border-primary/25 bg-primary/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vs {playerStats.opponentTeamAbbr ?? playerStats.opponentTeam} this season
            </h4>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[11px] text-muted-foreground">Show:</span>
              {availableOpponentSamples.map((sampleSize) => (
                <button
                  key={sampleSize}
                  type="button"
                  onClick={() => setSelectedOpponentSample(sampleSize)}
                  className={
                    selectedOpponentSample === sampleSize
                      ? "rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition"
                      : "rounded-lg bg-muted/60 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                  }
                >
                  {sampleSize === "all" ? "All" : `Last ${sampleSize}`}
                </button>
              ))}
            </div>
          </div>

          {displayedOpponentGames.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground">
                {displayedOpponentGames.length} game
                {displayedOpponentGames.length !== 1 ? "s" : ""} vs this team · Avg in these:{" "}
                <span className="font-semibold text-foreground">{opponentAveragePoints} PPG</span>{" "}
                (dotted line = season avg {seasonAveragePoints})
              </p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={opponentChartData} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
                    <XAxis dataKey="game" {...axisStyle} />
                    <YAxis domain={[0, opponentChartMax]} width={32} {...axisStyle} />
                    <Tooltip content={<OpponentTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }} />
                    <ReferenceLine
                      y={seasonAveragePoints}
                      stroke="hsl(var(--foreground))"
                      strokeDasharray="5 3"
                      strokeWidth={1.5}
                      label={{
                        value: `Season avg ${seasonAveragePoints}`,
                        position: "right",
                        fill: "hsl(var(--foreground))",
                        fontSize: 10,
                        fontWeight: "bold",
                      }}
                    />
                    <Bar dataKey="points" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {opponentChartData.map((game, index) => (
                        <Cell
                          key={`opponent-cell-${index}`}
                          fill={game.aboveAverage ? "#22c55e" : "#ef4444"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="max-h-32 space-y-1.5 overflow-y-auto pr-1">
                {displayedOpponentGames.map((game, index) => (
                  <div
                    key={`opponent-game-${index}-${game.date}-${game.opponent}`}
                    className="rounded-lg border border-primary/20 bg-background/60 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{game.date}</span>
                      <span className="font-bold text-primary">{game.points} PTS</span>
                    </div>
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      <span>REB {game.rebounds}</span>
                      <span>AST {game.assists}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="h-[340px] w-full rounded-[24px] border border-border/60 bg-muted/20 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={recentGamesChartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="game"
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, recentGamesChartMax]}
              width={36}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              tickLine={false}
            />
            <Tooltip content={<GameTooltip />} cursor={{ fill: "hsl(var(--muted))", opacity: 0.25 }} />
            <ReferenceLine
              y={seasonAveragePoints}
              stroke="hsl(var(--foreground))"
              strokeDasharray="6 4"
              strokeWidth={2}
              label={{
                value: `Avg ${seasonAveragePoints}`,
                position: "right",
                fill: "hsl(var(--foreground))",
                fontSize: 12,
                fontWeight: "bold",
              }}
            />
            <Bar dataKey="points" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {recentGamesChartData.map((game, index) => (
                <Cell key={`recent-cell-${index}`} fill={game.aboveAverage ? "#22c55e" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-[#22c55e]" />
          <span className="text-muted-foreground">Above avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded-md bg-[#ef4444]" />
          <span className="text-muted-foreground">Below avg</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 border-t-2 border-dashed border-foreground" />
          <span className="text-muted-foreground">Avg ({seasonAveragePoints})</span>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Game log
        </h4>
        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {playerStats.last10Games.map((game, index) => (
            <div
              key={`${index}-${game.date}-${game.opponent}`}
              className={
                game.points >= seasonAveragePoints
                  ? "rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2.5 text-sm"
                  : "rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm"
              }
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">vs {game.opponent}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{game.date}</span>
                </div>
                <span className={game.points >= seasonAveragePoints ? "font-bold text-green-500" : "font-bold text-red-500"}>
                  {game.points} PTS
                </span>
              </div>
              <div className="mt-1.5 flex gap-3 text-xs text-muted-foreground">
                <span>REB {game.rebounds}</span>
                <span>AST {game.assists}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsChart;
