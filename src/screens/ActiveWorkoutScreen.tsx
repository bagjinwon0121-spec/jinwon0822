import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  X,
  Check,
  CheckCircle,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Timer,
  Flame,
  Award,
  BookOpen,
  AlertCircle,
} from 'lucide-react-native';
import { WorkoutRoutine, WorkoutLog, WorkoutExerciseItem } from '../types';
import { RestTimerOverlay } from '../components/workout/RestTimerOverlay';
import { StorageService } from '../services/storage';
import * as Haptics from 'expo-haptics';

interface ActiveWorkoutScreenProps {
  routine: WorkoutRoutine;
  onFinishWorkout: (log: WorkoutLog) => void;
  onExit: () => void;
}

export const ActiveWorkoutScreen: React.FC<ActiveWorkoutScreenProps> = ({
  routine,
  onFinishWorkout,
  onExit,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExerciseItem[]>(routine.exercises);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Set-level completion state: [exerciseIndex][setIndex] = boolean
  const [setCompletions, setSetCompletions] = useState<{ [key: string]: boolean }>({});

  // Rest timer modal state
  const [isResting, setIsResting] = useState(false);
  const [restDuration, setRestDuration] = useState(60);

  // Completion modal state
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [savedLog, setSavedLog] = useState<WorkoutLog | null>(null);

  const startTimeRef = useRef(new Date().toISOString());

  // Global workout duration ticker
  useEffect(() => {
    if (isTimerPaused || isCompletedModalOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, isCompletedModalOpen]);

  const currentItem = exercises[currentExerciseIndex];
  const currentExercise = currentItem?.exercise;

  // Toggle set completion
  const handleToggleSet = (setIdx: number) => {
    const key = `${currentExerciseIndex}_${setIdx}`;
    const wasCompleted = !!setCompletions[key];
    const newStatus = !wasCompleted;

    setSetCompletions(prev => ({
      ...prev,
      [key]: newStatus,
    }));

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    // If set was just completed, trigger rest timer!
    if (newStatus) {
      const restSec = currentItem.restSec || 60;
      setRestDuration(restSec);
      setIsResting(true);
    }
  };

  const handleFinishRest = () => {
    setIsResting(false);
  };

  // Next / Previous exercise
  const handleNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      promptFinishWorkout();
    }
  };

  const handlePrevExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  // Total completed sets across entire workout
  const totalSetsCompleted = Object.values(setCompletions).filter(Boolean).length;
  const totalSetsPlanned = exercises.reduce((sum, item) => sum + item.sets, 0);

  const promptFinishWorkout = () => {
    Alert.alert('운동 완료', '오늘의 운동 루틴을 모두 마치고 기록을 저장하시겠습니까?', [
      { text: '계속 운동하기', style: 'cancel' },
      { text: '완료 및 저장', style: 'default', onPress: finalizeWorkout },
    ]);
  };

  const finalizeWorkout = async () => {
    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    const estimatedCal = Math.round(
      (routine.estimatedCalories / (routine.targetDurationMinutes || 30)) * durationMin
    );

    const log: WorkoutLog = {
      id: 'log_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      startTime: startTimeRef.current,
      endTime: new Date().toISOString(),
      durationMinutes: durationMin,
      routineTitle: routine.title,
      targetParts: routine.targetParts,
      completedExercises: exercises.map((item, idx) => {
        let doneSets = 0;
        for (let s = 0; s < item.sets; s++) {
          if (setCompletions[`${idx}_${s}`]) doneSets++;
        }
        return {
          name: item.exercise.name,
          targetPart: item.exercise.targetPart,
          completedSets: doneSets,
          totalSets: item.sets,
          reps: item.reps,
        };
      }),
      totalSetsCompleted,
      totalCalories: estimatedCal,
      equipmentUsed: routine.targetParts.map(p => p),
    };

    await StorageService.addWorkoutLog(log);
    setSavedLog(log);
    setIsCompletedModalOpen(true);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExercise) return null;

  const nextExerciseName =
    currentExerciseIndex < exercises.length - 1 ? exercises[currentExerciseIndex + 1].exercise.name : undefined;

  return (
    <View style={styles.container}>
      {/* Top Session Bar */}
      <View style={styles.sessionHeader}>
        <TouchableOpacity
          style={styles.exitBtn}
          onPress={() => {
            Alert.alert('운동 중단', '운동을 중단하고 홈으로 나가시겠습니까?', [
              { text: '계속하기', style: 'cancel' },
              { text: '나가기', style: 'destructive', onPress: onExit },
            ]);
          }}
        >
          <X size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.timerDisplay}>
          <Timer size={16} color={colors.primary} />
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>

        <TouchableOpacity style={styles.finishTopBtn} onPress={promptFinishWorkout}>
          <Text style={styles.finishTopBtnText}>운동 완료</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Dots */}
      <View style={styles.stepProgressRow}>
        {exercises.map((item, idx) => {
          const isCurrent = idx === currentExerciseIndex;
          const isPast = idx < currentExerciseIndex;
          return (
            <View
              key={idx}
              style={[
                styles.stepBar,
                isPast && styles.stepBarCompleted,
                isCurrent && styles.stepBarActive,
              ]}
            />
          );
        })}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Exercise Header */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeaderRow}>
            <View style={styles.partTag}>
              <Text style={styles.partTagText}>
                {BODY_PARTS_INFO.find(p => p.id === currentExercise.targetPart)?.name}
              </Text>
            </View>
            <Text style={styles.exerciseStepText}>
              {currentExerciseIndex + 1} / {exercises.length} 번째 운동
            </Text>
          </View>

          <Text style={styles.exerciseTitle}>{currentExercise.name}</Text>
          <Text style={styles.exerciseEngName}>{currentExercise.englishName}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeLabel}>목표 세트</Text>
              <Text style={styles.metaBadgeVal}>{currentItem.sets} 세트</Text>
            </View>

            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeLabel}>반복 횟수</Text>
              <Text style={styles.metaBadgeVal}>
                {currentItem.durationSec ? `${currentItem.durationSec}초 버티기` : `${currentItem.reps}회`}
              </Text>
            </View>

            <View style={styles.metaBadge}>
              <Text style={styles.metaBadgeLabel}>휴식 시간</Text>
              <Text style={styles.metaBadgeVal}>{currentItem.restSec}초</Text>
            </View>
          </View>
        </View>

        {/* Set Checklist */}
        <View style={styles.setCard}>
          <Text style={styles.cardTitle}>세트별 진행 상황</Text>
          <Text style={styles.cardSubtitle}>세트를 마칠 때마다 체크하면 휴식 타이머가 작동합니다</Text>

          <View style={styles.setList}>
            {Array.from({ length: currentItem.sets }).map((_, sIdx) => {
              const isChecked = !!setCompletions[`${currentExerciseIndex}_${sIdx}`];
              return (
                <TouchableOpacity
                  key={sIdx}
                  style={[styles.setItem, isChecked && styles.setItemChecked]}
                  onPress={() => handleToggleSet(sIdx)}
                  activeOpacity={0.75}
                >
                  <View style={styles.setItemLeft}>
                    <View style={[styles.setNumberCircle, isChecked && styles.setNumberCircleChecked]}>
                      <Text style={[styles.setNumberText, isChecked && styles.setNumberTextChecked]}>
                        {sIdx + 1}
                      </Text>
                    </View>
                    <Text style={[styles.setLabel, isChecked && styles.setLabelChecked]}>
                      {sIdx + 1}세트
                    </Text>
                  </View>

                  <Text style={styles.setTargetText}>
                    {currentItem.durationSec ? `${currentItem.durationSec}초` : `${currentItem.reps}회`}
                  </Text>

                  <View style={[styles.checkBtn, isChecked && styles.checkBtnChecked]}>
                    {isChecked ? (
                      <Check size={16} color={colors.textInverse} />
                    ) : (
                      <View style={styles.checkBtnInner} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Posture & Guide Accordion */}
        <View style={styles.guideCard}>
          <View style={styles.guideHeader}>
            <BookOpen size={16} color={colors.primary} />
            <Text style={styles.guideTitle}>운동 자세 가이드</Text>
          </View>

          {currentExercise.guide.map((step, i) => (
            <View key={i} style={styles.guideStepItem}>
              <Text style={styles.guideStepNumber}>{i + 1}</Text>
              <Text style={styles.guideStepText}>{step}</Text>
            </View>
          ))}

          {currentExercise.tips.length > 0 && (
            <View style={styles.tipWrap}>
              <Text style={styles.tipTitle}>💡 자극 극대화 팁</Text>
              {currentExercise.tips.map((t, i) => (
                <Text key={i} style={styles.tipItemText}>• {t}</Text>
              ))}
            </View>
          )}

          {currentExercise.cautions && currentExercise.cautions.length > 0 && (
            <View style={styles.cautionWrap}>
              <AlertCircle size={14} color={colors.accentOrange} />
              <Text style={styles.cautionText}>{currentExercise.cautions[0]}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentExerciseIndex === 0 && styles.navBtnDisabled]}
          onPress={handlePrevExercise}
          disabled={currentExerciseIndex === 0}
        >
          <ChevronLeft size={20} color={currentExerciseIndex === 0 ? colors.textMuted : colors.textPrimary} />
          <Text style={[styles.navBtnText, currentExerciseIndex === 0 && styles.navBtnTextDisabled]}>
            이전 운동
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextExerciseBtn} onPress={handleNextExercise} activeOpacity={0.85}>
          <Text style={styles.nextExerciseText}>
            {currentExerciseIndex < exercises.length - 1 ? '다음 운동으로 이동' : '운동 최종 완료'}
          </Text>
          <ChevronRight size={20} color={colors.textInverse} />
        </TouchableOpacity>
      </View>

      {/* Rest Timer Overlay */}
      <RestTimerOverlay
        visible={isResting}
        restDurationSec={restDuration}
        nextExerciseName={nextExerciseName}
        currentSetInfo={`${currentExercise.name}`}
        onFinish={handleFinishRest}
        onSkip={handleFinishRest}
      />

      {/* Workout Complete Celebration Modal */}
      <Modal visible={isCompletedModalOpen} transparent animationType="slide">
        <View style={styles.completeModalBackdrop}>
          <View style={styles.completeCard}>
            <View style={styles.trophyWrap}>
              <Award size={48} color={colors.accentAmber} />
            </View>

            <Text style={styles.congratsTitle}>오늘의 홈트 완료! 🎉</Text>
            <Text style={styles.congratsSubtitle}>성공적으로 루틴을 완주했습니다!</Text>

            {savedLog && (
              <View style={styles.summaryBox}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>총 운동 시간</Text>
                  <Text style={styles.summaryVal}>{savedLog.durationMinutes}분</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>완료 세트 수</Text>
                  <Text style={styles.summaryVal}>{savedLog.totalSetsCompleted}세트</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>소모 칼로리</Text>
                  <Text style={styles.summaryVal}>약 {savedLog.totalCalories} kcal</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setIsCompletedModalOpen(false);
                if (savedLog) onFinishWorkout(savedLog);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>기록 확인하러 가기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: colors.bgDark,
  },
  exitBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  finishTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primaryMuted,
    borderRadius: 8,
  },
  finishTopBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryLight,
  },
  stepProgressRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  stepBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.bgInput,
  },
  stepBarActive: {
    backgroundColor: colors.primary,
  },
  stepBarCompleted: {
    backgroundColor: colors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  partTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  partTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  exerciseStepText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  exerciseTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  exerciseEngName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metaBadge: {
    flex: 1,
    backgroundColor: colors.bgInput,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  metaBadgeLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  metaBadgeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  setCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 14,
  },
  setList: {
    gap: 8,
  },
  setItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setItemChecked: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: colors.primary,
  },
  setItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  setNumberCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setNumberCircleChecked: {
    backgroundColor: colors.primary,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  setNumberTextChecked: {
    color: colors.textInverse,
  },
  setLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  setLabelChecked: {
    fontWeight: '700',
  },
  setTargetText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginRight: 16,
  },
  checkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkBtnInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  guideCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  guideStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  guideStepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
  },
  guideStepText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  tipWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
    marginBottom: 4,
  },
  tipItemText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cautionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  cautionText: {
    flex: 1,
    fontSize: 11,
    color: colors.accentOrange,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  navBtnTextDisabled: {
    color: colors.textMuted,
  },
  nextExerciseBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextExerciseText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  completeModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  completeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  trophyWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  congratsSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: colors.bgInput,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primaryLight,
  },
  doneBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  doneBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '800',
  },
});
