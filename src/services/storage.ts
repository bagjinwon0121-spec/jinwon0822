import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, WorkoutLog, UserSettings, WorkoutRoutine } from '../types';
import { PRESET_EQUIPMENTS, INITIAL_USER_EQUIPMENT_IDS } from '../data/presetEquipments';

const KEYS = {
  USER_EQUIPMENTS: '@fit_user_equipments',
  WORKOUT_LOGS: '@fit_workout_logs',
  USER_SETTINGS: '@fit_user_settings',
  LAST_ROUTINE: '@fit_last_routine',
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: '홈트마스터',
  fitnessGoal: 'hypertrophy',
  defaultDifficulty: 'intermediate',
  defaultDurationMinutes: 30,
  defaultRestSeconds: 60,
  soundEnabled: true,
  vibrationEnabled: true,
  theme: 'dark',
};

// Seed sample logs so the history calendar and charts immediately look great
const SAMPLE_LOGS: WorkoutLog[] = [
  {
    id: 'log_seed_1',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    startTime: new Date(Date.now() - 86400000 * 2 - 1800000).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    durationMinutes: 28,
    routineTitle: '가슴 & 삼두 파워 버닝',
    targetParts: ['chest', 'arms'],
    completedExercises: [
      { name: '스탠다드 푸쉬업', targetPart: 'chest', completedSets: 4, totalSets: 4, reps: 15 },
      { name: '덤벨 플로어/벤치 프레스', targetPart: 'chest', completedSets: 4, totalSets: 4, reps: 12 },
      { name: '체어/벤치 딥스 (삼두근)', targetPart: 'arms', completedSets: 3, totalSets: 3, reps: 12 },
    ],
    totalSetsCompleted: 11,
    totalCalories: 210,
    equipmentUsed: ['맨몸 (기본)', '덤벨 / 아령'],
  },
  {
    id: 'log_seed_2',
    date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    startTime: new Date(Date.now() - 86400000 * 4 - 2400000).toISOString(),
    endTime: new Date(Date.now() - 86400000 * 4).toISOString(),
    durationMinutes: 35,
    routineTitle: '하체 & 코어 폭파 루틴',
    targetParts: ['legs', 'abs'],
    completedExercises: [
      { name: '스탠다드 스쿼트 (대퇴사두 & 둔근)', targetPart: 'legs', completedSets: 4, totalSets: 4, reps: 20 },
      { name: '덤벨 고블렛 스쿼트', targetPart: 'legs', completedSets: 4, totalSets: 4, reps: 12 },
      { name: '스탠다드 플랭크 (코어)', targetPart: 'abs', completedSets: 3, totalSets: 3, reps: 1 },
      { name: '크런치 (상복부)', targetPart: 'abs', completedSets: 4, totalSets: 4, reps: 20 },
    ],
    totalSetsCompleted: 15,
    totalCalories: 295,
    equipmentUsed: ['맨몸 (기본)', '덤벨 / 아령', '요가 / 홈트 매트'],
  },
];

export const StorageService = {
  // 1. Equipments
  async getUserEquipments(): Promise<Equipment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_EQUIPMENTS);
      if (data) {
        return JSON.parse(data);
      }
      // Initial seed
      const initial = PRESET_EQUIPMENTS.filter(e => INITIAL_USER_EQUIPMENT_IDS.includes(e.id));
      await AsyncStorage.setItem(KEYS.USER_EQUIPMENTS, JSON.stringify(initial));
      return initial;
    } catch (e) {
      console.error('Error fetching user equipments:', e);
      return PRESET_EQUIPMENTS.filter(e => INITIAL_USER_EQUIPMENT_IDS.includes(e.id));
    }
  },

  async saveUserEquipments(equipments: Equipment[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_EQUIPMENTS, JSON.stringify(equipments));
    } catch (e) {
      console.error('Error saving user equipments:', e);
    }
  },

  async addEquipment(equipment: Equipment): Promise<Equipment[]> {
    const current = await this.getUserEquipments();
    // Check if duplicate category exists
    const exists = current.some(e => e.id === equipment.id || (e.name.toLowerCase() === equipment.name.toLowerCase()));
    if (!exists) {
      const updated = [equipment, ...current];
      await this.saveUserEquipments(updated);
      return updated;
    }
    return current;
  },

  async removeEquipment(id: string): Promise<Equipment[]> {
    const current = await this.getUserEquipments();
    const updated = current.filter(e => e.id !== id);
    await this.saveUserEquipments(updated);
    return updated;
  },

  // 2. Workout Logs
  async getWorkoutLogs(): Promise<WorkoutLog[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.WORKOUT_LOGS);
      if (data) {
        return JSON.parse(data);
      }
      // Initial seed
      await AsyncStorage.setItem(KEYS.WORKOUT_LOGS, JSON.stringify(SAMPLE_LOGS));
      return SAMPLE_LOGS;
    } catch (e) {
      console.error('Error fetching workout logs:', e);
      return SAMPLE_LOGS;
    }
  },

  async addWorkoutLog(log: WorkoutLog): Promise<WorkoutLog[]> {
    const current = await this.getWorkoutLogs();
    const updated = [log, ...current];
    try {
      await AsyncStorage.setItem(KEYS.WORKOUT_LOGS, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving workout log:', e);
    }
    return updated;
  },

  async clearWorkoutLogs(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.WORKOUT_LOGS);
  },

  // 3. User Settings
  async getUserSettings(): Promise<UserSettings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
      return DEFAULT_SETTINGS;
    } catch (e) {
      console.error('Error fetching settings:', e);
      return DEFAULT_SETTINGS;
    }
  },

  async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  },

  // 4. Reset All Data
  async resetAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.USER_EQUIPMENTS,
      KEYS.WORKOUT_LOGS,
      KEYS.USER_SETTINGS,
      KEYS.LAST_ROUTINE,
    ]);
  }
};
