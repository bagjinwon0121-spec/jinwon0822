import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  Settings,
  Target,
  Sliders,
  Clock,
  Timer,
  Volume2,
  Vibrate,
  Dumbbell,
  RotateCcw,
  ShieldAlert,
  ChevronRight,
  User,
} from 'lucide-react-native';
import { UserSettings, FitnessGoal, Difficulty } from '../types';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';

interface SettingsScreenProps {
  onNavigateToEquipment: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onNavigateToEquipment,
}) => {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await StorageService.getUserSettings();
    setSettings(data);
  };

  const updateSetting = async <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await StorageService.saveUserSettings(updated);
  };

  const handleResetData = () => {
    Alert.alert(
      '데이터 초기화',
      '모든 등록 기구, 운동 기록, 설정이 기본값으로 초기화됩니다. 계속하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '초기화',
          style: 'destructive',
          onPress: async () => {
            await StorageService.resetAllData();
            await loadSettings();
            Alert.alert('초기화 완료', '모든 데이터가 기본 상태로 복원되었습니다.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="⚙️ 환경 설정"
        subtitle="나에게 맞춘 운동 목표 및 타이머 환경 설정"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* 1. Fitness Goal */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>운동 목표</Text>
          </View>

          <View style={styles.choiceGroup}>
            {(
              [
                { id: 'hypertrophy', label: '근육량 증가 (근비대)', desc: '적절한 세트와 볼륨 중심' },
                { id: 'strength', label: '스트렝스 (근력 강화)', desc: '고강도 및 긴 휴식 시간' },
                { id: 'diet', label: '체지방 감량 (다이어트)', desc: '높은 반복수와 짧은 휴식' },
                { id: 'health', label: '건강 유지 & 체력 증진', desc: '전신 밸런스와 기초 체력' },
              ] as { id: FitnessGoal; label: string; desc: string }[]
            ).map(item => {
              const isSelected = settings.fitnessGoal === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.choiceItem, isSelected && styles.choiceItemActive]}
                  onPress={() => updateSetting('fitnessGoal', item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.choiceRadio}>
                    {isSelected && <View style={styles.choiceRadioDot} />}
                  </View>
                  <View style={styles.choiceTextWrap}>
                    <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelActive]}>
                      {item.label}
                    </Text>
                    <Text style={styles.choiceDesc}>{item.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Default Difficulty */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>기본 운동 난이도</Text>
          </View>

          <View style={styles.segmentedRow}>
            {(
              [
                { id: 'beginner', label: '초급' },
                { id: 'intermediate', label: '중급' },
                { id: 'advanced', label: '고급' },
              ] as { id: Difficulty; label: string }[]
            ).map(d => {
              const isSelected = settings.defaultDifficulty === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                  onPress={() => updateSetting('defaultDifficulty', d.id)}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Default Rest Timer */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Timer size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>세트 간 기본 휴식 시간</Text>
          </View>

          <View style={styles.segmentedRow}>
            {[30, 45, 60, 90].map(sec => {
              const isSelected = settings.defaultRestSeconds === sec;
              return (
                <TouchableOpacity
                  key={sec}
                  style={[styles.segmentBtn, isSelected && styles.segmentBtnActive]}
                  onPress={() => updateSetting('defaultRestSeconds', sec)}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {sec}초
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Equipment Management Link */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.linkCard} onPress={onNavigateToEquipment} activeOpacity={0.7}>
            <View style={styles.linkLeft}>
              <Dumbbell size={20} color={colors.primary} />
              <View>
                <Text style={styles.linkLabel}>등록된 운동기구 관리</Text>
                <Text style={styles.linkSub}>보유 기구 추가/삭제 및 AI 사진 재분석</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* 5. Sound & Haptics Toggle */}
        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Volume2 size={18} color={colors.textPrimary} />
              <Text style={styles.toggleLabel}>효과음 및 사운드 알림</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={v => updateSetting('soundEnabled', v)}
              trackColor={{ false: colors.bgInput, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.toggleRow, { marginTop: 10 }]}>
            <View style={styles.toggleLeft}>
              <Vibrate size={18} color={colors.textPrimary} />
              <Text style={styles.toggleLabel}>진동 피드백 (햅틱)</Text>
            </View>
            <Switch
              value={settings.vibrationEnabled}
              onValueChange={v => updateSetting('vibrationEnabled', v)}
              trackColor={{ false: colors.bgInput, true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 6. Data Reset */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleResetData} activeOpacity={0.8}>
            <RotateCcw size={16} color={colors.error} />
            <Text style={styles.resetBtnText}>데이터 초기화 및 기본값 복원</Text>
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>홈트 AI 플래너 v1.0.0</Text>
          <Text style={styles.footerSubText}>집에 있는 기구로 완성하는 맞춤 운동</Text>
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
  section: {
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  choiceGroup: {
    gap: 8,
  },
  choiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  choiceItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  choiceRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  choiceRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  choiceTextWrap: {
    flex: 1,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  choiceLabelActive: {
    color: colors.primaryLight,
  },
  choiceDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    backgroundColor: colors.bgInput,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textInverse,
    fontWeight: '800',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  linkSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
  footerSubText: {
    fontSize: 11,
    color: colors.textDisabled,
    marginTop: 2,
  },
});
