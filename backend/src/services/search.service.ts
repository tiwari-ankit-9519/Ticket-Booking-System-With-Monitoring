import { prisma } from "../config/database.config";
import { redis } from "../config/redis.config";
import { logger } from "../config/logger.config";

export async function globalSearch(query: string, filters: any = {}) {
  try {
    const cacheKey = `search:global:${query}:${JSON.stringify(filters)}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const { limit = 10, includeEvents = true, includeUsers = false } = filters;

    const results: any = {};

    if (includeEvents) {
      const events = await prisma.event.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { venue: { contains: query, mode: "insensitive" } },
            { city: { contains: query, mode: "insensitive" } },
            { tags: { has: query } },
          ],
          status: "PUBLISHED",
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          venue: true,
          city: true,
          eventDate: true,
          pricePerSeat: true,
          imageUrl: true,
          availableSeats: true,
        },
        take: limit,
      });

      results.events = events;
    }

    if (includeUsers) {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
        take: limit,
      });

      results.users = users;
    }

    await redis.setex(cacheKey, 300, JSON.stringify(results));

    return results;
  } catch (error: any) {
    logger.error("Global search failed", { error: error.message, query });
    throw error;
  }
}

export async function getSearchSuggestions(query: string) {
  try {
    const cacheKey = `search:suggestions:${query}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const [events, cities, categories] = await Promise.all([
      prisma.event.findMany({
        where: {
          title: { contains: query, mode: "insensitive" },
          status: "PUBLISHED",
        },
        select: { title: true },
        take: 5,
        distinct: ["title"],
      }),
      prisma.event.findMany({
        where: {
          city: { contains: query, mode: "insensitive" },
          status: "PUBLISHED",
        },
        select: { city: true },
        take: 5,
        distinct: ["city"],
      }),
      prisma.event.findMany({
        where: {
          tags: { has: query },
          status: "PUBLISHED",
        },
        select: { tags: true },
        take: 5,
      }),
    ]);

    const suggestions = {
      events: events.map((e) => e.title),
      cities: cities.map((c) => c.city),
      tags: [...new Set(categories.flatMap((c) => c.tags))].slice(0, 5),
    };

    await redis.setex(cacheKey, 600, JSON.stringify(suggestions));

    return suggestions;
  } catch (error: any) {
    logger.error("Failed to get search suggestions", {
      error: error.message,
      query,
    });
    throw error;
  }
}

export async function getPopularSearches() {
  try {
    const cacheKey = "search:popular";
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const popularEvents = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        title: true,
        category: true,
        city: true,
      },
      orderBy: {
        bookings: {
          _count: "desc",
        },
      },
      take: 10,
    });

    const popular = {
      searches: popularEvents.map((e) => e.title),
      categories: [...new Set(popularEvents.map((e) => e.category))],
      cities: [...new Set(popularEvents.map((e) => e.city))],
    };

    await redis.setex(cacheKey, 3600, JSON.stringify(popular));

    return popular;
  } catch (error: any) {
    logger.error("Failed to get popular searches", { error: error.message });
    throw error;
  }
}
