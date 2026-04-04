const { spawn } = require("child_process");
function startBot() {
  const bot = spawn("node", ["./SS/FaroConnect.js"], { stdio: "inherit" });
  bot.on("exit", (code, signal) => {
    startBot();
  });
}

startBot();
