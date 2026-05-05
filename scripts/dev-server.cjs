const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const next = require("next");

const port = Number(process.env.PORT || 3000);
const hostname = process.env.HOST || "127.0.0.1";
const logPath = path.join(process.cwd(), "next-dev.log");
const errPath = path.join(process.cwd(), "next-dev.err.log");

function writeLog(filePath, message) {
  fs.appendFileSync(filePath, `${new Date().toISOString()} ${message}\n`);
}

process.on("uncaughtException", (error) => {
  writeLog(errPath, error.stack || String(error));
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  writeLog(errPath, error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});

const app = next({ dev: true, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http
    .createServer((request, response) => {
      handle(request, response);
    })
    .listen(port, hostname, () => {
      writeLog(logPath, `Ready on http://${hostname}:${port}`);
      console.log(`Ready on http://${hostname}:${port}`);
    });
});
