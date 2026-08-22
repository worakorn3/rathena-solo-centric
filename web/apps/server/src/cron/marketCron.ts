import { CronJob } from "cron"; // Using cron package since bun cron might not be natively imported depending on version
import { MarketSimulationService } from "../services/marketSimulation.service";

export function initMarketCron() {
  console.log("[MarketCron] Initializing market cron jobs...");

  // Hourly Price Shift: runs at minute 0 of every hour
  const hourlyJob = new CronJob("0 * * * *", async () => {
    try {
      await MarketSimulationService.processHourlyShift();
    } catch (err) {
      console.error("[MarketCron] Error processing hourly shift:", err);
    }
  });

  // Midnight DRIP: runs at 00:00 every day
  const midnightJob = new CronJob("0 0 * * *", async () => {
    try {
      await MarketSimulationService.processMidnightDrip();
    } catch (err) {
      console.error("[MarketCron] Error processing midnight DRIP:", err);
    }
  });

  hourlyJob.start();
  midnightJob.start();
}
