import type { Workout, WorkoutMetrics, FilterOptions, CompareMode, ComparisonResult } from '../types'
import { calculateVolume } from '../utils/formatters'
import { toDateSafe } from '../utils/formatters'
import { startOfWeek, endOfWeek, subWeeks, subDays, startOfDay, isWithinInterval } from 'date-fns'

/**
 * Compute metrics for a single workout
 */
export function computeWorkoutMetrics(workout: Workout): WorkoutMetrics {
  const workoutDate = toDateSafe(workout.date) || new Date()
  const startTime = toDateSafe(workout.startTime)
  const endTime = toDateSafe(workout.endTime)
  
  // Calculate duration in minutes
  let duration = 0
  if (startTime && endTime) {
    const durationMs = endTime.getTime() - startTime.getTime()
    duration = Math.max(0, durationMs / 60000) // Convert to minutes
  }
  
  // Calculate metrics from completed sets
  let totalVolume = 0
  let topSetWeight = 0
  let totalSets = 0
  let totalWeight = 0
  let completedSetsCount = 0
  
  workout.exercises.forEach(exercise => {
    exercise.sets.forEach(set => {
      if (set.completed && set.weight > 0 && set.reps > 0) {
        const volume = calculateVolume(set.weight, set.reps)
        totalVolume += volume
        topSetWeight = Math.max(topSetWeight, set.weight)
        totalSets += 1
        totalWeight += set.weight
        completedSetsCount += 1
      }
    })
  })
  
  // Calculate intensity (average weight across completed sets)
  const intensity = completedSetsCount > 0 ? totalWeight / completedSetsCount : 0
  
  // Calculate volume per minute
  const volumePerMinute = duration > 0 ? totalVolume / duration : 0
  
  return {
    workoutId: workout.id,
    date: workoutDate,
    type: workout.type,
    totalVolume,
    topSetWeight,
    volumePerMinute,
    totalSets,
    intensity,
    duration,
  }
}

/**
 * Filter workouts based on filter options
 */
export function filterWorkouts(workouts: Workout[], filters: FilterOptions): Workout[] {
  return workouts.filter(workout => {
    // Filter by date range
    const workoutDate = toDateSafe(workout.date)
    if (!workoutDate) return false
    
    if (!isWithinInterval(workoutDate, { start: filters.dateRange.start, end: filters.dateRange.end })) {
      return false
    }
    
    // Filter by workout type
    if (filters.workoutType !== 'all' && workout.type !== filters.workoutType) {
      return false
    }
    
    // Only include completed workouts
    if (!workout.completed) {
      return false
    }
    
    return true
  })
}

/**
 * Compare workouts based on comparison mode
 */
export function compareWorkouts(
  metrics: WorkoutMetrics[],
  compareMode: CompareMode,
  metricKey: keyof WorkoutMetrics
): ComparisonResult | null {
  if (metrics.length === 0) {
    return null
  }
  
  // Sort by date descending (most recent first)
  const sorted = [...metrics].sort((a, b) => b.date.getTime() - a.date.getTime())
  
  if (compareMode === 'none') {
    // Just return the latest value
    const current = sorted[0][metricKey] as number
    return {
      current,
      previous: current,
      change: 0,
      changePercent: 0,
    }
  }
  
  if (compareMode === 'last-vs-average') {
    const current = sorted[0][metricKey] as number
    
    if (sorted.length < 2) {
      return {
        current,
        previous: current,
        change: 0,
        changePercent: 0,
      }
    }
    
    // Calculate average of last 5 sessions (or all if less than 5)
    const sessionsToAverage = Math.min(5, sorted.length - 1) // Exclude current session
    const previousSessions = sorted.slice(1, sessionsToAverage + 1)
    const average = previousSessions.reduce((sum, m) => sum + (m[metricKey] as number), 0) / previousSessions.length
    
    const change = current - average
    const changePercent = average > 0 ? (change / average) * 100 : 0
    
    return {
      current,
      previous: average,
      change,
      changePercent,
    }
  }
  
  if (compareMode === 'week-over-week') {
    const current = sorted[0][metricKey] as number
    const currentDate = sorted[0].date
    
    // Get this week's range
    const thisWeekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const thisWeekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
    
    // Get last week's range
    const lastWeekStart = subWeeks(thisWeekStart, 1)
    const lastWeekEnd = subWeeks(thisWeekEnd, 1)
    
    // Calculate this week's average
    const thisWeekMetrics = sorted.filter(m => 
      isWithinInterval(m.date, { start: thisWeekStart, end: thisWeekEnd })
    )
    const thisWeekAvg = thisWeekMetrics.length > 0
      ? thisWeekMetrics.reduce((sum, m) => sum + (m[metricKey] as number), 0) / thisWeekMetrics.length
      : current
    
    // Calculate last week's average
    const lastWeekMetrics = sorted.filter(m =>
      isWithinInterval(m.date, { start: lastWeekStart, end: lastWeekEnd })
    )
    
    if (lastWeekMetrics.length === 0) {
      return {
        current: thisWeekAvg,
        previous: thisWeekAvg,
        change: 0,
        changePercent: 0,
      }
    }
    
    const lastWeekAvg = lastWeekMetrics.reduce((sum, m) => sum + (m[metricKey] as number), 0) / lastWeekMetrics.length
    
    const change = thisWeekAvg - lastWeekAvg
    const changePercent = lastWeekAvg > 0 ? (change / lastWeekAvg) * 100 : 0
    
    return {
      current: thisWeekAvg,
      previous: lastWeekAvg,
      change,
      changePercent,
    }
  }
  
  return null
}

/**
 * Get all workout metrics for a list of workouts
 */
export function getAllWorkoutMetrics(workouts: Workout[]): WorkoutMetrics[] {
  return workouts.map(computeWorkoutMetrics)
}

/**
 * Get chart data for volume trend
 */
export function getVolumeTrendData(metrics: WorkoutMetrics[], compareMode: CompareMode) {
  // Sort by date ascending for chart
  const sorted = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  const chartData = sorted.map(m => ({
    label: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: m.totalVolume,
    date: m.date,
  }))
  
  // Calculate comparison line data
  let comparisonData: { label: string; value: number }[] | null = null
  
  if (compareMode === 'last-vs-average' && sorted.length > 1) {
    const sessionsToAverage = Math.min(5, sorted.length - 1)
    const previousSessions = sorted.slice(0, sorted.length - 1).slice(-sessionsToAverage)
    const average = previousSessions.reduce((sum, m) => sum + m.totalVolume, 0) / previousSessions.length
    
    comparisonData = chartData.map(d => ({
      label: d.label,
      value: average,
    }))
  } else if (compareMode === 'week-over-week' && sorted.length > 0) {
    // For week-over-week, we'll show last week's average as a line
    const lastWeekStart = subWeeks(startOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    const lastWeekEnd = subWeeks(endOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    
    const lastWeekMetrics = sorted.filter(m =>
      isWithinInterval(m.date, { start: lastWeekStart, end: lastWeekEnd })
    )
    
    if (lastWeekMetrics.length > 0) {
      const lastWeekAvg = lastWeekMetrics.reduce((sum, m) => sum + m.totalVolume, 0) / lastWeekMetrics.length
      comparisonData = chartData.map(d => ({
        label: d.label,
        value: lastWeekAvg,
      }))
    }
  }
  
  return { chartData, comparisonData }
}

/**
 * Get chart data for intensity
 */
export function getIntensityData(metrics: WorkoutMetrics[], compareMode: CompareMode) {
  const sorted = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  const chartData = sorted.map(m => ({
    label: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: m.intensity,
    date: m.date,
    sets: m.totalSets, // Keep sets for potential bar overlay
  }))
  
  let comparisonData: { label: string; value: number }[] | null = null
  
  if (compareMode === 'last-vs-average' && sorted.length > 1) {
    const sessionsToAverage = Math.min(5, sorted.length - 1)
    const previousSessions = sorted.slice(0, sorted.length - 1).slice(-sessionsToAverage)
    const average = previousSessions.reduce((sum, m) => sum + m.intensity, 0) / previousSessions.length
    
    comparisonData = chartData.map(d => ({
      label: d.label,
      value: average,
    }))
  } else if (compareMode === 'week-over-week' && sorted.length > 0) {
    const lastWeekStart = subWeeks(startOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    const lastWeekEnd = subWeeks(endOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    
    const lastWeekMetrics = sorted.filter(m =>
      isWithinInterval(m.date, { start: lastWeekStart, end: lastWeekEnd })
    )
    
    if (lastWeekMetrics.length > 0) {
      const lastWeekAvg = lastWeekMetrics.reduce((sum, m) => sum + m.intensity, 0) / lastWeekMetrics.length
      comparisonData = chartData.map(d => ({
        label: d.label,
        value: lastWeekAvg,
      }))
    }
  }
  
  return { chartData, comparisonData }
}

/**
 * Get chart data for density
 */
export function getDensityData(metrics: WorkoutMetrics[], compareMode: CompareMode) {
  const sorted = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  const chartData = sorted.map(m => ({
    label: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: m.volumePerMinute,
    date: m.date,
    duration: m.duration, // Keep duration for overlay
  }))
  
  let comparisonData: { label: string; value: number }[] | null = null
  
  if (compareMode === 'last-vs-average' && sorted.length > 1) {
    const sessionsToAverage = Math.min(5, sorted.length - 1)
    const previousSessions = sorted.slice(0, sorted.length - 1).slice(-sessionsToAverage)
    const average = previousSessions.reduce((sum, m) => sum + m.volumePerMinute, 0) / previousSessions.length
    
    comparisonData = chartData.map(d => ({
      label: d.label,
      value: average,
    }))
  } else if (compareMode === 'week-over-week' && sorted.length > 0) {
    const lastWeekStart = subWeeks(startOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    const lastWeekEnd = subWeeks(endOfWeek(sorted[sorted.length - 1].date, { weekStartsOn: 0 }), 1)
    
    const lastWeekMetrics = sorted.filter(m =>
      isWithinInterval(m.date, { start: lastWeekStart, end: lastWeekEnd })
    )
    
    if (lastWeekMetrics.length > 0) {
      const lastWeekAvg = lastWeekMetrics.reduce((sum, m) => sum + m.volumePerMinute, 0) / lastWeekMetrics.length
      comparisonData = chartData.map(d => ({
        label: d.label,
        value: lastWeekAvg,
      }))
    }
  }
  
  return { chartData, comparisonData }
}

/**
 * Get chart data for intensity vs sets scatter plot
 */
export function getIntensitySetsData(metrics: WorkoutMetrics[]) {
  return metrics.map(m => ({
    intensity: m.intensity,
    sets: m.totalSets,
    date: m.date,
    volume: m.totalVolume,
    dateLabel: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))
}

/**
 * Get chart data for duration/density
 */
export function getDurationDensityData(metrics: WorkoutMetrics[], _compareMode: CompareMode) {
  const sorted = [...metrics].sort((a, b) => a.date.getTime() - b.date.getTime())
  
  const chartData = sorted.map(m => ({
    date: m.date,
    duration: m.duration,
    density: m.volumePerMinute,
    volume: m.totalVolume,
    dateLabel: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))
  
  return { chartData }
}


// ── Home screen summaries ──

export interface WeeklyProgress {
  completed: number
  goal: number
  /** Consecutive weeks (including this one if already met) that hit the goal */
  streakWeeks: number
}

function countCompletedInWeek(workouts: Workout[], weekStart: Date): number {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  return workouts.filter((workout) => {
    if (!workout.completed) return false
    const date = toDateSafe(workout.date)
    return !!date && isWithinInterval(date, { start: startOfWeek(weekStart, { weekStartsOn: 0 }), end: weekEnd })
  }).length
}

export function getWeeklyProgress(workouts: Workout[], goal: number, now: Date = new Date()): WeeklyProgress {
  const thisWeek = startOfWeek(now, { weekStartsOn: 0 })
  const completed = countCompletedInWeek(workouts, thisWeek)

  // Count back week by week; the current week only breaks the streak once it's over
  let streakWeeks = 0
  let cursor = completed >= goal ? thisWeek : subWeeks(thisWeek, 1)
  while (countCompletedInWeek(workouts, cursor) >= goal) {
    streakWeeks++
    cursor = subWeeks(cursor, 1)
  }

  return { completed, goal, streakWeeks }
}

export interface MuscleGroupVolume {
  muscleGroup: string
  sets: number
}

/** Completed sets per muscle group over the last `days` days, most trained first */
export function getSetsPerMuscleGroup(
  workouts: Workout[],
  days: number = 7,
  now: Date = new Date()
): MuscleGroupVolume[] {
  const since = startOfDay(subDays(now, days - 1))
  const counts = new Map<string, number>()

  for (const workout of workouts) {
    const date = toDateSafe(workout.date)
    if (!workout.completed || !date || date < since) continue

    for (const exercise of workout.exercises) {
      const group = exercise.exercise.muscleGroup?.trim()
      if (!group) continue
      const sets = exercise.sets.filter((set) => set.completed).length
      if (sets > 0) counts.set(group, (counts.get(group) ?? 0) + sets)
    }
  }

  return [...counts.entries()]
    .map(([muscleGroup, sets]) => ({ muscleGroup, sets }))
    .sort((a, b) => b.sets - a.sets)
}

export interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  date: Date
}

/**
 * Personal records set in the last `days` days. An exercise counts only once it
 * has been trained in more than one session, so a first attempt is not a "record".
 */
export function getRecentPersonalRecords(
  workouts: Workout[],
  days: number = 14,
  now: Date = new Date()
): PersonalRecord[] {
  const since = startOfDay(subDays(now, days - 1))
  const best = new Map<string, PersonalRecord>()
  const sessionCount = new Map<string, number>()

  const dated = workouts
    .filter((workout) => workout.completed)
    .map((workout) => ({ workout, date: toDateSafe(workout.date) }))
    .filter((entry): entry is { workout: Workout; date: Date } => !!entry.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const { workout, date } of dated) {
    for (const exercise of workout.exercises) {
      const name = exercise.exercise.name
      const key = name.toLowerCase()
      const topSet = exercise.sets
        .filter((set) => set.completed && set.weight > 0 && set.reps > 0)
        .reduce<{ weight: number; reps: number } | null>(
          (top, set) => (!top || set.weight > top.weight ? { weight: set.weight, reps: set.reps } : top),
          null
        )
      if (!topSet) continue

      sessionCount.set(key, (sessionCount.get(key) ?? 0) + 1)
      const current = best.get(key)
      if (!current || topSet.weight > current.weight) {
        best.set(key, { exerciseName: name, weight: topSet.weight, reps: topSet.reps, date })
      }
    }
  }

  return [...best.entries()]
    .filter(([key, record]) => (sessionCount.get(key) ?? 0) > 1 && record.date >= since)
    .map(([, record]) => record)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
