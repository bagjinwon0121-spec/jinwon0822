import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { colors, BODY_PARTS_INFO } from '../theme/colors';
import { Header } from '../components/common/Header';
import {
  Camera,
  Plus,
  Trash2,
  Dumbbell,
  Sparkles,
  Layers,
  CheckCircle,
  HelpCircle,
} from 'lucide-react-native';
import { Equipment } from '../types';
import { StorageService } from '../services/storage';
import { AddEquipmentModal } from '../components/equipment/AddEquipmentModal';

export const EquipmentScreen: React.FC = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const loadEquipments = async () => {
    const list = await StorageService.getUserEquipments();
    setEquipments(list);
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  const handleAddEquipment = async (newEq: Equipment) => {
    const updated = await StorageService.addEquipment(newEq);
    setEquipments(updated);
    Alert.alert('등록 완료', `'${newEq.name}'이(가) 내 운동기구 목록에 등록되었습니다!`);
  };

  const handleDeleteEquipment = (id: string, name: string) => {
    if (id === 'eq_bodyweight') {
      Alert.alert('알림', '맨몸 운동은 기본 옵션이므로 삭제할 수 없습니다.');
      return;
    }

    Alert.alert('기구 삭제', `'${name}'을(를) 기구 목록에서 삭제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const updated = await StorageService.removeEquipment(id);
          setEquipments(updated);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Header
        title="📷 운동기구 관리"
        subtitle="등록된 기구를 토대로 AI가 최적의 운동을 설계합니다"
        rightAction={{
          icon: <Plus size={20} color={colors.primary} />,
          onPress: () => setIsAddModalOpen(true),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Banner: AI Equipment Registration Button */}
        <TouchableOpacity
          style={styles.aiRegisterBanner}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.85}
        >
          <View style={styles.bannerIconWrap}>
            <Camera size={26} color={colors.primary} />
          </View>
          <View style={styles.bannerTextWrap}>
            <View style={styles.badgeRow}>
              <Sparkles size={13} color={colors.accentOrange} />
              <Text style={styles.bannerBadgeText}>AI 비전 인식</Text>
            </View>
            <Text style={styles.bannerTitle}>사진 찍고 운동기구 등록하기</Text>
            <Text style={styles.bannerSubtitle}>덤벨, 풀업바, 밴드 등을 촬영하면 AI가 즉시 분석합니다</Text>
          </View>
          <View style={styles.bannerAddBtn}>
            <Plus size={18} color={colors.textInverse} />
          </View>
        </TouchableOpacity>

        {/* Section Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>등록된 기구 목록</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{equipments.length}개 보유 중</Text>
          </View>
        </View>

        {/* Equipment Card List */}
        {equipments.map(item => {
          const isBodyweight = item.id === 'eq_bodyweight';
          return (
            <View key={item.id} style={styles.equipCard}>
              <View style={styles.cardHeader}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.equipThumb} />
                ) : (
                  <View style={styles.defaultIconWrap}>
                    <Dumbbell size={22} color={colors.primary} />
                  </View>
                )}

                <View style={styles.cardInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.equipName}>{item.name}</Text>
                    {item.isCustom && (
                      <View style={styles.customBadge}>
                        <Text style={styles.customBadgeText}>사용자 등록</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.equipDesc} numberOfLines={2}>
                    {item.description || '다양한 부위의 홈트레이닝에 활용 가능'}
                  </Text>
                </View>

                {!isBodyweight && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteEquipment(item.id, item.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Target Parts Tags */}
              {item.targetParts && item.targetParts.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.tagLabel}>추천 자극 부위:</Text>
                  <View style={styles.tagWrap}>
                    {item.targetParts.map(partId => {
                      const part = BODY_PARTS_INFO.find(p => p.id === partId);
                      return (
                        <View key={partId} style={styles.partTag}>
                          <Text style={styles.partTagText}>{part?.name || partId}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <HelpCircle size={16} color={colors.accent} />
          <Text style={styles.tipText}>
            새로운 운동기구를 등록하면 AI 루틴 생성 시 해당 기구를 적극적으로 활용한 새로운 운동들이 자동으로 추가됩니다!
          </Text>
        </View>
      </ScrollView>

      {/* Add / AI Scan Modal */}
      <AddEquipmentModal
        visible={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddEquipment={handleAddEquipment}
      />
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
  aiRegisterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  bannerIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bannerTextWrap: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  bannerBadgeText: {
    fontSize: 11,
    color: colors.accentOrange,
    fontWeight: '700',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bannerAddBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  countBadge: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countText: {
    fontSize: 12,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  equipCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  equipThumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  defaultIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  equipName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  customBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 10,
    color: colors.accentLight,
    fontWeight: '700',
  },
  equipDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  deleteBtn: {
    padding: 6,
    marginLeft: 6,
  },
  tagsContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partTag: {
    backgroundColor: colors.bgInput,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  partTagText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.accentLight,
    lineHeight: 18,
  },
});
