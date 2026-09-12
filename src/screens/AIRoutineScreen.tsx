import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  Sparkles,
  Play,
  Clock,
  Flame,
  Check,
  CheckCircle,
  Dumbbell,
  Sliders,
  ChevronRight,
  Shield,
  Target,
} from 'lucide-react-native';
import { BodyPart, Difficulty, FitnessGoal, Equipment, WorkoutRoutine } from '../types';
import { StorageService } from '../services/storage';
import { AIService } from '../services/aiService';

interface AIRoutineScreenProps {
  initialSelectedPart?: BodyPart;
  onStartWorkout: (routine: WorkoutRoutine) => void;
}

export const AIRoutineScreen: React.FC<AIRoutineScreenProps> = ({
  initialSelectedPart,
  onStartWorkout,
}) => {
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>(
    initialSelectedPart ? [initialSelectedPart] : ['chest', 'arms']
  );
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate');
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>('hypertrophy');
  const [ownedEquipments, setOwnedEquipments] = useState<Equipment[]>([]);
  const [activeEquipmentIds, setActiveEquipmentIds] = useState<string[]>([]);
  const [generatedRoutine, setGeneratedRoutine] = useState<WorkoutRoutine | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialSelectedPart && !selectedParts.includes(initialSelectedPart)) {
      setSelectedParts([initialSelectedPart]);
    }
  }, [initialSelectedPart]);

  useEffect(() => {
    const init = async () => {
      const equips = await StorageService.getUserEquipments();
      const settings = await StorageService.getUserSettings();
      setOwnedEquipments(equips);
      setActiveEquipmentIds(equips.map(e => e.id));
      setDifficulty(settings.defaultDifficulty);
      setDurationMinutes(settings.defaultDurationMinutes);
      setFitnessGoal(settings.fitnessGoal);
    };
    init();
  }, []);

  const togglePart = (part: BodyPart) => {
    if (part === 'fullBody') {
      setSelectedParts(['fullBody']);
      return;
    }

    const filtered = selectedParts.filter(p => p !== 'fullBody');
    if (filtered.includes(part)) {
      if (filtered.length > 1) {
        setSelectedParts(filtered.filter(p => p !== part));
      }
    } else {
      setSelectedParts([...filtered, part]);
    }
  };

  const toggleEquipment = (id: string) => {
    if (id === 'eq_bodyweight') return; // Bodyweight cannot be unselected
    if (activeEquipmentIds.includes(id)) {
      setActiveEquipmentIds(activeEquipmentIds.filter(eId => eId !== id));
    } else {
      setActiveEquipmentIds([...activeEquipmentIds, id]);
    }
  };

  const handleGenerateRoutine = () => {
    setIsGenerating(true);
    setGeneratedRoutine(null);

    setTimeout(() => {
      const activeEquips = ownedEquipments.filter(e => activeEquipmentIds.includes(e.id));
      const routine = AIService.generateRoutine({
        targetParts: selectedParts,
        ownedEquipments: activeEquips,
        durationMinutes,
        difficulty,
        fitnessGoal,
      });

      setGeneratedRoutine(routine);
      setIsGenerating(false);
    }, 600);
  };

  return (
    <View style={styles.container}>
      <Header
        title="🤖 AI 운동 추천"
        subtitle="원하는 부위와 기구를 조합해 최적의 루틴을 설계합니다"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 1. Target Body Parts Selector */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Target size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>1. 운동 부위 선택 (다중 선택 가능)</Text>
          </View>

          <View style={styles.bodyPartGrid}>
            {BODY_PARTS_INFO.map(part => {
              const isSelected = selectedParts.includes(part.id as BodyPart);
              return (
                <TouchableOpacity
                  key={part.id}
                  style={[
                    styles.partCard,
                    isSelected && { borderColor: part.color, backgroundColor: part.color + '15' },
                  ]}
                  onPress={() => togglePart(part.id as BodyPart)}
                  activeOpacity={0.7}
                >
                  <View style={styles.partCardTop}>
                    <Text style={[styles.partName, isSelected && { color: colors.textPrimary, fontWeight: '800' }]}>
                      {part.name}
                    </Text>
                    {isSelected && (
                      <View style={[styles.checkCircle, { backgroundColor: part.color }]}>
                        <Check size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.partSubName}>{part.englishName}</Text>
                  <Text style={styles.partDesc} numberOfLines={1}>
                    {part.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Workout Duration */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>2. 운동 시간</Text>
          </View>

          <View style={styles.chipRow}>
            {[15, 30, 45, 60].map(mins => (
              <TouchableOpacity
                key={mins}
                style={[styles.choiceChip, durationMinutes === mins && styles.choiceChipActive]}
                onPress={() => setDurationMinutes(mins)}
              >
                <Text style={[styles.chipText, durationMinutes === mins && styles.chipTextActive]}>
                  {mins}분
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 3. Difficulty */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Sliders size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>3. 운동 난이도</Text>
          </View>

          <View style={styles.chipRow}>
            {(
              [
                { id: 'beginner', label: '초급 (기본기)' },
                { id: 'intermediate', label: '중급 (표준)' },
                { id: 'advanced', label: '고급 (고강도)' },
              ] as const
            ).map(d => (
              <TouchableOpacity
                key={d.id}
                style={[styles.choiceChip, difficulty === d.id && styles.choiceChipActive]}
                onPress={() => setDifficulty(d.id)}
              >
                <Text style={[styles.chipText, difficulty === d.id && styles.chipTextActive]}>
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Equipment Filter */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Dumbbell size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>4. 오늘 사용할 운동기구</Text>
          </View>
          <Text style={styles.sectionSubtitle}>체크 해제된 기구는 루틴에서 제외됩니다</Text>

          <View style={styles.equipChipsWrap}>
            {ownedEquipments.map(eq => {
              const isActive = activeEquipmentIds.includes(eq.id);
              return (
                <TouchableOpacity
                  key={eq.id}
                  style={[styles.equipToggleChip, isActive && styles.equipToggleChipActive]}
                  onPress={() => toggleEquipment(eq.id)}
                >
                  <View style={[styles.miniCheck, isActive && styles.miniCheckActive]}>
                    {isActive && <Check size={10} color={colors.textInverse} />}
                  </View>
                  <Text style={[styles.equipToggleText, isActive && styles.equipToggleTextActive]}>
                    {eq.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerateRoutine}
          disabled={isGenerating}
          activeOpacity={0.85}
        >
          {isGenerating ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <>
              <Sparkles size={20} color={colors.textInverse} />
              <Text style={styles.generateBtnText}>AI 맞춤 루틴 생성하기</Text>
            </>
          )}
        </TouchableOpacity>

        {/* 5. Generated Routine Result Card */}
        {generatedRoutine && (
          <View style={styles.resultSection}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <Sparkles size={14} color={colors.primary} />
                <Text style={styles.resultBadgeText}>AI 생성 완료</Text>
              </View>
              <Text style={styles.resultCalories}>🔥 약 {generatedRoutine.estimatedCalories} kcal</Text>
            </View>

            <Text style={styles.routineTitle}>{generatedRoutine.title}</Text>
            <Text style={styles.routineDesc}>{generatedRoutine.description}</Text>

            {/* Exercise Details List */}
            <View style={styles.exerciseList}>
              {generatedRoutine.exercises.map((item, index) => (
                <View key={item.exerciseId} style={styles.exerciseItemCard}>
                  <View style={styles.exerciseItemIndex}>
                    <Text style={styles.exerciseItemIndexText}>{index + 1}</Text>
                  </View>

                  <View style={styles.exerciseItemBody}>
                    <View style={styles.exerciseItemHeader}>
                      <Text style={styles.exerciseItemName}>{item.exercise.name}</Text>
                      <View style={styles.partBadge}>
                        <Text style={styles.partBadgeText}>
                          {BODY_PARTS_INFO.find(p => p.id === item.exercise.targetPart)?.name}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.exerciseItemMeta}>
                      🎯 {item.sets}세트 × {item.durationSec ? `${item.durationSec}초 버티기` : `${item.reps}회`} | ⏱️ 휴식 {item.restSec}초
                    </Text>

                    {item.exercise.tips.length > 0 && (
                      <Text style={styles.exerciseTipText} numberOfLines={1}>
                        💡 {item.exercise.tips[0]}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Start Workout Button */}
            <TouchableOpacity
              style={styles.startWorkoutBtn}
              onPress={() => onStartWorkout(generatedRoutine)}
              activeOpacity={0.85}
            >
              <Play size={20} color={colors.textInverse} fill={colors.textInverse} />
              <Text style={styles.startWorkoutBtnText}>💪 이 루틴으로 지금 운동 시작</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  bodyPartGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  partCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  partCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  partName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partSubName: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  partDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choiceChip: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  equipChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipToggleChipActive: {
    backgroundColor: colors.bgInput,
    borderColor: colors.primary,
  },
  miniCheck: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCheckActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  equipToggleText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  equipToggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  generateBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    marginVertical: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  generateBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
  resultSection: {
    marginTop: 20,
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultBadgeText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  resultCalories: {
    color: colors.accentOrange,
    fontSize: 13,
    fontWeight: '700',
  },
  routineTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  routineDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  exerciseList: {
    gap: 10,
    marginBottom: 18,
  },
  exerciseItemCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    padding: 12,
    alignItems: 'flex-start',
  },
  exerciseItemIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  exerciseItemIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  exerciseItemBody: {
    flex: 1,
  },
  exerciseItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseItemName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  partBadge: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  partBadgeText: {
    fontSize: 10,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  exerciseItemMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  exerciseTipText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  startWorkoutBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  startWorkoutBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
});
