export type BodyPart = 'chest' | 'back' | 'shoulder' | 'arms' | 'abs' | 'legs' | 'fullBody';

export interface BodyPartInfo {
  id: BodyPart;
  name: string;
  englishName: string;
  icon: string;
  description: string;
  color: string;
}

export type EquipmentCategory = 
  | 'bodyweight' 
  | 'dumbbell' 
  | 'barbell' 
  | 'kettlebell' 
  | 'band' 
  | 'pullup_bar' 
  | 'bench' 
  | 'foam_roller' 
  | 'yoga_mat' 
  | 'jump_rope' 
  | 'other';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  imageUrl?: string;
  createdAt: string;
  description?: string;
  isCustom?: boolean;
  targetParts?: BodyPart[];
}

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type FitnessGoal = 'strength' | 'hypertrophy' | 'endurance' | 'diet' | 'health';

export interface Exercise {
  id: string;
  name: string;
  englishName?: string;
  targetPart: BodyPart;
  secondaryParts?: BodyPart[];
  requiredEquipment: EquipmentCategory[];
  difficulty: Difficulty;
  defaultSets: number;
  defaultReps: number;
  defaultDurationSec?: number;
  defaultRestSec: number;
  guide: string[];
  tips: string[];
  cautions?: string[];
  caloriesPerMinute: number;
  iconName?: string;
}

export interface WorkoutExerciseItem {
  exerciseId: string;
  exercise: Exercise;
  sets: number;
  reps: number;
  targetWeightKg?: number;
  durationSec?: number;
  restSec: number;
  completedSets: number;
  isCompleted: boolean;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  description: string;
  targetParts: BodyPart[];
  targetDurationMinutes: number;
  difficulty: Difficulty;
  exercises: WorkoutExerciseItem[];
  createdAt: string;
  isCustom?: boolean;
  estimatedCalories: number;
}

export interface WorkoutLog {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime: string; // ISO string
  durationMinutes: number;
  routineTitle: string;
  targetParts: BodyPart[];
  completedExercises: {
    name: string;
    targetPart: BodyPart;
    completedSets: number;
    totalSets: number;
    reps: number;
  }[];
  totalSetsCompleted: number;
  totalCalories: number;
  notes?: string;
  equipmentUsed: string[];
}

export interface UserSettings {
  userName: string;
  fitnessGoal: FitnessGoal;
  defaultDifficulty: Difficulty;
  defaultDurationMinutes: number;
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'dark' | 'light';
}
