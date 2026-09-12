import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { colors } from './src/theme/colors';
import { HomeScreen } from './src/screens/HomeScreen';
import { EquipmentScreen } from './src/screens/EquipmentScreen';
import { AIRoutineScreen } from './src/screens/AIRoutineScreen';
import { ActiveWorkoutScreen } from './src/screens/ActiveWorkoutScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import {
  Home,
  Camera,
  Sparkles,
  Calendar,
  Settings,
  Dumbbell,
} from 'lucide-react-native';
import { BodyPart, WorkoutRoutine, WorkoutLog } from './src/types';

type TabType = 'home' | 'equipment' | 'ai_routine' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [activeWorkoutRoutine, setActiveWorkoutRoutine] = useState<WorkoutRoutine | null>(null);
  const [selectedBodyPartForRoutine, setSelectedBodyPartForRoutine] = useState<BodyPart | undefined>(undefined);

  // Quick launch workout
  const handleStartWorkout = (routine: WorkoutRoutine) => {
    setActiveWorkoutRoutine(routine);
  };

  // Workout completed
  const handleFinishWorkout = (log: WorkoutLog) => {
    setActiveWorkoutRoutine(null);
    setActiveTab('history');
  };

  // Select body part from Home screen and navigate to AI routine
  const handleSelectBodyPartFromHome = (part: BodyPart) => {
    setSelectedBodyPartForRoutine(part);
    setActiveTab('ai_routine');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Active Workout Fullscreen Mode */}
      {activeWorkoutRoutine ? (
        <ActiveWorkoutScreen
          routine={activeWorkoutRoutine}
          onFinishWorkout={handleFinishWorkout}
          onExit={() => setActiveWorkoutRoutine(null)}
        />
      ) : (
        <View style={styles.container}>
          {/* Active Screen Tab View */}
          <View style={styles.screenContainer}>
            {activeTab === 'home' && (
              <HomeScreen
                onStartWorkout={handleStartWorkout}
                onNavigateToTab={tab => setActiveTab(tab)}
                onSelectBodyPart={handleSelectBodyPartFromHome}
              />
            )}

            {activeTab === 'equipment' && <EquipmentScreen />}

            {activeTab === 'ai_routine' && (
              <AIRoutineScreen
                initialSelectedPart={selectedBodyPartForRoutine}
                onStartWorkout={handleStartWorkout}
              />
            )}

            {activeTab === 'history' && <HistoryScreen />}

            {activeTab === 'settings' && (
              <SettingsScreen onNavigateToEquipment={() => setActiveTab('equipment')} />
            )}
          </View>

          {/* Bottom Tab Bar */}
          <View style={styles.tabBar}>
            {/* 1. Home */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('home')}
              activeOpacity={0.7}
            >
              <Home
                size={22}
                color={activeTab === 'home' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'home' && styles.tabLabelActive,
                ]}
              >
                홈
              </Text>
            </TouchableOpacity>

            {/* 2. Equipment */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('equipment')}
              activeOpacity={0.7}
            >
              <Camera
                size={22}
                color={activeTab === 'equipment' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'equipment' && styles.tabLabelActive,
                ]}
              >
                기구 등록
              </Text>
            </TouchableOpacity>

            {/* 3. AI Routine Center Button */}
            <TouchableOpacity
              style={styles.centerTabItem}
              onPress={() => {
                setSelectedBodyPartForRoutine(undefined);
                setActiveTab('ai_routine');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.centerTabCircle}>
                <Sparkles size={24} color={colors.textInverse} />
              </View>
              <Text style={styles.centerTabLabel}>AI 추천</Text>
            </TouchableOpacity>

            {/* 4. History */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('history')}
              activeOpacity={0.7}
            >
              <Calendar
                size={22}
                color={activeTab === 'history' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'history' && styles.tabLabelActive,
                ]}
              >
                운동 기록
              </Text>
            </TouchableOpacity>

            {/* 5. Settings */}
            <TouchableOpacity
              style={styles.tabItem}
              onPress={() => setActiveTab('settings')}
              activeOpacity={0.7}
            >
              <Settings
                size={22}
                color={activeTab === 'settings' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === 'settings' && styles.tabLabelActive,
                ]}
              >
                설정
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  screenContainer: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 82 : 68,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerTabCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  centerTabLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryLight,
    marginTop: 4,
  },
});
