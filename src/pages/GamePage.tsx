import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BarChart3, Loader2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Header from "@/components/Header";
import PlayerOddsPanel from "@/components/PlayerOddsPanel";
import PlayerStatsChart from "@/components/PlayerStatsChart";
import { useGames, usePlayers, usePlayerStats } from "@/hooks/useNbaData";
import { playerAvatarUrl, teamLogoUrl } from "@/lib/nba";

function MatchupSummaryCard({
  awayTeam,
  awayTeamAbbr,
  homeTeam,
  homeTeamAbbr,
}: {
  awayTeam: string;
  awayTeamAbbr?: string | null;
  homeTeam: string;
  homeTeamAbbr?: string | null;
}) {
  const awayLogo = teamLogoUrl(awayTeamAbbr);
  const homeLogo = teamLogoUrl(homeTeamAbbr);

  return (
    <div className="rounded-[24px] border border-border/70 bg-background/40 p-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
        <div>
          <p className="text-xs font-semibold text-foreground">{awayTeam}</p>
          {awayLogo ? (
            <img src={awayLogo} alt="" className="mx-auto mt-2 h-12 w-12 object-contain" />
          ) : (
            <div className="mx-auto mt-2 h-12 w-12 rounded-full bg-muted" />
          )}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">@</span>
        <div>
          <p className="text-xs font-semibold text-foreground">{homeTeam}</p>
          {homeLogo ? (
            <img src={homeLogo} alt="" className="mx-auto mt-2 h-12 w-12 object-contain" />
          ) : (
            <div className="mx-auto mt-2 h-12 w-12 rounded-full bg-muted" />
          )}
        </div>
      </div>
    </div>
  );
}

const GamePage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const { data: games, isLoading: gamesLoading, isError: gamesError } = useGames();
  const selectedGame = useMemo(
    () => games?.find((game) => game.id === gameId) ?? null,
    [gameId, games],
  );

  const {
    data: players,
    isLoading: playersLoading,
    isError: playersError,
    refetch: refetchPlayers,
  } = usePlayers(selectedGame?.id ?? null);

  const selectedPlayer = useMemo(
    () => players?.find((player) => player.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId],
  );

  const { data: playerStats, isLoading: statsLoading } = usePlayerStats(
    selectedPlayerId,
    selectedGame?.id,
  );

  const showMissingGameState = !gamesLoading && !gamesError && !selectedGame;

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Header />

      <main className="mx-auto max-w-[1680px] px-4 py-5 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-2 px-0 text-muted-foreground hover:bg-transparent">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to matchups
              </Link>
            </Button>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Game Dashboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select a player from the left rail to load their trends and sportsbook context.
            </p>
          </div>
        </div>

        {gamesLoading && (
          <div className="flex items-center justify-center rounded-[28px] border border-border/60 bg-card/70 px-4 py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading matchup...
          </div>
        )}

        {gamesError && (
          <div className="rounded-[28px] border border-destructive/40 bg-destructive/10 px-4 py-8 text-sm text-destructive">
            Failed to load games. Check backend.
          </div>
        )}

        {showMissingGameState && (
          <div className="rounded-[28px] border border-border/60 bg-card/70 px-4 py-8 text-sm text-muted-foreground">
            This matchup could not be found.
          </div>
        )}

        {selectedGame && (
          <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
            <Card className="rounded-[28px] border-border/70 bg-card/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 shrink-0 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Rotation
                </h2>
              </div>

              <div className="mt-5">
                <MatchupSummaryCard
                  awayTeam={selectedGame.awayTeam}
                  awayTeamAbbr={selectedGame.awayTeamAbbr}
                  homeTeam={selectedGame.homeTeam}
                  homeTeamAbbr={selectedGame.homeTeamAbbr}
                />
              </div>

              {playersLoading && (
                <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading players…</span>
                </div>
              )}

              {playersError && (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <p className="text-xs text-destructive">Failed to load players.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchPlayers()}>
                    Try again
                  </Button>
                </div>
              )}

              {players && (
                <div className="mt-5 max-h-[720px] space-y-2 overflow-y-auto pr-1">
                  {players.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No rotation data yet for this game.
                    </p>
                  ) : (
                    players.map((player) => {
                      const isSelectedPlayer = player.id === selectedPlayerId;

                      return (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() => setSelectedPlayerId(player.id)}
                          className={
                            isSelectedPlayer
                              ? "w-full rounded-2xl border border-primary bg-primary/10 px-3 py-3 text-left shadow-[0_10px_30px_rgba(249,115,22,0.12)] transition-all"
                              : "w-full rounded-2xl border border-border/70 bg-background/45 px-3 py-3 text-left transition-all hover:border-primary/40 hover:bg-background/70"
                          }
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-11 w-11 shrink-0 rounded-full ring-2 ring-border">
                              <AvatarImage
                                src={playerAvatarUrl(player.name)}
                                alt={player.name}
                                className="object-cover"
                              />
                              <AvatarFallback className="bg-primary/20 text-sm font-semibold text-primary">
                                {player.name
                                  .split(" ")
                                  .map((namePart) => namePart[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {player.name}
                              </div>
                              <div className="mt-0.5 text-[11px] text-muted-foreground">
                                {player.team} · {player.position}
                              </div>
                              {player.avgMinutes != null && (
                                <div className="mt-1 text-[11px] font-medium text-primary">
                                  {player.avgMinutes} mpg
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </Card>

            <Card className="rounded-[28px] border-border/70 bg-card/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)] lg:p-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                  Stats Dashboard
                </h2>
              </div>

              {!selectedPlayerId && (
                <div className="mt-5 flex min-h-[560px] items-center justify-center rounded-[24px] border border-dashed border-border bg-muted/20 px-4">
                  <p className="max-w-sm text-center text-sm text-muted-foreground">
                    Select a player from the left rail to load their recent graph and game log.
                  </p>
                </div>
              )}

              {selectedPlayerId && statsLoading && (
                <div className="mt-5 flex min-h-[560px] items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading stats…</span>
                </div>
              )}

              {playerStats && (
                <div className="mt-5">
                  <PlayerStatsChart playerStats={playerStats} />
                </div>
              )}
            </Card>

            <PlayerOddsPanel
              playerName={selectedPlayer?.name}
              homeTeam={selectedGame.homeTeam}
              awayTeam={selectedGame.awayTeam}
              seasonAvgPoints={playerStats?.seasonAvgPoints}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default GamePage;
