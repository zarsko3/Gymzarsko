import type { Exercise } from '../types'
import { mockExercises } from '../services/mockData'

export interface LibraryExercise {
  id: string
  name: string
  muscleGroup: string
  repRange?: string
  /** Where it came from: the built-in library or something the user created */
  source: 'program' | 'library' | 'custom'
}

/** Muscle groups used across the app, in the order they're offered when creating an exercise */
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Front Delts',
  'Side Delts',
  'Rear Delts',
  'Traps',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
] as const

/** Alternatives that aren't part of the default program */
const ALTERNATIVES: Omit<LibraryExercise, 'source'>[] = [
  // Chest
  { id: 'alt-chest-1', name: 'Incline Barbell Bench Press', muscleGroup: 'Chest', repRange: '6-8' },
  { id: 'alt-chest-2', name: 'Smith Machine Bench Press', muscleGroup: 'Chest', repRange: '8-10' },
  { id: 'alt-chest-3', name: 'Weighted Dips (chest lean)', muscleGroup: 'Chest', repRange: '8-10' },
  { id: 'alt-chest-4', name: 'Push-Ups', muscleGroup: 'Chest', repRange: '12-20' },
  { id: 'alt-chest-5', name: 'Cable Fly (high to low)', muscleGroup: 'Chest', repRange: '12-15' },
  { id: 'alt-chest-6', name: 'Cable Fly (low to high)', muscleGroup: 'Chest', repRange: '12-15' },
  { id: 'alt-chest-7', name: 'Pec Deck', muscleGroup: 'Chest', repRange: '12-15' },
  // Back
  { id: 'alt-back-1', name: 'Seated Cable Row', muscleGroup: 'Back', repRange: '8-12' },
  { id: 'alt-back-2', name: 'Barbell Row', muscleGroup: 'Back', repRange: '6-8' },
  { id: 'alt-back-3', name: 'Pull-Ups', muscleGroup: 'Back', repRange: '6-10' },
  { id: 'alt-back-4', name: 'Close-Grip Lat Pulldown', muscleGroup: 'Back', repRange: '8-12' },
  { id: 'alt-back-5', name: 'Single-Arm Cable Row', muscleGroup: 'Back', repRange: '10-12' },
  { id: 'alt-back-6', name: 'Straight-Arm Pulldown', muscleGroup: 'Back', repRange: '12-15' },
  { id: 'alt-back-7', name: 'Machine Row', muscleGroup: 'Back', repRange: '8-12' },
  // Shoulders
  { id: 'alt-fdelt-1', name: 'Seated Dumbbell Shoulder Press', muscleGroup: 'Front Delts', repRange: '8-10' },
  { id: 'alt-fdelt-2', name: 'Standing Barbell Overhead Press', muscleGroup: 'Front Delts', repRange: '6-8' },
  { id: 'alt-fdelt-3', name: 'Landmine Press', muscleGroup: 'Front Delts', repRange: '8-12' },
  { id: 'alt-fdelt-4', name: 'Front Raises', muscleGroup: 'Front Delts', repRange: '12-15' },
  { id: 'alt-sdelt-1', name: 'Machine Lateral Raise', muscleGroup: 'Side Delts', repRange: '12-15' },
  { id: 'alt-sdelt-2', name: 'Lean-Away Dumbbell Lateral Raise', muscleGroup: 'Side Delts', repRange: '12-15' },
  { id: 'alt-sdelt-3', name: 'Wide-Grip Upright Row', muscleGroup: 'Side Delts', repRange: '10-12' },
  { id: 'alt-rdelt-1', name: 'Reverse Pec Deck', muscleGroup: 'Rear Delts', repRange: '12-15' },
  { id: 'alt-rdelt-2', name: 'Rear Delt Dumbbell Fly', muscleGroup: 'Rear Delts', repRange: '12-15' },
  { id: 'alt-rdelt-3', name: 'Cable Rear Delt Fly', muscleGroup: 'Rear Delts', repRange: '12-15' },
  { id: 'alt-traps-1', name: 'Barbell Shrugs', muscleGroup: 'Traps', repRange: '10-12' },
  { id: 'alt-traps-2', name: 'Cable Shrugs', muscleGroup: 'Traps', repRange: '12-15' },
  // Arms
  { id: 'alt-bi-1', name: 'Preacher Curl', muscleGroup: 'Biceps', repRange: '8-12' },
  { id: 'alt-bi-2', name: 'Barbell Curl', muscleGroup: 'Biceps', repRange: '8-10' },
  { id: 'alt-bi-3', name: 'Bayesian Cable Curl', muscleGroup: 'Biceps', repRange: '10-12' },
  { id: 'alt-bi-4', name: 'Concentration Curl', muscleGroup: 'Biceps', repRange: '10-12' },
  { id: 'alt-bi-5', name: 'Spider Curl', muscleGroup: 'Biceps', repRange: '10-12' },
  { id: 'alt-tri-1', name: 'Close-Grip Bench Press', muscleGroup: 'Triceps', repRange: '6-8' },
  { id: 'alt-tri-2', name: 'Rope Pushdown', muscleGroup: 'Triceps', repRange: '10-12' },
  { id: 'alt-tri-3', name: 'Overhead Dumbbell Triceps Extension', muscleGroup: 'Triceps', repRange: '10-12' },
  { id: 'alt-tri-4', name: 'Bench Dips', muscleGroup: 'Triceps', repRange: '10-15' },
  { id: 'alt-tri-5', name: 'Cable Kickbacks', muscleGroup: 'Triceps', repRange: '12-15' },
  // Legs
  { id: 'alt-quad-1', name: 'Hack Squat', muscleGroup: 'Quads', repRange: '8-10' },
  { id: 'alt-quad-2', name: 'Front Squat', muscleGroup: 'Quads', repRange: '6-8' },
  { id: 'alt-quad-3', name: 'Goblet Squat', muscleGroup: 'Quads', repRange: '10-12' },
  { id: 'alt-quad-4', name: 'Walking Lunges', muscleGroup: 'Quads', repRange: '10-12 / leg' },
  { id: 'alt-quad-5', name: 'Smith Machine Squat', muscleGroup: 'Quads', repRange: '8-10' },
  { id: 'alt-ham-1', name: 'Seated Leg Curl', muscleGroup: 'Hamstrings', repRange: '10-12' },
  { id: 'alt-ham-2', name: 'Lying Leg Curl', muscleGroup: 'Hamstrings', repRange: '10-12' },
  { id: 'alt-ham-3', name: 'Stiff-Leg Dumbbell Deadlift', muscleGroup: 'Hamstrings', repRange: '8-10' },
  { id: 'alt-ham-4', name: 'Good Morning', muscleGroup: 'Hamstrings', repRange: '8-10' },
  { id: 'alt-glute-1', name: 'Glute Bridge', muscleGroup: 'Glutes', repRange: '10-12' },
  { id: 'alt-glute-2', name: 'Cable Pull-Through', muscleGroup: 'Glutes', repRange: '12-15' },
  { id: 'alt-glute-3', name: 'Hip Abduction Machine', muscleGroup: 'Glutes', repRange: '12-15' },
  { id: 'alt-glute-4', name: 'Step-Ups', muscleGroup: 'Glutes', repRange: '10-12 / leg' },
  { id: 'alt-calf-1', name: 'Leg Press Calf Raise', muscleGroup: 'Calves', repRange: '12-15' },
  { id: 'alt-calf-2', name: 'Single-Leg Calf Raise', muscleGroup: 'Calves', repRange: '12-15' },
  // Core
  { id: 'alt-core-1', name: 'Ab Wheel Rollout', muscleGroup: 'Core', repRange: '8-12' },
  { id: 'alt-core-2', name: 'Hanging Knee Raise', muscleGroup: 'Core', repRange: '12-15' },
  { id: 'alt-core-3', name: 'Pallof Press', muscleGroup: 'Core', repRange: '10-12 / side' },
  { id: 'alt-core-4', name: 'Decline Crunch', muscleGroup: 'Core', repRange: '12-15' },
]

/** Three short form cues per exercise, keyed by exercise id */
const CUES: Record<string, [string, string, string]> = {
  // Push program
  'push-1': ['Shoulder blades pinched and down', 'Bar to lower chest, elbows ~45°', 'Drive feet into the floor as you press'],
  'push-2': ['Back flat against the pad', 'Handles start at chin height', 'Press up without locking out hard'],
  'push-3': ['Bench at 30°, not steeper', 'Lower to upper chest with a stretch', 'Press up and slightly in'],
  'push-4': ['Slight lean forward, soft elbows', 'Lead with the elbows, not the hands', 'Stop at shoulder height, lower slowly'],
  'push-5': ['Elbows pinned to your sides', 'Full lockout at the bottom', 'Control the way up'],
  'push-6': ['Upper arms angled slightly back', 'Lower behind the forehead', 'Only the elbows move'],
  'push-7': ['Seat so handles line up with mid-chest', 'Keep shoulders back on the pad', 'Pause briefly at the stretch'],
  // Pull program
  'pull-1': ['Lean back slightly, chest up', 'Pull elbows down toward your hips', 'Bar to upper chest, control up'],
  'pull-2': ['Flat back, hand on the bench', 'Pull the elbow toward your hip', "Don't twist the torso"],
  'pull-3': ['Rope at face height', 'Pull to the forehead, elbows high', 'Rotate hands out at the end'],
  'pull-4': ['Stand tall, arms straight', 'Shrug straight up toward the ears', 'Hold a second at the top'],
  'pull-5': ['Elbows stay by your sides', 'Squeeze hard at the top', 'Lower all the way down'],
  'pull-6': ['Grip the angled part of the bar', 'No swinging from the hips', '2–3 seconds on the way down'],
  'pull-7': ['Bench at 60°, arms hang straight', 'Palms up the whole time', 'Full stretch at the bottom'],
  // Legs program
  'legs-1': ['Pad just above the ankles', 'Squeeze the quads at the top', "Lower slowly, don't let it drop"],
  'legs-2': ['Brace your core before you descend', 'Knees track over the toes', 'Hips below parallel if mobility allows'],
  'legs-3': ['Soft knees, push hips back', 'Bar stays against your legs', 'Stop when you feel the stretch'],
  'legs-4': ['Hips pressed into the pad', 'Curl all the way', 'Slow on the way back'],
  'legs-5': ['Full stretch at the bottom', 'Rise onto the big toe', 'Pause at the top'],
  'legs-6': ['Ribs down, glutes tight', 'No sagging or piking', 'Breathe steadily'],
  // Upper program
  'upper-1': ['Start from a dead hang', 'Chest to the bar, not chin', 'Control the way down'],
  'upper-2': ['Dumbbells start over the chest', 'Lower until you feel a stretch', 'Press up in a slight arc'],
  'upper-3': ['Chest glued to the pad', 'Drive elbows back past the torso', 'Squeeze the shoulder blades'],
  'upper-4': ['Start with palms facing you', 'Rotate as you press up', 'Reverse the rotation on the way down'],
  'upper-5': ['Cable from the opposite side', 'Raise out to the side, not forward', 'Slow lowering, keep tension'],
  'upper-6': ['Palms face each other', 'Elbows stay still', 'Squeeze at the top'],
  'upper-7': ['Face away from the cable', 'Elbows stay pointed forward', 'Full stretch behind the head'],
  // Lower program
  'lower-1': ['Bar over mid-foot, brace hard', 'Push the floor away', 'Hips and shoulders rise together'],
  'lower-2': ['Back foot on the bench, front foot far out', 'Drop straight down', 'Drive through the front heel'],
  'lower-3': ['Feet shoulder width, mid-platform', 'Lower until hips start to tuck', "Don't lock the knees at the top"],
  'lower-4': ['Upper back on the bench, bar on the hips', 'Chin tucked, ribs down', 'Squeeze glutes hard at the top'],
  'lower-5': ['Hips straight, body in one line', 'Lower as slowly as you can', 'Push off the floor to come back up'],
  'lower-6': ['Pad on the lower thighs', 'Full stretch at the bottom', 'Pause at the top'],
  'lower-7': ['Kneel, rope behind the head', 'Curl the ribs toward the hips', "Hips don't move"],
  // Alternatives
  'alt-chest-1': ['Bench at 30°', 'Bar to the upper chest', 'Shoulder blades back and down'],
  'alt-chest-2': ['Set the bar over the lower chest', 'Elbows at ~45°', 'Controlled touch, press up'],
  'alt-chest-3': ['Lean the torso forward', 'Lower until shoulders are below elbows', "Press up, don't swing"],
  'alt-chest-4': ['Body in one straight line', 'Chest to the floor', 'Elbows at ~45°'],
  'alt-chest-5': ['Pulleys set high', 'Slight bend in the elbows', 'Hands meet at hip height'],
  'alt-chest-6': ['Pulleys set low', 'Sweep up to shoulder height', 'Squeeze the upper chest'],
  'alt-chest-7': ['Handles at chest height', 'Slight bend in the elbows', 'Squeeze, then slow return'],
  'alt-back-1': ['Sit tall, slight knee bend', 'Pull to the belly button', "Don't rock the torso"],
  'alt-back-2': ['Hinge to ~45°, flat back', 'Pull the bar to the lower ribs', 'Control the bar down'],
  'alt-back-3': ['Start from a dead hang', 'Pull the chest to the bar', 'Full stretch at the bottom'],
  'alt-back-4': ['Close neutral grip', 'Elbows down and back', 'Stretch fully at the top'],
  'alt-back-5': ['Stagger stance, brace', 'Pull the elbow past the torso', 'Let the shoulder reach at the stretch'],
  'alt-back-6': ['Arms nearly straight', 'Sweep the bar to the thighs', 'Feel the lats, not the triceps'],
  'alt-back-7': ['Chest on the pad', 'Pull elbows back', 'Squeeze the shoulder blades'],
  'alt-fdelt-1': ['Back supported, core tight', 'Dumbbells start at ear height', 'Press up and slightly in'],
  'alt-fdelt-2': ['Glutes and core tight', 'Bar path close to the face', 'Head through at the top'],
  'alt-fdelt-3': ['Staggered stance', 'Press up and forward', 'Control back to the shoulder'],
  'alt-fdelt-4': ['Slight bend in the elbows', 'Raise to eye level', 'No swinging'],
  'alt-sdelt-1': ['Pads on the outer arms', 'Lead with the elbows', 'Pause at the top'],
  'alt-sdelt-2': ['Hold a post and lean away', 'Raise out to the side', 'Slow on the way down'],
  'alt-sdelt-3': ['Grip wider than shoulders', 'Pull elbows up and out', 'Stop at chest height'],
  'alt-rdelt-1': ['Face the pad, handles at shoulder height', 'Sweep the arms back', "Don't shrug"],
  'alt-rdelt-2': ['Hinge forward, flat back', 'Raise out to the sides', 'Lead with the pinkies'],
  'alt-rdelt-3': ['Cross the cables at shoulder height', 'Pull the arms out and back', 'Keep elbows soft'],
  'alt-traps-1': ['Grip just outside the thighs', 'Shrug straight up', 'Hold a second at the top'],
  'alt-traps-2': ['Cable from low pulleys', 'Shrug up toward the ears', 'Slow lowering'],
  'alt-bi-1': ['Armpits snug to the pad', 'Full stretch at the bottom', "Don't lift the elbows"],
  'alt-bi-2': ['Shoulder-width grip', 'Elbows by your sides', 'No hip swing'],
  'alt-bi-3': ['Face away from the low cable', 'Arm starts behind the body', 'Curl without moving the elbow'],
  'alt-bi-4': ['Elbow on the inner thigh', 'Curl toward the shoulder', 'Squeeze and lower slowly'],
  'alt-bi-5': ['Chest on an incline bench', 'Arms hang straight down', 'Curl without swinging'],
  'alt-tri-1': ['Hands shoulder width', 'Elbows tucked close', 'Bar to the lower chest'],
  'alt-tri-2': ['Elbows pinned', 'Spread the rope at the bottom', 'Control the way up'],
  'alt-tri-3': ['One dumbbell, both hands', 'Lower behind the head', 'Elbows point up'],
  'alt-tri-4': ['Hands on the bench edge', 'Lower until elbows hit 90°', 'Press through the palms'],
  'alt-tri-5': ['Hinge forward, upper arm still', 'Extend straight back', 'Squeeze at lockout'],
  'alt-quad-1': ['Back flat on the pad', 'Lower deep with control', 'Drive through the whole foot'],
  'alt-quad-2': ['Elbows high, bar on the shoulders', 'Stay upright', 'Knees forward over the toes'],
  'alt-quad-3': ['Hold the weight at the chest', 'Sit between the heels', 'Elbows inside the knees'],
  'alt-quad-4': ['Long step, torso tall', 'Back knee toward the floor', 'Push through the front heel'],
  'alt-quad-5': ['Feet slightly forward', 'Lower under control', 'Drive up through the heels'],
  'alt-ham-1': ['Thigh pad locked down', 'Curl all the way', 'Slow on the way back'],
  'alt-ham-2': ['Hips pressed into the bench', 'Curl to full contraction', 'Control the lowering'],
  'alt-ham-3': ['Legs nearly straight', 'Hinge at the hips', 'Dumbbells close to the legs'],
  'alt-ham-4': ['Bar on the upper back', 'Push hips back, soft knees', 'Flat back throughout'],
  'alt-glute-1': ['Feet close to the glutes', 'Drive hips up through the heels', 'Squeeze at the top'],
  'alt-glute-2': ['Face away from the low cable', 'Hinge back, rope between legs', 'Snap hips forward'],
  'alt-glute-3': ['Sit tall or lean slightly forward', 'Push knees out', 'Slow return'],
  'alt-glute-4': ['Box at knee height', 'Drive through the top foot', "Don't push off the back leg"],
  'alt-calf-1': ['Balls of the feet on the platform edge', 'Full stretch at the bottom', 'Knees stay straight'],
  'alt-calf-2': ['Hold something for balance', 'Full range of motion', 'Pause at the top'],
  'alt-core-1': ['Start on the knees', 'Roll out with a flat back', 'Pull back with the abs'],
  'alt-core-2': ['Dead hang, no swinging', 'Knees to the chest', 'Lower slowly'],
  'alt-core-3': ['Side-on to the cable', 'Press straight out', "Don't let it rotate you"],
  'alt-core-4': ['Feet anchored', 'Curl up, ribs to hips', 'Lower slowly'],
}

function fromProgram(exercise: Exercise): LibraryExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    repRange: exercise.repRange,
    source: 'program',
  }
}

/** Everything built in: the program's exercises plus the alternatives */
export const BUILT_IN_EXERCISES: LibraryExercise[] = [
  ...mockExercises.map(fromProgram),
  ...ALTERNATIVES.map((exercise) => ({ ...exercise, source: 'library' as const })),
]

const normalize = (name: string) => name.trim().toLowerCase()

export function findBuiltInExercise(idOrName: string): LibraryExercise | undefined {
  const key = normalize(idOrName)
  return BUILT_IN_EXERCISES.find((exercise) => exercise.id === idOrName || normalize(exercise.name) === key)
}

/** Form cues for an exercise, looked up by id first and then by name */
export function getExerciseCues(id: string, name: string): string[] | null {
  const byId = CUES[id]
  if (byId) return byId
  const builtIn = findBuiltInExercise(name)
  return builtIn ? CUES[builtIn.id] ?? null : null
}

/** YouTube search for good form videos; works for any exercise, including custom ones */
export function getHowToVideoUrl(name: string): string {
  const cleaned = name.replace(/\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${cleaned} proper form`)}`
}

/**
 * Exercises that can stand in for one that trains the given muscle group.
 * Custom exercises from the user's library are included.
 */
export function getAlternatives(
  muscleGroup: string,
  customExercises: LibraryExercise[],
  exclude: Set<string> = new Set()
): LibraryExercise[] {
  const group = normalize(muscleGroup)
  const seen = new Set<string>()
  return [...BUILT_IN_EXERCISES, ...customExercises].filter((exercise) => {
    const key = normalize(exercise.name)
    if (normalize(exercise.muscleGroup) !== group || exclude.has(key) || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Library search by name or muscle group, built-in and custom exercises together */
export function searchExercises(queryText: string, customExercises: LibraryExercise[]): LibraryExercise[] {
  const q = normalize(queryText)
  const seen = new Set<string>()
  return [...customExercises, ...BUILT_IN_EXERCISES]
    .filter((exercise) => {
      const key = normalize(exercise.name)
      if (seen.has(key)) return false
      seen.add(key)
      return !q || key.includes(q) || normalize(exercise.muscleGroup).includes(q)
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** "landmine row" -> "Landmine Row"; names typed with capitals are left alone */
export function formatExerciseName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (trimmed !== trimmed.toLowerCase()) return trimmed
  return trimmed.replace(/(^|[\s(/-])(\p{L})/gu, (_, before: string, letter: string) => before + letter.toUpperCase())
}
