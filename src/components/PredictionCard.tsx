import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PredictionCardProps {
  playerName?: string;
  stat?: string;
  line?: number;
  prediction: string;
  confidence: number;
  team1?: string;
  team2?: string;
  spread?: string;
  type: "player" | "game";
}

export const PredictionCard = ({
  playerName,
  stat,
  line,
  prediction,
  confidence,
  team1,
  team2,
  spread,
  type,
}: PredictionCardProps) => {
  const isOver = prediction.toLowerCase().includes("over") || prediction.toLowerCase().includes("win");
  
  return (
    <Card className="bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow p-6 group cursor-pointer">
      <div className="space-y-4">
        {type === "player" ? (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {playerName}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{stat}</p>
              </div>
              <Badge 
                variant="secondary" 
                className="bg-secondary/50 text-foreground font-semibold"
              >
                {line}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              {isOver ? (
                <TrendingUp className="w-5 h-5 text-primary" />
              ) : (
                <TrendingDown className="w-5 h-5 text-primary" />
              )}
              <span className="text-lg font-semibold text-foreground">{prediction}</span>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-foreground">{team1}</span>
                <span className="text-sm text-muted-foreground">vs</span>
                <span className="text-lg font-bold text-foreground">{team2}</span>
              </div>
              {spread && (
                <div className="text-center">
                  <Badge variant="secondary" className="bg-secondary/50 text-foreground font-semibold">
                    {spread}
                  </Badge>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-lg font-semibold text-foreground">{prediction}</span>
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="text-foreground font-semibold">{confidence}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-accent h-full transition-all duration-500 group-hover:shadow-glow"
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
