import { BarChart3, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import MatchupCard from "@/components/MatchupCard";
import { useGames } from "@/hooks/useNbaData";

const Index = () => {
  const { data: games, isLoading: gamesLoading, isError: gamesError } = useGames();

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
        <section className="rounded-[32px] border border-border/60 bg-[linear-gradient(135deg,rgba(249,115,22,0.14),rgba(15,23,42,0.35))] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary/85">
                NBA Props Dashboard
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground lg:text-5xl">
                Start with tonight&apos;s matchup board, then open a dedicated player analysis page.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground lg:text-base">
                Pick a game to load its own screen with the player list on the left, performance charts in the
                middle, and sportsbook lines on the right.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Games tonight</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{games?.length ?? 0}</p>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">
              Today&apos;s Matchups
            </h2>
          </div>

          {gamesLoading && (
            <div className="flex items-center justify-center rounded-[28px] border border-border/60 bg-card/70 px-4 py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading matchups...
            </div>
          )}

          {gamesError && (
            <div className="rounded-[28px] border border-destructive/40 bg-destructive/10 px-4 py-8 text-sm text-destructive">
              Failed to load games. Check backend.
            </div>
          )}

          {!gamesLoading && !games?.length && (
            <div className="rounded-[28px] border border-border/60 bg-card/70 px-4 py-8 text-sm text-muted-foreground">
              No games today.
            </div>
          )}

          {games && games.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {games.map((game) => (
                <MatchupCard key={game.id} game={game} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Index;
