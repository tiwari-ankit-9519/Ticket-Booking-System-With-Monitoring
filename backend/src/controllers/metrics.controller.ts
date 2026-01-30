import { Request, Response } from "express";
import { getMetrics } from "../services/prometheus.service";

export async function getPrometheusMetrics(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const metrics = await getMetrics();
    res.set("Content-Type", "text/plain");
    res.send(metrics);
  } catch (error: any) {
    res.status(500).send("Failed to get metrics");
  }
}
