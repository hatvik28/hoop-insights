import { Link } from "react-router-dom";
import type { NbaGame } from "@/types/nba";
import { teamLogoUrl } from "@/lib/nba";
import { cn } from "@/lib/utils";

type MatchupCardProps = {
  game: NbaGame;
  className?: string;
};

function formatGameDate(startTime: string) {
  return new Date(startTime).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function shouldShowStatus(status?: string) {
  return Boolean(status && !status.includes("T") && !status.includes("-"));
}

const MatchupCard = ({ game, className }: MatchupCardProps) => {
  const awayLogo = teamLogoUrl(game.awayTeamAbbr);
  const homeLogo = teamLogoUrl(game.homeTeamAbbr);

  return (
    <Link
      to={`/games/${game.id}`}
      className={cn(
        "block rounded-[28px] border border-border/70 bg-card/80 p-5 text-left transition-all hover:border-primary/50 hover:bg-card hover:shadow-[0_18px_45px_rgba(249,115,22,0.16)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/80">
            Matchup
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatGameDate(game.startTime)}
            {shouldShowStatus(game.status) && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {game.status}
              </span>
            )}
          </p>
        </div>
        <span className="rounded-full border border-border/60 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Open
        </span>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-foreground">{game.awayTeam}</p>
          {awayLogo ? (
            <img src={awayLogo} alt="" className="mt-3 h-16 w-16 object-contain" />
          ) : (
            <div className="mt-3 h-16 w-16 rounded-full bg-muted" />
          )}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {game.awayTeamAbbr}
          </p>
        </div>

        <div className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          @
        </div>

        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-foreground">{game.homeTeam}</p>
          {homeLogo ? (
            <img src={homeLogo} alt="" className="mt-3 h-16 w-16 object-contain" />
          ) : (
            <div className="mt-3 h-16 w-16 rounded-full bg-muted" />
          )}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {game.homeTeamAbbr}
          </p>
        </div>
      </div>
    </Link>
  );
};

export default MatchupCard;
