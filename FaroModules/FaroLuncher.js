const { spawn } = require("child_process");
function startBot() {
  const bot = spawn("node", ["./FaroModules/FaroConnect.js"], { stdio: "inherit" });
  bot.on("exit", (code, signal) => {
    startBot();
  });
}

startBot();
