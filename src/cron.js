import { CronJob } from "cron";
import http from "node:http";
import https from "node:https";

// every 14 minutes send a GET request to the health endpoint
const job = new CronJob("*/10 * * * *", function () {
  const base = process.env.BACKEND_URL;

  if (!base) {
    console.log("BACKEND_URL is missing");
    return;
  }

  const url = new URL("/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  client
    .get(url, (res) => {
      if (res.statusCode === 200) {
        console.log("API STATUS: CHECK!");
      } else {
        console.log("GET request failed", res.statusCode);
      }

      res.resume(); // important: consume response data
    })
    .on("error", (e) => {
      console.error("Error while sending request:", e.message);
    });
});

export default job;
