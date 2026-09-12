import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../../theme/colors';
import { Camera, Image as ImageIcon, Sparkles, X, Check, Dumbbell, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { AIService, AIEstimationResult } from '../../services/aiService';
import { Equipment, EquipmentCategory, BodyPart } from '../../types';
import { PRESET_EQUIPMENTS } from '../../data/presetEquipments';

interface AddEquipmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAddEquipment: (equipment: Equipment) => void;
}

export const AddEquipmentModal: React.FC<AddEquipmentModalProps> = ({
  visible,
  onClose,
  onAddEquipment,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIEstimationResult | null>(null);
  const [customName, setCustomName] = useState('');
  const [selectedParts, setSelectedParts] = useState<BodyPart[]>(['chest', 'shoulder']);
  const [activeTab, setActiveTab] = useState<'ai' | 'presets' | 'custom'>('ai');

  const resetState = () => {
    setSelectedImage(null);
    setIsAnalyzing(false);
    setAiResult(null);
    setCustomName('');
    setSelectedParts(['chest', 'shoulder']);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 1. Pick image from gallery
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '기구 사진을 업로드하려면 앨범 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const fileName = result.assets[0].fileName || '';
      setSelectedImage(uri);
      runAIAnalysis(uri, fileName);
    }
  };

  // 2. Take photo with camera
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('권한 필요', '기구를 촬영하려면 카메라 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri);
      runAIAnalysis(uri, 'camera_capture.jpg');
    }
  };

  // 3. AI Analysis pipeline
  const runAIAnalysis = async (uri: string, fileName?: string) => {
    setIsAnalyzing(true);
    setAiResult(null);
    try {
      const result = await AIService.estimateEquipmentFromImage(uri, fileName);
      setAiResult(result);
      setCustomName(result.name);
      setSelectedParts(result.targetParts);
    } catch (e) {
      Alert.alert('분석 실패', 'AI 기구 분석 중 오류가 발생했습니다. 직접 이름을 입력해 등록할 수 있습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Confirm AI Result
  const confirmAiEquipment = () => {
    if (!aiResult) return;
    const newEquipment: Equipment = {
      id: 'eq_' + Date.now(),
      name: customName || aiResult.name,
      category: aiResult.category,
      imageUrl: selectedImage || undefined,
      createdAt: new Date().toISOString(),
      description: aiResult.description,
      targetParts: selectedParts,
      isCustom: true,
    };
    onAddEquipment(newEquipment);
    handleClose();
  };

  // 5. Preset selection
  const handleSelectPreset = (preset: Equipment) => {
    const newEquipment: Equipment = {
      ...preset,
      id: 'eq_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    onAddEquipment(newEquipment);
    handleClose();
  };

  // 6. Custom manual add
  const handleCustomAdd = () => {
    if (!customName.trim()) {
      Alert.alert('알림', '운동기구 이름을 입력해주세요.');
      return;
    }
    const newEquipment: Equipment = {
      id: 'eq_custom_' + Date.now(),
      name: customName.trim(),
      category: 'other',
      createdAt: new Date().toISOString(),
      description: '사용자 직접 등록 기구',
      targetParts: selectedParts,
      isCustom: true,
    };
    onAddEquipment(newEquipment);
    handleClose();
  };

  const togglePart = (part: BodyPart) => {
    if (selectedParts.includes(part)) {
      if (selectedParts.length > 1) {
        setSelectedParts(selectedParts.filter(p => p !== part));
      }
    } else {
      setSelectedParts([...selectedParts, part]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>📷 운동기구 등록</Text>
              <Text style={styles.subtitle}>사진 촬영으로 AI가 기구를 자동 인식합니다</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ai' && styles.tabBtnActive]}
              onPress={() => setActiveTab('ai')}
            >
              <Sparkles size={16} color={activeTab === 'ai' ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'ai' && styles.tabTextActive]}>AI 사진 인식</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'presets' && styles.tabBtnActive]}
              onPress={() => setActiveTab('presets')}
            >
              <Dumbbell size={16} color={activeTab === 'presets' ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'presets' && styles.tabTextActive]}>인기 기구 목록</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'custom' && styles.tabBtnActive]}
              onPress={() => setActiveTab('custom')}
            >
              <Plus size={16} color={activeTab === 'custom' ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>직접 입력</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollContent}>
            {/* TAB 1: AI CAMERA / PHOTO UPLOAD */}
            {activeTab === 'ai' && (
              <View style={styles.aiTabContainer}>
                {!selectedImage ? (
                  <View style={styles.photoActionCard}>
                    <Text style={styles.actionGuide}>기구의 사진을 찍거나 앨범에서 선택하세요</Text>
                    <View style={styles.btnGroup}>
                      <TouchableOpacity style={styles.actionBtnPrimary} onPress={takePhoto} activeOpacity={0.8}>
                        <Camera size={22} color={colors.textInverse} />
                        <Text style={styles.actionBtnTextPrimary}>카메라로 촬영</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={styles.actionBtnSecondary} onPress={pickImage} activeOpacity={0.8}>
                        <ImageIcon size={22} color={colors.textPrimary} />
                        <Text style={styles.actionBtnTextSecondary}>앨범에서 사진 선택</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
                    
                    {/* Retake button */}
                    <TouchableOpacity style={styles.repickBtn} onPress={pickImage}>
                      <Camera size={14} color={colors.textPrimary} />
                      <Text style={styles.repickText}>사진 다시 선택</Text>
                    </TouchableOpacity>

                    {/* AI Analyzing Spinner */}
                    {isAnalyzing && (
                      <View style={styles.analyzingCard}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.analyzingTitle}>AI가 운동기구를 정밀 분석 중입니다...</Text>
                        <Text style={styles.analyzingDesc}>기구 종류 및 최적의 운동 부위를 파악하고 있습니다</Text>
                      </View>
                    )}

                    {/* AI Result Card */}
                    {aiResult && !isAnalyzing && (
                      <View style={styles.resultCard}>
                        <View style={styles.resultBadgeRow}>
                          <View style={styles.confidenceBadge}>
                            <Sparkles size={13} color={colors.primary} />
                            <Text style={styles.confidenceText}>
                              AI 신뢰도 {Math.round(aiResult.confidence * 100)}%
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.detectedLabel}>감지된 운동기구</Text>
                        <TextInput
                          style={styles.nameInput}
                          value={customName}
                          onChangeText={setCustomName}
                          placeholder="기구 이름"
                          placeholderTextColor={colors.textMuted}
                        />

                        <Text style={styles.detectedDesc}>{aiResult.description}</Text>

                        {/* Target Parts */}
                        <Text style={styles.subTitle}>추천 자극 부위</Text>
                        <View style={styles.partsRow}>
                          {BODY_PARTS_INFO.map(part => {
                            const isSelected = selectedParts.includes(part.id as BodyPart);
                            return (
                              <TouchableOpacity
                                key={part.id}
                                style={[styles.partPill, isSelected && styles.partPillActive]}
                                onPress={() => togglePart(part.id as BodyPart)}
                              >
                                <Text style={[styles.partPillText, isSelected && styles.partPillTextActive]}>
                                  {part.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        {/* Suggested Exercises */}
                        {aiResult.suggestedExercises.length > 0 && (
                          <View style={styles.suggestedList}>
                            <Text style={styles.subTitle}>이 기구로 할 수 있는 대표 운동</Text>
                            {aiResult.suggestedExercises.map((ex, i) => (
                              <View key={i} style={styles.suggestedItem}>
                                <Check size={14} color={colors.primary} />
                                <Text style={styles.suggestedText}>{ex}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmAiEquipment} activeOpacity={0.8}>
                          <Check size={18} color={colors.textInverse} />
                          <Text style={styles.confirmBtnText}>이 기구 등록하기</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: PRESETS */}
            {activeTab === 'presets' && (
              <View style={styles.presetsContainer}>
                <Text style={styles.sectionHeader}>집에서 자주 쓰는 운동기구를 원클릭으로 추가하세요</Text>
                {PRESET_EQUIPMENTS.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.presetItem}
                    onPress={() => handleSelectPreset(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.presetIconWrap}>
                      <Dumbbell size={20} color={colors.primary} />
                    </View>
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{item.name}</Text>
                      <Text style={styles.presetDesc} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <View style={styles.addIconWrap}>
                      <Plus size={18} color={colors.primary} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* TAB 3: CUSTOM DIRECT ADD */}
            {activeTab === 'custom' && (
              <View style={styles.customContainer}>
                <Text style={styles.inputLabel}>운동기구 이름</Text>
                <TextInput
                  style={styles.customTextInput}
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="예: 멀티 홈짐, 악력기, 짐볼 등"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { marginTop: 16 }]}>주요 운동 부위 선택</Text>
                <View style={styles.partsRow}>
                  {BODY_PARTS_INFO.map(part => {
                    const isSelected = selectedParts.includes(part.id as BodyPart);
                    return (
                      <TouchableOpacity
                        key={part.id}
                        style={[styles.partPill, isSelected && styles.partPillActive]}
                        onPress={() => togglePart(part.id as BodyPart)}
                      >
                        <Text style={[styles.partPillText, isSelected && styles.partPillTextActive]}>
                          {part.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleCustomAdd} activeOpacity={0.8}>
                  <Check size={18} color={colors.textInverse} />
                  <Text style={styles.confirmBtnText}>기구 직접 등록 완료</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.bgInput,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: 20,
  },
  aiTabContainer: {},
  photoActionCard: {
    backgroundColor: colors.bgInput,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderLight,
  },
  actionGuide: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  btnGroup: {
    width: '100%',
    gap: 12,
  },
  actionBtnPrimary: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnTextPrimary: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
  actionBtnSecondary: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnTextSecondary: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  repickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.bgInput,
    borderRadius: 8,
  },
  repickText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  analyzingCard: {
    marginTop: 16,
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 16,
    width: '100%',
  },
  analyzingTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  analyzingDesc: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  resultCard: {
    marginTop: 16,
    width: '100%',
    backgroundColor: colors.bgInput,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resultBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  confidenceText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  detectedLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 4,
  },
  nameInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  detectedDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  subTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  partsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  partPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  partPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  partPillText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  partPillTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  suggestedList: {
    marginBottom: 16,
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  suggestedText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  confirmBtnText: {
    color: colors.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  presetsContainer: {},
  sectionHeader: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgInput,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  presetDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  addIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customContainer: {
    paddingTop: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  customTextInput: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 15,
  },
});
