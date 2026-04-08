import "dotenv/config";
import express from "express";
import cors from "cors";
import { loadTeams } from "./lib/bdlClient.js";
import gamesRouter from "./routes/games.js";
import playersRouter from "./routes/players.js";
import statsRouter from "./routes/stats.js";
import oddsRouter from "./routes/odds.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ["https://hatvik28.github.io", "http://localhost:8080"],
}));
app.use(express.json());

loadTeams();

app.use("/api/games", gamesRouter);
app.use("/api/games", playersRouter);
app.use("/api/players", statsRouter);
app.use("/api/odds", oddsRouter);

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
  if (!process.env.BALLDONTLIE_API_KEY) {
    console.warn("WARNING: BALLDONTLIE_API_KEY not set!");
  }
});
