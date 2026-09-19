import { Dumbbell, Flame, Activity, ChevronsUp, ChevronsDown, type LucideIcon } from 'lucide-react'
import type { WorkoutType } from '../types'

export interface WorkoutTypeInfo {
  id: WorkoutType
  /** Full title, e.g. "Push Day" */
  name: string
  /** Short label for chips and filters, e.g. "Push" */
  shortName: string
  description: string
  Icon: LucideIcon
  /** Badge / chip colors */
  badgeClass: string
  /** Soft background used in the quick-start modal */
  softBgClass: string
  /** Icon circle */
  iconClass: string
  /** Filled day in the weekly strip */
  tintClass: string
  /** Solid fill for charts */
  barClass: string
}

/**
 * Training split in rotation order: Push → Pull → Legs → Upper → Lower, then repeat.
 */
export const WORKOUT_TYPES: WorkoutTypeInfo[] = [
  {
    id: 'push',
    name: 'Push Day',
    shortName: 'Push',
    description: 'Chest, Shoulders, Triceps',
    Icon: Dumbbell,
    badgeClass: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    softBgClass: 'bg-[var(--accent-soft-blue)]',
    iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
    tintClass: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    barClass: 'bg-blue-500',
  },
  {
    id: 'pull',
    name: 'Pull Day',
    shortName: 'Pull',
    description: 'Back, Biceps, Rear Delts',
    Icon: Flame,
    badgeClass: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    softBgClass: 'bg-[var(--accent-soft-green)]',
    iconClass: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
    tintClass: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
    barClass: 'bg-green-500',
  },
  {
    id: 'legs',
    name: 'Legs Day',
    shortName: 'Legs',
    description: 'Quads, Hamstrings, Calves',
    Icon: Activity,
    badgeClass: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    softBgClass: 'bg-[var(--accent-soft-purple)]',
    iconClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
    tintClass: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
    barClass: 'bg-purple-500',
  },
  {
    id: 'upper',
    name: 'Upper Day',
    shortName: 'Upper',
    description: 'Back, Chest, Shoulders, Arms',
    Icon: ChevronsUp,
    badgeClass: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    softBgClass: 'bg-orange-50 dark:bg-orange-900/30',
    iconClass: 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-300',
    tintClass: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300',
    barClass: 'bg-orange-500',
  },
  {
    id: 'lower',
    name: 'Lower Day',
    shortName: 'Lower',
    description: 'Glutes, Hamstrings, Quads, Calves',
    Icon: ChevronsDown,
    badgeClass: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
    softBgClass: 'bg-teal-50 dark:bg-teal-900/30',
    iconClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300',
    tintClass: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
    barClass: 'bg-teal-500',
  },
]

export const WORKOUT_TYPE_INFO = Object.fromEntries(
  WORKOUT_TYPES.map((info) => [info.id, info])
) as Record<WorkoutType, WorkoutTypeInfo>

/** Next workout in the rotation after the given one (Lower wraps back to Push) */
export function getNextWorkoutType(lastType: WorkoutType | null | undefined): WorkoutType {
  if (!lastType) return WORKOUT_TYPES[0].id
  const index = WORKOUT_TYPES.findIndex((info) => info.id === lastType)
  return WORKOUT_TYPES[(index + 1) % WORKOUT_TYPES.length].id
}
