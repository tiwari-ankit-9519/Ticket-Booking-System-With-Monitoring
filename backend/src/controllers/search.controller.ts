import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";
import * as searchService from "../services/search.service";
import { logger } from "../config/logger.config";

export async function globalSearch(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
      return;
    }

    const results = await searchService.globalSearch(query, req.query);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    logger.error("Global search error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
}

export async function getSearchSuggestions(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters",
      });
      return;
    }

    const suggestions = await searchService.getSearchSuggestions(query);

    res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error: any) {
    logger.error("Get suggestions error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
    });
  }
}

export async function getPopularSearches(
  req: AuthRequest,
  res: Response,
): Promise<void> {
  try {
    const popular = await searchService.getPopularSearches();

    res.status(200).json({
      success: true,
      data: popular,
    });
  } catch (error: any) {
    logger.error("Get popular searches error", { error: error.message });

    res.status(500).json({
      success: false,
      message: "Failed to get popular searches",
    });
  }
}
