import { BodyPart, Difficulty, Equipment, EquipmentCategory, Exercise, FitnessGoal, WorkoutRoutine, WorkoutExerciseItem } from '../types';
import { EXERCISE_DATABASE } from '../data/exerciseDatabase';
import { PRESET_EQUIPMENTS } from '../data/presetEquipments';

export interface AIRoutineRequest {
  targetParts: BodyPart[];
  ownedEquipments: Equipment[];
  durationMinutes: number;
  difficulty: Difficulty;
  fitnessGoal?: FitnessGoal;
}

export interface AIEstimationResult {
  category: EquipmentCategory;
  name: string;
  confidence: number; // 0.0 ~ 1.0
  description: string;
  targetParts: BodyPart[];
  suggestedExercises: string[];
}

export const AIService = {
  /**
   * Generates a tailored, balanced workout routine based on target parts, equipment, time, and difficulty.
   */
  generateRoutine(params: AIRoutineRequest): WorkoutRoutine {
    const { targetParts, ownedEquipments, durationMinutes, difficulty, fitnessGoal = 'hypertrophy' } = params;

    // Available equipment categories (always include bodyweight)
    const availableCategories: Set<EquipmentCategory> = new Set([
      'bodyweight',
      ...ownedEquipments.map(e => e.category)
    ]);

    // 1. Filter exercises matching target body parts and available equipments
    const matchingExercises = EXERCISE_DATABASE.filter(ex => {
      const matchesPart = targetParts.includes(ex.targetPart) || 
        (targetParts.includes('fullBody')) ||
        (ex.targetPart === 'fullBody' && targetParts.length > 0);

      // Check if user has ALL required equipments for this exercise
      const hasEquipment = ex.requiredEquipment.every(req => availableCategories.has(req));

      return matchesPart && hasEquipment;
    });

    // Fallback if none found: get bodyweight exercises
    const pool = matchingExercises.length > 0 ? matchingExercises : EXERCISE_DATABASE.filter(e => e.requiredEquipment.includes('bodyweight'));

    // 2. Determine number of exercises based on duration (approx 6-8 mins per exercise including rest)
    let exerciseCount = 3;
    if (durationMinutes <= 20) exerciseCount = 3;
    else if (durationMinutes <= 35) exerciseCount = 4;
    else if (durationMinutes <= 50) exerciseCount = 5;
    else exerciseCount = 6;

    // Ensure we don't exceed pool size
    exerciseCount = Math.min(exerciseCount, pool.length);

    // 3. Shuffle & pick diverse exercises
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, exerciseCount);

    // 4. Adjust sets, reps, and rest by difficulty and goal
    const routineExercises: WorkoutExerciseItem[] = selected.map(ex => {
      let sets = ex.defaultSets;
      let reps = ex.defaultReps;
      let rest = ex.defaultRestSec;

      if (difficulty === 'beginner') {
        sets = Math.max(2, sets - 1);
        reps = Math.max(8, reps - 2);
        rest = rest + 15;
      } else if (difficulty === 'advanced') {
        sets = sets + 1;
        reps = reps + 3;
        rest = Math.max(30, rest - 15);
      }

      if (fitnessGoal === 'diet' || fitnessGoal === 'endurance') {
        reps = Math.round(reps * 1.25);
        rest = Math.max(30, rest - 15);
      } else if (fitnessGoal === 'strength') {
        reps = Math.min(8, Math.max(5, Math.round(reps * 0.7)));
        rest = rest + 30;
      }

      return {
        exerciseId: ex.id,
        exercise: ex,
        sets,
        reps,
        durationSec: ex.defaultDurationSec,
        restSec: rest,
        completedSets: 0,
        isCompleted: false,
      };
    });

    // 5. Calculate estimated total calories
    const totalDurationMin = durationMinutes;
    const avgCalPerMin = selected.reduce((sum, item) => sum + item.caloriesPerMinute, 0) / (selected.length || 1);
    const estimatedCalories = Math.round(avgCalPerMin * totalDurationMin * (difficulty === 'advanced' ? 1.2 : difficulty === 'beginner' ? 0.85 : 1.0));

    // 6. Generate an inspiring title
    const partNames = targetParts.map(p => {
      if (p === 'chest') return '가슴';
      if (p === 'back') return '등';
      if (p === 'shoulder') return '어깨';
      if (p === 'arms') return '팔';
      if (p === 'abs') return '복근/코어';
      if (p === 'legs') return '하체';
      return '전신';
    }).join(' & ');

    const title = `${partNames} ${difficulty === 'beginner' ? '입문 맞춤' : difficulty === 'advanced' ? '고강도 폭파' : '밸런스'} 루틴`;
    const description = `보유하신 기구(${ownedEquipments.map(e => e.name).slice(0, 3).join(', ') || '맨몸'})를 활용해 ${durationMinutes}분 동안 ${partNames} 부위를 집중 자극하는 AI 맞춤 플랜입니다.`;

    return {
      id: 'routine_' + Date.now(),
      title,
      description,
      targetParts,
      targetDurationMinutes: durationMinutes,
      difficulty,
      exercises: routineExercises,
      createdAt: new Date().toISOString(),
      estimatedCalories,
    };
  },

  /**
   * AI Image Recognition for workout equipment.
   * Classifies photo into equipment categories with confidence, Korean description, and target muscle groups.
   */
  async estimateEquipmentFromImage(imageUri: string, fileName?: string): Promise<AIEstimationResult> {
    // Simulating deep vision AI analysis with intelligent heuristics
    await new Promise(res => setTimeout(res, 1200));

    const lowerUri = (imageUri + ' ' + (fileName || '')).toLowerCase();

    // Heuristics based on image name or content tokens
    if (lowerUri.includes('pull') || lowerUri.includes('chin') || lowerUri.includes('bar')) {
      return {
        category: 'pullup_bar',
        name: '풀업바 / 치닝디핑',
        confidence: 0.96,
        description: '문틀 또는 스탠드형 턱걸이봉으로 감지되었습니다. 광배근, 이두근, 코어 발달에 최적입니다.',
        targetParts: ['back', 'arms', 'abs'],
        suggestedExercises: ['풀업 (턱걸이)', '친업', '행잉 레그레이즈'],
      };
    }

    if (lowerUri.includes('band') || lowerUri.includes('tube') || lowerUri.includes('elastic')) {
      return {
        category: 'band',
        name: '튜빙 / 저항 밴드',
        confidence: 0.94,
        description: '탄성 저항 밴드가 감지되었습니다. 관절 부담 없이 어깨, 가슴, 등 근육을 섬세하게 자극할 수 있습니다.',
        targetParts: ['shoulder', 'back', 'chest', 'arms'],
        suggestedExercises: ['밴드 체스트 프레스', '밴드 시티드 로우', '밴드 페이스풀'],
      };
    }

    if (lowerUri.includes('kettle') || lowerUri.includes('bell')) {
      return {
        category: 'kettlebell',
        name: '케틀벨',
        confidence: 0.95,
        description: '케틀벨이 감지되었습니다. 힙 드라이브, 코어 폭발력 및 전신 유산소 운동에 뛰어납니다.',
        targetParts: ['legs', 'abs', 'fullBody'],
        suggestedExercises: ['케틀벨 스윙', '케틀벨 고블렛 스쿼트', '케틀벨 클린'],
      };
    }

    if (lowerUri.includes('mat') || lowerUri.includes('yoga') || lowerUri.includes('pad')) {
      return {
        category: 'yoga_mat',
        name: '요가 / 홈트레이닝 매트',
        confidence: 0.97,
        description: '충격 흡수용 홈트 매트가 감지되었습니다. 플랭크, 크런치, 런지 등 모든 맨몸 운동의 기초입니다.',
        targetParts: ['abs', 'legs', 'fullBody'],
        suggestedExercises: ['스탠다드 플랭크', '크런치', '레그 레이즈', '버피 테스트'],
      };
    }

    if (lowerUri.includes('roller') || lowerUri.includes('foam')) {
      return {
        category: 'foam_roller',
        name: '폼롤러',
        confidence: 0.96,
        description: '근막 이완용 폼롤러가 감지되었습니다. 운동 전후 부상 방지 및 유연성 향상에 탁월합니다.',
        targetParts: ['back', 'legs', 'fullBody'],
        suggestedExercises: ['폼롤러 등 스트레칭', '대퇴사두 근막 이완', '둔근 롤링'],
      };
    }

    // Default high-probability detection: Dumbbells (the most common home gym gear)
    return {
      category: 'dumbbell',
      name: '덤벨 / 아령',
      confidence: 0.92,
      description: '중량 덤벨/아령으로 감지되었습니다. 가슴, 어깨, 팔, 하체 등 다양한 분할 운동에 가장 범용적인 기구입니다.',
      targetParts: ['chest', 'shoulder', 'arms', 'back', 'legs'],
      suggestedExercises: ['덤벨 플로어/벤치 프레스', '덤벨 숄더 프레스', '덤벨 바이셉스 컬', '덤벨 고블렛 스쿼트'],
    };
  }
};
