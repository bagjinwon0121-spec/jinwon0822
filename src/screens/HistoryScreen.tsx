import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  Calendar as CalendarIcon,
  Flame,
  Clock,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Dumbbell,
  Trash2,
} from 'lucide-react-native';
import { WorkoutLog, BodyPart } from '../types';
import { StorageService } from '../services/storage';

export const HistoryScreen: React.FC = () => {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const loadLogs = async () => {
    const data = await StorageService.getWorkoutLogs();
    setLogs(data);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
    setRefreshing(false);
  };

  // Metrics calculations
  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const totalCalories = logs.reduce((sum, l) => sum + l.totalCalories, 0);
  const totalSets = logs.reduce((sum, l) => sum + l.totalSetsCompleted, 0);

  // Body part frequency analysis
  const partCountMap: { [key in BodyPart]?: number } = {};
  logs.forEach(log => {
    log.targetParts.forEach(part => {
      partCountMap[part] = (partCountMap[part] || 0) + 1;
    });
  });

  const totalPartHits = Object.values(partCountMap).reduce((a, b) => a + b, 0) || 1;

  // Calendar dates generation (last 14 days)
  const daysList: { dateStr: string; dayNum: number; dayName: string; hasWorkout: boolean }[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const hasWorkout = logs.some(l => l.date === dateStr);
    daysList.push({
      dateStr,
      dayNum: d.getDate(),
      dayName: dayNames[d.getDay()],
      hasWorkout,
    });
  }

  // Logs filtered for selected date (or all recent logs if none on selected date)
  const filteredLogs = logs.filter(l => l.date === selectedDate);
  const displayLogs = filteredLogs.length > 0 ? filteredLogs : logs;

  return (
    <View style={styles.container}>
      <Header
        title="📅 나의 운동 기록"
        subtitle="꾸준한 기록이 만들어내는 확실한 신체 변화"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* 1. Overall Summary Metric Cards */}
        <View style={styles.summaryGrid}>
          <View style={styles.metricCard}>
            <Award size={18} color={colors.accentAmber} />
            <Text style={styles.metricVal}>{totalWorkouts}회</Text>
            <Text style={styles.metricLabel}>총 완료 횟수</Text>
          </View>

          <View style={styles.metricCard}>
            <Clock size={18} color={colors.primary} />
            <Text style={styles.metricVal}>{totalMinutes}분</Text>
            <Text style={styles.metricLabel}>누적 시간</Text>
          </View>

          <View style={styles.metricCard}>
            <Flame size={18} color={colors.accentOrange} />
            <Text style={styles.metricVal}>{totalCalories}</Text>
            <Text style={styles.metricLabel}>총 kcal</Text>
          </View>

          <View style={styles.metricCard}>
            <Dumbbell size={18} color={colors.accent} />
            <Text style={styles.metricVal}>{totalSets}세트</Text>
            <Text style={styles.metricLabel}>수행한 세트</Text>
          </View>
        </View>

        {/* 2. 14-Day Calendar Strip */}
        <View style={styles.calendarSection}>
          <View style={styles.sectionHeader}>
            <CalendarIcon size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>운동 캘린더 (최근 2주)</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarScroll}>
            {daysList.map(item => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <TouchableOpacity
                  key={item.dateStr}
                  style={[
                    styles.dayChip,
                    isSelected && styles.dayChipSelected,
                    item.hasWorkout && styles.dayChipWorkout,
                  ]}
                  onPress={() => setSelectedDate(item.dateStr)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayNameText, isSelected && styles.dayTextActive]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.dayNumText, isSelected && styles.dayTextActive]}>
                    {item.dayNum}
                  </Text>
                  {item.hasWorkout && <View style={styles.workoutIndicatorDot} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 3. Target Body Part Frequency Stats */}
        <View style={styles.partStatsSection}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>자주 운동한 부위 분석</Text>
          </View>

          <View style={styles.partBarsContainer}>
            {BODY_PARTS_INFO.map(part => {
              const count = partCountMap[part.id as BodyPart] || 0;
              const percent = Math.round((count / totalPartHits) * 100);
              return (
                <View key={part.id} style={styles.partBarRow}>
                  <View style={styles.partBarLabelWrap}>
                    <Text style={styles.partBarName}>{part.name}</Text>
                    <Text style={styles.partBarCount}>{count}회 ({percent}%)</Text>
                  </View>
                  <View style={styles.partBarTrack}>
                    <View
                      style={[
                        styles.partBarFill,
                        { width: `${Math.max(4, percent)}%`, backgroundColor: part.color },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 4. Workout Logs List */}
        <View style={styles.logsSection}>
          <View style={styles.sectionHeader}>
            <Award size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>
              {filteredLogs.length > 0 ? `${selectedDate} 기록` : '전체 운동 기록'}
            </Text>
          </View>

          {displayLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>아직 완료된 운동 기록이 없습니다.</Text>
              <Text style={styles.emptySubText}>AI 루틴을 시작하여 첫 운동을 기록해보세요!</Text>
            </View>
          ) : (
            displayLogs.map(log => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <View>
                    <Text style={styles.logTitle}>{log.routineTitle}</Text>
                    <Text style={styles.logDateText}>{log.date}</Text>
                  </View>
                  <View style={styles.logCalorieBadge}>
                    <Flame size={12} color={colors.accentOrange} />
                    <Text style={styles.logCalorieText}>{log.totalCalories} kcal</Text>
                  </View>
                </View>

                {/* Target parts tags */}
                <View style={styles.logPartsRow}>
                  {log.targetParts.map(p => (
                    <View key={p} style={styles.logPartTag}>
                      <Text style={styles.logPartTagText}>
                        {BODY_PARTS_INFO.find(info => info.id === p)?.name || p}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.logDurationText}>⏱️ {log.durationMinutes}분 소요</Text>
                  <Text style={styles.logDurationText}>💪 {log.totalSetsCompleted}세트 완료</Text>
                </View>

                {/* Completed Exercises Checklist */}
                <View style={styles.exercisesCompletedList}>
                  {log.completedExercises.map((ex, idx) => (
                    <View key={idx} style={styles.completedExItem}>
                      <Text style={styles.completedExName}>{ex.name}</Text>
                      <Text style={styles.completedExSets}>
                        {ex.completedSets}/{ex.totalSets} 세트
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
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
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  calendarSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  calendarScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dayChip: {
    width: 48,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  dayChipSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  dayChipWorkout: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  dayNameText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  dayNumText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  dayTextActive: {
    color: colors.primaryLight,
  },
  workoutIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    position: 'absolute',
    bottom: 4,
  },
  partStatsSection: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  partBarsContainer: {
    gap: 12,
  },
  partBarRow: {},
  partBarLabelWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  partBarName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  partBarCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  partBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.bgInput,
    borderRadius: 4,
    overflow: 'hidden',
  },
  partBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  logsSection: {},
  emptyState: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySubText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  logCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  logDateText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  logCalorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logCalorieText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accentOrange,
  },
  logPartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginVertical: 10,
  },
  logPartTag: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  logPartTagText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  logDurationText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  exercisesCompletedList: {
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  completedExItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedExName: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  completedExSets: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
