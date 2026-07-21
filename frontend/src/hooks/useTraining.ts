import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAuthStatus, logout, getActivities, getRecentActivities, getStatsSummary, getWeeklyStats,
  getActivePlan, getAllPlans, createPlan, deactivatePlan,
  getPlanWorkouts, getWeekWorkouts, completeWorkout, getPlanAssessment, getWeekAssessment,
  logWeight, getWeightHistory, getWeightSummary, deleteWeightEntry,
} from '../services/api';
import type { CreatePlanRequest } from '../types';

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

// ── Training Plan hooks ─────────────────────────────────────────────

export function useActivePlan() {
  return useQuery({
    queryKey: ['activePlan'],
    queryFn: getActivePlan,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useAllPlans() {
  return useQuery({
    queryKey: ['allPlans'],
    queryFn: getAllPlans,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreatePlanRequest) => createPlan(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      queryClient.invalidateQueries({ queryKey: ['allPlans'] });
    },
  });
}

export function useDeactivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: number) => deactivatePlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activePlan'] });
      queryClient.invalidateQueries({ queryKey: ['allPlans'] });
    },
  });
}

export function usePlanWorkouts(planId: number | undefined, from?: string, to?: string) {
  return useQuery({
    queryKey: ['planWorkouts', planId, from, to],
    queryFn: () => getPlanWorkouts(planId!, from, to),
    enabled: planId != null,
    staleTime: 2 * 60 * 1000,
  });
}

export function useWeekWorkouts(planId: number | undefined, week: number) {
  return useQuery({
    queryKey: ['weekWorkouts', planId, week],
    queryFn: () => getWeekWorkouts(planId!, week),
    enabled: planId != null,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCompleteWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ workoutId, linkedActivityId }: { workoutId: number; linkedActivityId?: string }) =>
      completeWorkout(workoutId, linkedActivityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['weekWorkouts'] });
      queryClient.invalidateQueries({ queryKey: ['planAssessment'] });
    },
  });
}

export function usePlanAssessment(planId: number | undefined) {
  return useQuery({
    queryKey: ['planAssessment', planId],
    queryFn: () => getPlanAssessment(planId!),
    enabled: planId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeekAssessment(planId: number | undefined) {
  return useQuery({
    queryKey: ['weekAssessment', planId],
    queryFn: () => getWeekAssessment(planId!),
    enabled: planId != null,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Weight tracking hooks ───────────────────────────────────────────

export function useWeightSummary() {
  return useQuery({
    queryKey: ['weightSummary'],
    queryFn: getWeightSummary,
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}

export function useWeightHistory(from?: string, to?: string) {
  return useQuery({
    queryKey: ['weightHistory', from, to],
    queryFn: () => getWeightHistory(from, to),
    staleTime: 2 * 60 * 1000,
  });
}

export function useLogWeight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logWeight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightSummary'] });
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
    },
  });
}

export function useDeleteWeightEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWeightEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weightSummary'] });
      queryClient.invalidateQueries({ queryKey: ['weightHistory'] });
    },
  });
}
