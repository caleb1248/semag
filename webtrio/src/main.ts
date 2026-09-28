import "./style.css";
await import("./canvas");
import { createGame } from "./gp/game";
import { DEFAULT_ROOM_CONFIG } from "./room-config";
const config = await fetch(
  "/sample_configs/mine.ttc?v=" + Date.now().toString(),
).then((r) => r.json());

createGame(DEFAULT_ROOM_CONFIG, config).start();
