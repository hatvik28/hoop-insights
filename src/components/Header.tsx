import { Activity } from "lucide-react";

const Header = () => (
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
            Today&apos;s games &middot; Player stats
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Activity className="w-3.5 h-3.5 text-primary" />
        <span>Powered by Balldontlie</span>
      </div>
    </div>
  </header>
);

export default Header;
