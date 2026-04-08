import { Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { usePlayerOdds } from "@/hooks/useNbaData";

type PlayerOddsPanelProps = {
  playerName?: string;
  homeTeam?: string;
  awayTeam?: string;
  seasonAvgPoints?: number;
};

const formatAmericanOdds = (price: number | null) => {
  if (price == null) return "N/A";
  return `${price > 0 ? "+" : ""}${price}`;
};

const PlayerOddsPanel = ({
  playerName,
  homeTeam,
  awayTeam,
  seasonAvgPoints = 0,
}: PlayerOddsPanelProps) => {
  const { data, isLoading, isError } = usePlayerOdds(playerName, homeTeam, awayTeam);

  return (
    <div className="rounded-[28px] border border-border/70 bg-card/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)] backdrop-blur">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/80">
          Player Odds
        </p>
        <h3 className="mt-2 text-lg font-semibold text-foreground">
          {playerName ? `${playerName} points line` : "Select a player"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Current sportsbook lines for tonight's matchup.
        </p>
      </div>

      {!playerName && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Pick a player to load their current points market.
        </div>
      )}

      {playerName && isLoading && (
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading sportsbook prices...
        </div>
      )}

      {playerName && isError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-5 text-sm text-destructive">
          Failed to load player odds.
        </div>
      )}

      {playerName && data && data.odds.length === 0 && (
        <div className="rounded-2xl border border-border bg-muted/20 px-4 py-5 text-sm text-muted-foreground">
          No points lines are available for this player yet.
        </div>
      )}

      {playerName && data && data.odds.length > 0 && (
        <div className="space-y-3">
          {data.odds.map((odds) => {
            const edge = seasonAvgPoints - odds.line;
            const aboveLine = edge >= 0;

            return (
              <div
                key={odds.bookmakerKey}
                className="rounded-2xl border border-border/70 bg-background/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{odds.bookmaker}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      Points market
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Line
                    </p>
                    <p className="text-2xl font-bold text-foreground">{odds.line}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border/70 bg-card/80 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Over
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatAmericanOdds(odds.overPrice)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card/80 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      Under
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {formatAmericanOdds(odds.underPrice)}
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium ${
                    aboveLine
                      ? "bg-green-500/10 text-green-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  {aboveLine ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  Season average {seasonAvgPoints} vs line {odds.line}
                </div>
              </div>
            );
          })}

          <p className="px-1 text-[11px] text-muted-foreground">
            Odds are informational only and may move throughout the day.
          </p>
        </div>
      )}
    </div>
  );
};

export default PlayerOddsPanel;
