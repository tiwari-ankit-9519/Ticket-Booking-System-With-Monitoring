import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { optionalAuth } from "../middlewares/auth.middleware";

const router: Router = Router();

router.get("/search", optionalAuth, searchController.globalSearch);

router.get(
  "/search/suggestions",
  optionalAuth,
  searchController.getSearchSuggestions,
);

router.get("/search/popular", searchController.getPopularSearches);

export default router;
