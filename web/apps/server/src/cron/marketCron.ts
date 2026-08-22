import { CronJob } from "cron"; // Using cron package since bun cron might not be natively imported depending on version
import { MarketSimulationService } from "../services/marketSimulation.service";

export function initMarketCron() {
  console.log("[MarketCron] Initializing market cron jobs...");

  // 10-Minute Price Shift: runs every 10 minutes (0, 10, 20, 30, 40, 50)
  const shiftJob = new CronJob("*/10 * * * *", async () => {
    try {
      await MarketSimulationService.processHourlyShift();
    } catch (err) {
      console.error("[MarketCron] Error processing price shift:", err);
    }
  });

  // 4-Hour DRIP & Dividends: runs every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  const dripJob = new CronJob("0 */4 * * *", async () => {
    try {
      await MarketSimulationService.processMidnightDrip();
    } catch (err) {
      console.error("[MarketCron] Error processing DRIP/dividends:", err);
    }
  });

  shiftJob.start();
  dripJob.start();
}
