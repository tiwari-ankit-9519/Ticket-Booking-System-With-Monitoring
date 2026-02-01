import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import api, { ApiResponse } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import type { Event, EventsQueryParams } from "@/types";

interface PaginatedEvents {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AvalabilityData {
  eventId: string;
  totalSeats: number;
  availableSeats: number;
  bookedSeats: number;
  isSoldOut: boolean;
  percentage: number;
}

interface searchSuggestion {
  events: Event[];
  cities: string[];
  tags: string[];
}

const eventsApi = {
  getEvents: async (params: EventsQueryParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.category) query.set("category", String(params.category));
    if (params.city) query.set("city", String(params.city));
    if (params.search) query.set("search", String(params.search));
    if (params.sortBy) query.set("sortBy", String(params.sortBy));
    if (params.sortOrder) query.set("sortOrder", String(params.sortOrder));
    if (params.minPrice !== undefined)
      query.set("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined)
      query.set("maxPrice", String(params.maxPrice));
    if (params.startDate) query.set("startDate", String(params.startDate));
    if (params.endDate) query.set("endDate", String(params.endDate));

    const response = await api.get<ApiResponse<PaginatedEvents>>(
      `/api/events?${query.toString()}`,
    );
    return response.data.data;
  },

  getEventById: async (id: string) => {
    const response = await api.get<ApiResponse<Event>>(`/api/events/${id}`);
    return response.data.data;
  },

  getFeaturedEvents: async () => {
    const response = await api.get<ApiResponse<{ events: Event[] }>>(
      "/api/events/featured",
    );
    return response.data.data.events;
  },

  getUpcomingEvents: async (limit: number = 10) => {
    const response = await api.get<ApiResponse<{ events: Event[] }>>(
      `/api/events/upcoming?limit=${limit}`,
    );
    return response.data.data.events;
  },

  checkAvailabilty: async (eventId: string) => {
    const response = await api.get<ApiResponse<AvalabilityData>>(
      `/api/events/${eventId}/availability`,
    );
    return response.data.data;
  },

  getSearchSuggestions: async (query: string) => {
    const response = await api.get<ApiResponse<searchSuggestion>>(
      `/api/search/suggestions?q=${encodeURIComponent(query)}`,
    );
    return response.data.data;
  },
};

export const useEvents = (params: EventsQueryParams = {}) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.EVENTS, params],
    queryFn: () => eventsApi.getEvents(params),
    staleTime: 30 * 1000,
    placeholderData: (previousData) => previousData,
  });
};

export const useEventsPaginated = (params: EventsQueryParams = {}) => {
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.EVENTS, "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      return eventsApi.getEvents({ ...params, page: pageParam });
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
    staleTime: 30 * 1000,
  });
};

export const useEventDetail = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.EVENT_DETAIL(id),
    queryFn: () => eventsApi.getEventById(id),
    staleTime: 60 * 1000,
    enabled: !!id,
  });
};

export const useFeaturedEvents = () => {
  return useQuery({
    queryKey: QUERY_KEYS.FEATURED_EVENTS,
    queryFn: eventsApi.getFeaturedEvents,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingEvents = (limit: number = 10) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.UPCOMING_EVENTS, limit],
    queryFn: () => eventsApi.getUpcomingEvents(limit),
    staleTime: 2 * 60 * 1000,
  });
};

export const useEventAvailability = (eventId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.EVENT_AVAILABILITY(eventId),
    queryFn: () => eventsApi.checkAvailabilty(eventId),
    enabled: !!eventId,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
};

export const useSearchSuggestions = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH_SUGGESTIONS(query),
    queryFn: () => eventsApi.getSearchSuggestions(query),
    enabled: query.length >= 2,
    staleTime: 10 * 1000,
  });
};
