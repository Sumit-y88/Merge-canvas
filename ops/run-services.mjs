import { spawn } from "node:child_process";

const command = process.argv[2] || "dev";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const services = [
  spawn(npm, ["run", command, "--prefix", "client"], { stdio: "inherit" }),
  spawn(npm, ["run", command, "--prefix", "server"], { stdio: "inherit" }),
];

const stop = (signal) => {
  for (const service of services) service.kill(signal);
};

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
for (const service of services) {
  service.on("exit", (code) => {
    if (code && code !== 0) {
      stop("SIGTERM");
      process.exitCode = code;
    }
  });
}
