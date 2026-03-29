import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthStatus, logout, getActivities, getRecentActivities, getStatsSummary, getWeeklyStats } from '../services/api';

export function useAuthStatus() {
  return useQuery({
    queryKey: ['authStatus'],
    queryFn: getAuthStatus,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
      queryClient.clear();
    },
  });
}

export function useActivities(page = 1, perPage = 20) {
  return useQuery({
    queryKey: ['activities', page, perPage],
    queryFn: () => getActivities(page, perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentActivities(limit = 5) {
  return useQuery({
    queryKey: ['recentActivities', limit],
    queryFn: () => getRecentActivities(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStatsSummary() {
  return useQuery({
    queryKey: ['statsSummary'],
    queryFn: getStatsSummary,
    staleTime: 10 * 60 * 1000,
  });
}

export function useWeeklyStats(weeks = 12) {
  return useQuery({
    queryKey: ['weeklyStats', weeks],
    queryFn: () => getWeeklyStats(weeks),
    staleTime: 10 * 60 * 1000,
  });
}
