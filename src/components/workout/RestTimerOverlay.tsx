import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { Timer, Plus, Minus, CheckCircle, FastForward } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface RestTimerOverlayProps {
  visible: boolean;
  restDurationSec: number;
  nextExerciseName?: string;
  currentSetInfo?: string;
  onFinish: () => void;
  onSkip: () => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  visible,
  restDurationSec,
  nextExerciseName,
  currentSetInfo,
  onFinish,
  onSkip,
}) => {
  const [timeLeft, setTimeLeft] = useState(restDurationSec);

  useEffect(() => {
    if (visible) {
      setTimeLeft(restDurationSec);
    }
  }, [visible, restDurationSec]);

  useEffect(() => {
    if (!visible) return;

    if (timeLeft <= 0) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
      onFinish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {}
          onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, timeLeft, onFinish]);

  const addTime = (seconds: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    setTimeLeft(prev => Math.max(5, prev + seconds));
  };

  const progress = Math.min(1, Math.max(0, timeLeft / (restDurationSec || 1)));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Timer size={20} color={colors.accentOrange} />
            </View>
            <Text style={styles.headerTitle}>휴식 시간</Text>
            {currentSetInfo && <Text style={styles.setInfo}>{currentSetInfo}</Text>}
          </View>

          {/* Timer Display */}
          <View style={styles.timerCircleContainer}>
            <View style={styles.timerCenter}>
              <Text style={styles.timerNumber}>{timeLeft}</Text>
              <Text style={styles.timerUnit}>초 남음</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
          </View>

          {/* Next Exercise Preview */}
          {nextExerciseName && (
            <View style={styles.nextPreview}>
              <Text style={styles.nextLabel}>다음 운동</Text>
              <Text style={styles.nextName} numberOfLines={1}>
                {nextExerciseName}
              </Text>
            </View>
          )}

          {/* Quick Adjust Buttons */}
          <View style={styles.adjustRow}>
            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(-15)}>
              <Minus size={16} color={colors.textPrimary} />
              <Text style={styles.adjustText}>-15초</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.adjustBtn} onPress={() => addTime(15)}>
              <Plus size={16} color={colors.textPrimary} />
              <Text style={styles.adjustText}>+15초</Text>
            </TouchableOpacity>
          </View>

          {/* Skip / Complete Button */}
          <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.8}>
            <FastForward size={18} color={colors.textInverse} />
            <Text style={styles.skipBtnText}>휴식 끝내고 바로 시작</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.bgCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  setInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timerCircleContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    borderColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
  },
  timerCenter: {
    alignItems: 'center',
  },
  timerNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  timerUnit: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: -4,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.accentOrange,
    borderRadius: 3,
  },
  nextPreview: {
    width: '100%',
    backgroundColor: colors.bgInput,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  nextName: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16,
  },
  adjustBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.bgInput,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  skipBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  skipBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
});
