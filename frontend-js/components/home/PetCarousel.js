import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  FlatList,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// Web 平台需要考虑父容器的最大宽度限制 (448px)，并留出左右边距和箭头按钮空间
// 父容器最大宽度 448px - 左右padding 24px - 左右箭头 40px = 384px 可用宽度
const MAX_CARD_WIDTH = Platform.OS === 'web' ? 340 : 420; // Web 上使用更小的宽度
// 实际卡片视觉宽度（相对屏幕留白）
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.75, MAX_CARD_WIDTH);
// 卡片之间的间距
const CARD_SPACING = 16;
// FlatList 中实际的 item 宽度（= 卡片 + 间距，用于精确 snap）
const ITEM_WIDTH = CARD_WIDTH + CARD_SPACING;
const SIDE_CARD_SCALE = 0.88;
const SIDE_CARD_OPACITY = 0.6;
const SIDE_CARD_TRANSLATE_Y = 20;

const PetCarousel = ({
  pets,
  loading,
  currentPetIndex,
  onPetChange,
  onAddPet,
  isDarkMode,
  taskStatsByPetId = {},
}) => {
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [internalIndex, setInternalIndex] = useState(
    typeof currentPetIndex === 'number' ? currentPetIndex : 0
  );

  const totalItems = pets.length + 1; // +1 for add card

  // 当前用于展示和高亮的索引：以内部状态为主，但会跟随外部 props 同步
  const activeIndex = internalIndex;

  // 统一的跳转函数：用于左右箭头、分页指示器点击等场景
  const goToIndex = (index) => {
    const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));

    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: clampedIndex,
          animated: true,
        });
      } catch (e) {
        // 兜底：直接按偏移量滚动
        flatListRef.current.scrollToOffset({
          offset: clampedIndex * ITEM_WIDTH,
          animated: true,
        });
      }
    }

    if (clampedIndex !== internalIndex) {
      setInternalIndex(clampedIndex);
    }

    if (onPetChange && clampedIndex !== currentPetIndex) {
      onPetChange(clampedIndex);
    }
  };

  const handlePrev = () => {
    if (activeIndex <= 0) return;
    goToIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex >= totalItems - 1) return;
    goToIndex(activeIndex + 1);
  };

  // Helper function to get species emoji
  const getSpeciesEmoji = (species) => {
    const speciesMap = {
      'dog': '🐕',
      'cat': '🐈',
      'bird': '🐦',
      'rabbit': '🐰',
      'hamster': '🐹',
      'fish': '🐠',
      'reptile': '🦎',
      'other': '🐾',
    };
    return speciesMap[species?.toLowerCase()] || '🐾';
  };

  // Helper function to calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return '年龄未知';
    
    const birth = new Date(birthDate);
    const today = new Date();
    const years = today.getFullYear() - birth.getFullYear();
    const months = today.getMonth() - birth.getMonth();
    
    if (years === 0) {
      if (months === 0) {
        const days = Math.floor((today - birth) / (1000 * 60 * 60 * 24));
        return `${days}天`;
      }
      return `${months}个月`;
    } else if (years < 2) {
      const totalMonths = years * 12 + months;
      return `${totalMonths}个月`;
    }
    return `${years}岁`;
  };

  // Render individual pet card
  const renderPetCard = ({ item, index }) => {
    const isAddCard = item.isAddCard;
    const petId = item.id;
    const stats = !isAddCard && petId ? taskStatsByPetId[petId] : null;

    // 计算卡片动画（基于 ITEM_WIDTH，确保选中卡片居中且动画正确）
    const inputRange = [
      (index - 1) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + 1) * ITEM_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_SCALE, 1, SIDE_CARD_SCALE],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_OPACITY, 1, SIDE_CARD_OPACITY],
      extrapolate: 'clamp',
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [SIDE_CARD_TRANSLATE_Y, 0, SIDE_CARD_TRANSLATE_Y],
      extrapolate: 'clamp',
    });

    // 每只宠物的任务统计（来自父组件计算）
    const goalsCompleted = stats?.completed || 0;
    const goalsTotal = stats?.total || 0;
    const goalsProgress = goalsTotal > 0 ? (goalsCompleted / goalsTotal) * 100 : 0;
    const nextTask = isAddCard ? null : stats?.nextTask || null;

    return (
      <View style={styles.carouselCardContainer}>
        <Animated.View
          style={[
            styles.petCardCarousel,
            isDarkMode && styles.petCardCarouselDark,
            {
              opacity,
              transform: [
                { scale },
                { translateY },
              ],
            },
          ]}
        >
          {isAddCard ? (
            <TouchableOpacity
              style={[styles.addPetCardLarge, isDarkMode && styles.addPetCardLargeDark]}
              onPress={onAddPet}
              activeOpacity={0.9}
            >
              <View style={styles.addPetIconLarge}>
                <Ionicons name="add-circle" size={48} color="#F97316" />
              </View>
              <Text style={[styles.addPetTitle, isDarkMode && styles.addPetTitleDark]}>
                添加新宠物
              </Text>
              <Text style={[styles.addPetSubtitle, isDarkMode && styles.addPetSubtitleDark]}>
                点击创建宠物档案
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* 上半部分：宠物信息 + 每日目标 */}
              <View style={styles.petCardTopSection}>
                {/* 左侧：宠物信息 */}
                <View style={styles.petInfoSection}>
                  <View style={styles.petImageContainerSmall}>
                    <View style={styles.petImagePlaceholderSmall}>
                      <Text style={styles.petImageEmojiSmall}>
                        {getSpeciesEmoji(item.species)}
                      </Text>
                    </View>
                    {item.isPrimary && (
                      <View style={styles.petBadgeSmall}>
                        <Ionicons name="star" size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={styles.petDetailsCompact}>
                    <Text style={[styles.petName, isDarkMode && styles.petNameDark]}>
                      {item.name || '未命名'}
                    </Text>
                    {item.breed && (
                      <Text style={[styles.petBreed, isDarkMode && styles.petBreedDark]}>
                        {item.breed}
                      </Text>
                    )}
                    {item.birthDate && (
                      <Text style={[styles.petAge, isDarkMode && styles.petAgeDark]}>
                        {calculateAge(item.birthDate)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* 右侧：每日目标 */}
                <View style={[styles.dailyGoalsSection, isDarkMode && styles.dailyGoalsSectionDark]}>
                  <Text style={[styles.dailyGoalsLabel, isDarkMode && styles.dailyGoalsLabelDark]}>
                    每日目标
                  </Text>
                  <Text style={[styles.dailyGoalsCount, isDarkMode && styles.dailyGoalsCountDark]}>
                    {goalsCompleted}/{goalsTotal}
                  </Text>
                  <View style={[styles.progressBar, isDarkMode && styles.progressBarDark]}>
                    <View
                      style={[
                        styles.progressFill,
                        isDarkMode && styles.progressFillDark,
                        { width: `${goalsProgress}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* 下半部分：下一个任务（去掉多余空白，高度由内容自适应） */}
              <View style={[styles.nextTaskSection, isDarkMode && styles.nextTaskSectionDark]}>
                <View style={styles.nextTaskContent}>
                  <View
                    style={[
                      styles.nextTaskIconContainer,
                      isDarkMode && styles.nextTaskIconContainerDark,
                    ]}
                  >
                    <Ionicons
                      name={nextTask?.icon || 'walk-outline'}
                      size={14}
                      color={isDarkMode ? '#FB923C' : '#FFFFFF'}
                    />
                  </View>
                  <View style={styles.nextTaskInfo}>
                    <Text style={[styles.nextTaskLabel, isDarkMode && styles.nextTaskLabelDark]}>
                      下个任务
                    </Text>
                    <Text style={[styles.nextTaskTitle, isDarkMode && styles.nextTaskTitleDark]}>
                      {nextTask?.title || '暂无任务'}
                    </Text>
                    <View style={styles.nextTaskTimeRow}>
                      <Ionicons
                        name="time-outline"
                        size={11}
                        color={isDarkMode ? '#FED7AA' : 'rgba(255, 255, 255, 0.8)'}
                      />
                      <Text style={[styles.nextTaskTime, isDarkMode && styles.nextTaskTimeDark]}>
                        {nextTask?.time || '--:--'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    );
  };

  // Get item layout for FlatList optimization
  const getItemLayout = (data, index) => ({
    length: ITEM_WIDTH,
    offset: ITEM_WIDTH * index,
    index,
  });

  // Scroll to specific index when currentPetIndex changes externally
  useEffect(() => {
    if (typeof currentPetIndex !== 'number') return;

    // 外部受控索引变化时，同步到内部索引，保持指示器一致
    if (currentPetIndex !== internalIndex) {
      setInternalIndex(currentPetIndex);
    }

    const totalItems = pets.length + 1; // +1 for add card
    if (flatListRef.current && totalItems > 0 && currentPetIndex < totalItems) {
      try {
        flatListRef.current.scrollToIndex({ index: currentPetIndex, animated: true });
      } catch (e) {
        // scrollToIndex 有时在初始渲染会报错，忽略即可
      }
    }
  }, [currentPetIndex, pets.length, internalIndex]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F97316" />
        <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>
          加载中...
        </Text>
      </View>
    );
  }

  // Empty state
  if (!pets || pets.length === 0) {
    return (
      <TouchableOpacity
        style={[styles.emptyPetCard, isDarkMode && styles.emptyPetCardDark]}
        onPress={onAddPet}
        activeOpacity={0.8}
      >
        <View style={styles.emptyPetIcon}>
          <Ionicons name="add-circle" size={48} color="#F97316" />
        </View>
        <Text style={[styles.emptyPetTitle, isDarkMode && styles.emptyPetTitleDark]}>
          添加你的第一个宠物
        </Text>
        <Text style={[styles.emptyPetSubtitle, isDarkMode && styles.emptyPetSubtitleDark]}>
          点击这里创建宠物档案
        </Text>
      </TouchableOpacity>
    );
  }

  // Carousel with pets
  return (
    <View style={styles.carouselContainer}>
      <View style={styles.carouselNavContainer}>
        {/* 左箭头 */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrev}
          disabled={activeIndex === 0}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={activeIndex === 0 ? '#D1D5DB' : '#6B7280'}
          />
        </TouchableOpacity>

        {/* 中间的卡片列表（通过箭头与指示点控制切换） */}
        <Animated.FlatList
          ref={flatListRef}
          data={[...pets, { isAddCard: true }]}
          renderItem={renderPetCard}
          keyExtractor={(item, index) =>
            item.isAddCard ? 'add-card' : item._id || index.toString()
          }
          horizontal
          style={styles.carouselList}
          scrollEnabled={false} // 禁止自身滚动，只通过箭头 / 指示点控制
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          getItemLayout={getItemLayout}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
        />

        {/* 右箭头 */}
        <TouchableOpacity
          style={[
            styles.navButton,
            activeIndex === totalItems - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={activeIndex === totalItems - 1}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={activeIndex === totalItems - 1 ? '#D1D5DB' : '#6B7280'}
          />
        </TouchableOpacity>
      </View>
      
      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {[...pets, { isAddCard: true }].map((_, index) => (
          <TouchableOpacity
            key={index}
            style={styles.paginationDotTouchable}
            onPress={() => goToIndex(index)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.paginationDot,
                isDarkMode && styles.paginationDotDark,
                index === activeIndex && styles.paginationDotActive,
                index === activeIndex && isDarkMode && styles.paginationDotActiveDark,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Loading
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  loadingTextDark: {
    color: '#9CA3AF',
  },

  // Empty state
  emptyPetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 32,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
  },
  emptyPetCardDark: {
    backgroundColor: 'transparent',
    borderColor: '#F97316',
  },
  emptyPetIcon: {
    marginBottom: 16,
  },
  emptyPetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyPetTitleDark: {
    color: '#F9FAFB',
  },
  emptyPetSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyPetSubtitleDark: {
    color: '#9CA3AF',
  },

  // Carousel container
  carouselContainer: {
    marginBottom: 12,
  },
  carouselNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselList: {
    width: ITEM_WIDTH,
  },
  carouselCardContainer: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  navButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },

  // Pet card
  petCardCarousel: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: CARD_WIDTH,
  },
  petCardCarouselDark: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F97316',
  },

  // Top section: Pet info + Daily goals
  petCardTopSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },

  // Pet info section (left)
  petInfoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 2,
  },
  petImageContainerSmall: {
    position: 'relative',
  },
  petImagePlaceholderSmall: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  petImageEmojiSmall: {
    fontSize: 28,
  },
  petBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EA580C',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Pet details (compact)
  petDetailsCompact: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  petNameDark: {
    color: '#F9FAFB',
  },
  petBreed: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  petBreedDark: {
    color: '#FDBA74',
  },
  petAge: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  petAgeDark: {
    color: '#FED7AA',
  },

  // Daily goals section (right)
  dailyGoalsSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: 10,
    padding: 10,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dailyGoalsSectionDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  dailyGoalsLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 3,
    textAlign: 'center',
  },
  dailyGoalsLabelDark: {
    color: '#9CA3AF',
  },
  dailyGoalsCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  dailyGoalsCountDark: {
    color: '#F9FAFB',
  },
  progressBar: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#374151',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2.5,
  },
  progressFillDark: {
    backgroundColor: '#FB923C',
  },

  // Next task section (bottom)
  nextTaskSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nextTaskSectionDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  nextTaskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nextTaskIconContainer: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  nextTaskIconContainerDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  nextTaskInfo: {
    flex: 1,
  },
  nextTaskLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  nextTaskLabelDark: {
    color: '#9CA3AF',
  },
  nextTaskTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  nextTaskTitleDark: {
    color: '#F9FAFB',
  },
  nextTaskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  nextTaskTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  nextTaskTimeDark: {
    color: '#FED7AA',
  },

  // Add pet card
  addPetCardLarge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addPetCardLargeDark: {
    backgroundColor: 'transparent',
    borderColor: '#F97316',
  },
  addPetIconLarge: {
    marginBottom: 12,
  },
  addPetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
    textAlign: 'center',
  },
  addPetTitleDark: {
    color: '#F9FAFB',
  },
  addPetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
  },
  addPetSubtitleDark: {
    color: '#9CA3AF',
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  paginationDotTouchable: {
    padding: 4,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  paginationDotDark: {
    backgroundColor: '#4B5563',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#F97316',
  },
  paginationDotActiveDark: {
    backgroundColor: '#FB923C',
  },
});

export default PetCarousel;

