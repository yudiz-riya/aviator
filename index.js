require("dotenv").config();
require("./globals");

const express = require("express");
const path = require("path");

const { mongodb, redis, getIp, queue } = require("./app/utils");
const router = require("./app/routers");
const socket = require("./app/sockets");
const _ = require("./globals/lib/helper");

(async () => {
  try {
    // Backend initialization
    console.log("\n---------------------------------");
    await mongodb.initialize();
    await redis.initialize();

    // Initialize express and serve static files
    const app = express();
    const PORT = 3006;

    // Serve the frontend files from "frontend/public"
    app.use(express.static(path.join(__dirname, "frontend", "public")));

    // Fallback for SPA (Single Page Application)
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "frontend", "public", "index.html"));
    });

    // Initialize routers and WebSocket server
    router.initialize();
    socket.initialize(router.httpServer);

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    log.blue(":-(");
    log.red(`Reason: ${err.message}, Stack: ${err.stack}`);
    process.exit(1);
  }
})();

console.log(
  `NODE_ENV ${process.env.NODE_ENV} 🌱, PORT ${process.env.PORT} \n---------------------------------`
);
