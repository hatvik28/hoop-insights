import { PredictionCard } from "@/components/PredictionCard";
import { Button } from "@/components/ui/button";
import { BarChart3, Trophy, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-basketball.jpg";

const Index = () => {
  const playerProps = [
    {
      playerName: "LeBron James",
      stat: "Points",
      line: 25.5,
      prediction: "Over",
      confidence: 78,
    },
    {
      playerName: "Stephen Curry",
      stat: "3-Pointers Made",
      line: 4.5,
      prediction: "Over",
      confidence: 82,
    },
    {
      playerName: "Giannis Antetokounmpo",
      stat: "Rebounds",
      line: 11.5,
      prediction: "Under",
      confidence: 71,
    },
  ];

  const gamePredictions = [
    {
      team1: "Lakers",
      team2: "Warriors",
      spread: "LAL -3.5",
      prediction: "Lakers Win",
      confidence: 68,
    },
    {
      team1: "Celtics",
      team2: "Heat",
      spread: "BOS -5.5",
      prediction: "Celtics Cover",
      confidence: 75,
    },
    {
      team1: "Bucks",
      team2: "76ers",
      spread: "MIL -2.5",
      prediction: "Bucks Win",
      confidence: 72,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary/50 backdrop-blur-sm px-4 py-2 rounded-full border border-border">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI-Powered NBA Analytics</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-foreground">Predict NBA</span>
              <br />
              <span className="text-primary">Like a Pro</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced analytics and AI-driven predictions for NBA player props and game outcomes. 
              Get the edge you need to make informed decisions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Predictions
              </Button>
              <Button size="lg" variant="secondary" className="text-lg px-8">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">87%</div>
              <div className="text-sm text-muted-foreground mt-1">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1,200+</div>
              <div className="text-sm text-muted-foreground mt-1">Predictions Made</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">30</div>
              <div className="text-sm text-muted-foreground mt-1">NBA Teams Tracked</div>
            </div>
          </div>
        </div>
      </section>

      {/* Player Props Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              Top Player Props
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI analyzes player performance, matchups, and historical data to provide accurate prop predictions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {playerProps.map((prop, index) => (
              <div
                key={index}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
              >
                <PredictionCard type="player" {...prop} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Predictions Section */}
      <section className="bg-card/30 backdrop-blur-sm border-y border-border">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Game Predictions
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Data-driven predictions for upcoming NBA games with spread analysis
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {gamePredictions.map((game, index) => (
                <div
                  key={index}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                >
                  <PredictionCard type="game" {...game} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="bg-gradient-card border border-border rounded-2xl p-12 text-center space-y-6 shadow-lg">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Ready to Start Winning?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get access to our premium predictions and analytics to make smarter NBA betting decisions
          </p>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow text-lg px-8">
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
