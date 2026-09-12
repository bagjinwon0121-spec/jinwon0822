import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  Flame,
  Play,
  Dumbbell,
  Sparkles,
  ChevronRight,
  Clock,
  Zap,
  TrendingUp,
  PlusCircle,
  Award,
} from 'lucide-react-native';
import { Equipment, WorkoutLog, WorkoutRoutine, BodyPart } from '../types';
import { StorageService } from '../services/storage';
import { AIService } from '../services/aiService';

interface HomeScreenProps {
  onStartWorkout: (routine: WorkoutRoutine) => void;
  onNavigateToTab: (tab: 'home' | 'equipment' | 'ai_routine' | 'history' | 'settings') => void;
  onSelectBodyPart: (part: BodyPart) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartWorkout,
  onNavigateToTab,
  onSelectBodyPart,
}) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [todayRoutine, setTodayRoutine] = useState<WorkoutRoutine | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const userEquips = await StorageService.getUserEquipments();
    const userLogs = await StorageService.getWorkoutLogs();
    setEquipments(userEquips);
    setLogs(userLogs);

    // Generate today's smart recommendation
    const routine = AIService.generateRoutine({
      targetParts: ['chest', 'arms'],
      ownedEquipments: userEquips,
      durationMinutes: 30,
      difficulty: 'intermediate',
    });
    setTodayRoutine(routine);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Streak calculations
  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);

  return (
    <View style={styles.container}>
      <Header
        title="홈트 AI 플래너"
        subtitle="보유 기구 기반 맞춤 운동 가이드"
        showBadge
        badgeText="🔥 3일 연속 운동 중"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 1. Quick Stats Banner */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Flame size={20} color={colors.accentOrange} />
            <Text style={styles.statNumber}>{totalWorkouts}회</Text>
            <Text style={styles.statLabel}>총 완료 운동</Text>
          </View>

          <View style={styles.statCard}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.statNumber}>{totalMinutes}분</Text>
            <Text style={styles.statLabel}>누적 운동 시간</Text>
          </View>

          <View style={styles.statCard}>
            <Dumbbell size={20} color={colors.accent} />
            <Text style={styles.statNumber}>{equipments.length}개</Text>
            <Text style={styles.statLabel}>등록된 기구</Text>
          </View>
        </View>

        {/* 2. Today's Recommended Routine (Hero Card) */}
        {todayRoutine && (
          <View style={styles.heroSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrap}>
                <Sparkles size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>오늘의 AI 맞춤 추천</Text>
              </View>
              <TouchableOpacity onPress={() => onNavigateToTab('ai_routine')}>
                <Text style={styles.seeMoreText}>다른 루틴 보기 &gt;</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View style={styles.badgeGroup}>
                  <View style={styles.heroTag}>
                    <Text style={styles.heroTagText}>추천 루틴</Text>
                  </View>
                  <View style={styles.diffTag}>
                    <Text style={styles.diffTagText}>중급 코스</Text>
                  </View>
                </View>
                <View style={styles.calTag}>
                  <Flame size={12} color={colors.accentOrange} />
                  <Text style={styles.calText}>약 {todayRoutine.estimatedCalories} kcal</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>{todayRoutine.title}</Text>
              <Text style={styles.heroDesc} numberOfLines={2}>
                {todayRoutine.description}
              </Text>

              {/* Exercise Pills */}
              <View style={styles.exerciseListPreview}>
                {todayRoutine.exercises.map((item, idx) => (
                  <View key={item.exerciseId} style={styles.exercisePill}>
                    <Text style={styles.exercisePillIndex}>{idx + 1}</Text>
                    <Text style={styles.exercisePillName} numberOfLines={1}>
                      {item.exercise.name}
                    </Text>
                    <Text style={styles.exercisePillSets}>{item.sets}세트</Text>
                  </View>
                ))}
              </View>

              {/* Quick Start Button */}
              <TouchableOpacity
                style={styles.quickStartBtn}
                onPress={() => onStartWorkout(todayRoutine)}
                activeOpacity={0.85}
              >
                <Play size={20} color={colors.textInverse} fill={colors.textInverse} />
                <Text style={styles.quickStartText}>빠른 운동 시작하기 ({todayRoutine.targetDurationMinutes}분)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 3. My Equipment Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Dumbbell size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>내 홈트 장비 ({equipments.length}개)</Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateToTab('equipment')}>
              <Text style={styles.seeMoreText}>장비 관리 &gt;</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.equipmentsScroll}>
            {equipments.map(eq => (
              <View key={eq.id} style={styles.equipChip}>
                <View style={styles.equipDot} />
                <Text style={styles.equipChipText}>{eq.name}</Text>
              </View>
            ))}
            <TouchableOpacity style={styles.addEquipChip} onPress={() => onNavigateToTab('equipment')}>
              <PlusCircle size={14} color={colors.primary} />
              <Text style={styles.addEquipText}>기구 추가</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 4. Target Body Part Quick Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleWrap}>
              <Zap size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>🎯 운동 부위 직접 선택</Text>
            </View>
          </View>
          <Text style={styles.sectionSubDesc}>원하는 부위를 탭하면 보유 기구 맞춤 루틴을 생성합니다</Text>

          <View style={styles.bodyPartGrid}>
            {BODY_PARTS_INFO.map(part => (
              <TouchableOpacity
                key={part.id}
                style={[styles.bodyPartCard, { borderColor: part.color + '40' }]}
                onPress={() => onSelectBodyPart(part.id as BodyPart)}
                activeOpacity={0.7}
              >
                <View style={[styles.bodyPartIconWrap, { backgroundColor: part.color + '20' }]}>
                  <Text style={[styles.bodyPartInitial, { color: part.color }]}>{part.name.slice(0, 1)}</Text>
                </View>
                <View style={styles.bodyPartInfo}>
                  <Text style={styles.bodyPartName}>{part.name}</Text>
                  <Text style={styles.bodyPartDesc} numberOfLines={1}>{part.description}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 5. Recent Workout History */}
        {logs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWrap}>
                <TrendingUp size={18} color={colors.primary} />
                <Text style={styles.sectionTitle}>최근 운동 기록</Text>
              </View>
              <TouchableOpacity onPress={() => onNavigateToTab('history')}>
                <Text style={styles.seeMoreText}>전체 보기 &gt;</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.recentLogCard}>
              <View style={styles.logCardHeader}>
                <Award size={18} color={colors.accentAmber} />
                <Text style={styles.logTitle}>{logs[0].routineTitle}</Text>
                <Text style={styles.logDate}>{logs[0].date}</Text>
              </View>
              <View style={styles.logMetaRow}>
                <Text style={styles.logMetaText}>⏱️ {logs[0].durationMinutes}분 수행</Text>
                <Text style={styles.logMetaText}>🔥 {logs[0].totalCalories} kcal</Text>
                <Text style={styles.logMetaText}>💪 {logs[0].totalSetsCompleted}세트 완료</Text>
              </View>
            </View>
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
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  heroSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionSubDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  heroCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  heroTag: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  heroTagText: {
    color: colors.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  diffTag: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffTagText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  calTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  calText: {
    color: colors.accentOrange,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  heroDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  exerciseListPreview: {
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  exercisePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exercisePillIndex: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgCard,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  exercisePillName: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  exercisePillSets: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  quickStartBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  quickStartText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    marginBottom: 24,
  },
  equipmentsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  equipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  equipChipText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  addEquipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  addEquipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  bodyPartGrid: {
    gap: 8,
  },
  bodyPartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bodyPartIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bodyPartInitial: {
    fontSize: 16,
    fontWeight: '800',
  },
  bodyPartInfo: {
    flex: 1,
  },
  bodyPartName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bodyPartDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  recentLogCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  logTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  logDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgInput,
    padding: 10,
    borderRadius: 10,
  },
  logMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
