import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
  TextInput,
  Alert,
  RefreshControl,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../components/home/Sidebar';
import PetCarousel from '../components/home/PetCarousel';
import ConfettiCelebration from '../components/common/ConfettiCelebration';
import * as storage from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import * as petService from '../services/petService.js';
import * as reminderService from '../services/reminderService.js';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_WIDTH = 448; // max-w-md (28rem = 448px)

// 标签与图标的映射（需与 AddTaskScreen 中保持一致）
const TAG_ICON_MAP = {
  // 宠物日常照护
  '喂食': 'restaurant',
  '饮水': 'water',
  '零食控制': 'nutrition',
  '散步': 'walk',
  '训练': 'school',
  // 健康相关
  '体重记录': 'fitness',
  '疫苗': 'medkit',
  '驱虫': 'bug',
  '体检': 'clipboard',
  '看兽医': 'medkit',
  // 清洁与环境
  '洗澡': 'rainy',
  '美容': 'cut',
  '清洁环境': 'trash',
  '猫砂/厕所': 'cube',
  // 用品与物资
  '购买用品': 'cart',
  '补货': 'refresh-circle',
};

const DEFAULT_TASK_ICON = 'paw';

// 宠物物种与 Emoji 的映射（与 PetCarousel 中保持一致）
const PET_SPECIES_EMOJI_MAP = {
  dog: '🐕',
  cat: '🐈',
  bird: '🐦',
  rabbit: '🐰',
  hamster: '🐹',
  fish: '🐠',
  reptile: '🦎',
  other: '🐾',
};

const getSpeciesEmoji = (species) => {
  if (!species || typeof species !== 'string') return '🐾';
  const key = species.toLowerCase();
  return PET_SPECIES_EMOJI_MAP[key] || '🐾';
};

const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const getIconForTags = (tags) => {
  if (Array.isArray(tags) && tags.length > 0) {
    const tag = tags[0];
    if (TAG_ICON_MAP[tag]) {
      return TAG_ICON_MAP[tag];
    }
  }
  return DEFAULT_TASK_ICON;
};

const formatTimeLabel = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const formatTodayLabel = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const weekday = WEEKDAY_LABELS[now.getDay()];
  return `${y}年${m}月${d}日 ${weekday}`;
};

// 启用 Android 的布局动画
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen({ navigation, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  // 宠物相关状态
  const [pets, setPets] = useState([]);
  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [loadingPets, setLoadingPets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 任务折叠状态
  const [isToDoCollapsed, setIsToDoCollapsed] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);
  
  // 任务过滤器状态
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'done', 'todo'

  // 提醒相关状态
  const [todayReminders, setTodayReminders] = useState([]);
  const [nextReminder, setNextReminder] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(true);
  const [showEmptyConfetti, setShowEmptyConfetti] = useState(false);

  // 根据 petId 在当前宠物列表中查找对应宠物
  const findPetById = (petId) => {
    if (!petId || !Array.isArray(pets)) return null;
    const targetId = String(petId);
    return (
      pets.find((p) => {
        const id = p.id || p._id;
        return id && String(id) === targetId;
      }) || null
    );
  };

  useEffect(() => {
    loadUserData();
  }, []);

  // 使用 useFocusEffect 在页面获得焦点时重新加载宠物
  useFocusEffect(
    useCallback(() => {
      loadPets();
      loadReminders();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const authData = await storage.getAuthData();
      setUserData(authData?.user || null);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  };

  const loadPets = async () => {
    try {
      const authData = await storage.getAuthData();
      if (!authData || !authData.tokens) {
        console.log('未登录，跳过加载宠物');
        setLoadingPets(false);
        setLoadingReminders(false);
        return;
      }

      const userPets = await petService.getUserPets(authData.tokens.accessToken);
      setPets(userPets);
      setLoadingPets(false);
    } catch (error) {
      console.error('加载宠物列表失败:', error);
      setLoadingPets(false);
      
      // 如果是认证错误，可能需要重新登录
      if (error.message.includes('Authentication')) {
        Alert.alert('提示', '登录已过期，请重新登录', [
          {
            text: '确定',
            onPress: () => navigation.navigate('Onboarding'),
          },
        ]);
      }
    }
  };

  const loadReminders = async ({ skipConfetti = false } = {}) => {
    try {
      const authData = await storage.getAuthData();
      if (!authData || !authData.tokens) {
        console.log('[HomeScreen][loadReminders] 未登录，跳过加载提醒');
        setLoadingReminders(false);
        return;
      }

      const token = authData.tokens.accessToken;

      // 只请求「今日提醒」，并用这份数据驱动今日列表 + 「即将开始」卡片
      const today = await reminderService.getTodayReminders(token);

      // ====== 调试日志：接口原始返回 ======
      console.log('[HomeScreen][loadReminders] today reminders raw:', today);

      const todayList = Array.isArray(today) ? today : [];
      setTodayReminders(todayList);

      // 计算今日范围内最近一个「未完成」的待办任务（与 today reminders 对齐）
      const now = new Date();
      const pendingSource = todayList;
      console.log(
        '[HomeScreen][loadReminders] pendingSource (from todayList) length:',
        pendingSource.length
      );

      const pendingWithTime = pendingSource.filter((r) => {
        // 只保留未完成的任务，防止已完成任务仍出现在「即将开始」卡片中
        const isCompleted =
          r.status === 'done' || r.status === 'completed' || r.status === 'archived';
        if (isCompleted) return false;

        const timeSource = r.scheduledAt || r.dueAt || r.snoozeUntil;
        if (!timeSource) return false;
        const dt = new Date(timeSource);
        if (Number.isNaN(dt.getTime())) return false;
        // 这里只做「时间字段有效」校验，不再按是否晚于当前时间过滤，
        // 确保今天早些时候但仍为 pending 的任务也能出现在「即将开始」卡片中
        return true;
      });

      console.log(
        '[HomeScreen][loadReminders] pendingWithTime (filtered & time-valid) length:',
        pendingWithTime.length,
        pendingWithTime
      );

      pendingWithTime.sort((a, b) => {
        const aTime = new Date(a.scheduledAt || a.dueAt || a.snoozeUntil);
        const bTime = new Date(b.scheduledAt || b.dueAt || b.snoozeUntil);
        return aTime - bTime;
      });

      const computedNextReminder = pendingWithTime[0] || null;

      // 当 pendingWithTime 为空时，触发一次烟花彩带特效
      // 为避免在「本地先触发 + 随后重新拉取接口」的同一操作链路中重复触发，
      // 这里增加 skipConfetti 参数控制是否允许在本次 load 中触发动画；
      // 同时保留 showEmptyConfetti 判断，防止在动画尚未结束时再次触发。
      if (pendingWithTime.length === 0 && !skipConfetti && !showEmptyConfetti) {
        console.log(
          '[HomeScreen][loadReminders] pendingWithTime is empty, trigger confetti once'
        );
        setShowEmptyConfetti(true);
      }
      console.log(
        '[HomeScreen][loadReminders] computed nextReminder (to set state):',
        computedNextReminder
      );

      setNextReminder(computedNextReminder);
    } catch (error) {
      console.error('加载提醒失败:', error);
    } finally {
      setLoadingReminders(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadPets(), loadReminders()]);
    setRefreshing(false);
  }, []);

  // 当彩带动效结束后，由子组件回调关闭 overlay
  const handleConfettiHide = () => {
    setShowEmptyConfetti(false);
  };

  // 渲染单个宠物卡片
  const handleNavigate = (screen) => {
    if (screen === 'Profile') {
      navigation.navigate('Profile');
    }
  };

  // 处理宠物切换
  const handlePetChange = (index) => {
    setCurrentPetIndex(index);
  };

  // 处理添加宠物
  const handleAddPet = () => {
    navigation.navigate('AddPet');
  };

  // 处理添加任务
  const handleAddTask = () => {
    navigation.navigate('AddTask', {
      pets,
      currentPetId: currentPet?.id || null,
    });
  };

  // 获取当前宠物
  const currentPet =
    pets.length > 0 && currentPetIndex < pets.length ? pets[currentPetIndex] : null;

  // 将今日提醒转换为前端展示用的任务结构
  const todayTasks = (todayReminders || []).map((reminder) => {
    const timeSource =
      reminder.scheduledAt || reminder.dueAt || reminder.snoozeUntil || reminder.createdAt;
    const completed = reminder.status === 'done' || reminder.status === 'completed';
    return {
      id: reminder.id,
      title: reminder.title,
      time: formatTimeLabel(timeSource),
      completed,
      icon: getIconForTags(reminder.tags),
      priority: reminder.priority || 'medium',
      petId: reminder.petId || null,
      _rawDate: timeSource ? new Date(timeSource) : null,
    };
  });

  const completedTasks = todayTasks.filter((t) => t.completed);
  const incompleteTasks = todayTasks.filter((t) => !t.completed);

  // 判断任务是否已超时（仅针对未完成任务）
  const isTaskOverdue = (task) => {
    if (!task || task.completed || !task._rawDate) return false;
    const now = new Date();
    return task._rawDate < now;
  };

  // 切换任务完成状态（待办 <-> 已完成）
  const handleToggleTaskCompletion = async (task) => {
    try {
      const authData = await storage.getAuthData();
      if (!authData || !authData.tokens?.accessToken) {
        Alert.alert('提示', '尚未登录或登录已过期，请重新登录');
        return;
      }
      const token = authData.tokens.accessToken;

      const reminder = (todayReminders || []).find((r) => r.id === task.id);
      const currentStatus =
        reminder?.status || (task.completed ? 'done' : 'pending');
      const isCurrentlyCompleted =
        currentStatus === 'done' || currentStatus === 'completed';

      console.log(
        '[HomeScreen][handleToggleTaskCompletion] before toggle:',
        {
          taskId: task.id,
          currentStatus,
          isCurrentlyCompleted,
        }
      );

      if (isCurrentlyCompleted) {
        // 已完成 -> 退回待办
        await reminderService.updateReminder(task.id, { status: 'pending' }, token);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTodayReminders((prev) =>
          (prev || []).map((r) =>
            r.id === task.id ? { ...r, status: 'pending' } : r
          )
        );
      } else {
        // 待办 -> 标记为已完成
        await reminderService.completeReminder(task.id, token);
        // 本地乐观更新 todayReminders，并基于更新后的列表立即判断是否已经没有待办任务，
        // 如果是，立刻触发烟花，而不必等待后续的 loadReminders 接口返回
        const updatedReminders = (todayReminders || []).map((r) =>
          r.id === task.id ? { ...r, status: 'done' } : r
        );

        // 使用与 loadReminders 中一致的规则，计算“仍然有时间字段的未完成任务”列表
        const pendingWithTimeAfterToggle = updatedReminders.filter((r) => {
          const isCompletedLocal =
            r.status === 'done' || r.status === 'completed' || r.status === 'archived';
          if (isCompletedLocal) return false;

          const timeSource = r.scheduledAt || r.dueAt || r.snoozeUntil;
          if (!timeSource) return false;

          const dt = new Date(timeSource);
          if (Number.isNaN(dt.getTime())) return false;

          return true;
        });

        console.log(
          '[HomeScreen][handleToggleTaskCompletion] pendingWithTimeAfterToggle length:',
          pendingWithTimeAfterToggle.length,
          pendingWithTimeAfterToggle
        );

        if (pendingWithTimeAfterToggle.length === 0) {
          console.log(
            '[HomeScreen][handleToggleTaskCompletion] no pendingWithTime after local update, trigger confetti once'
          );
          // 这里仅通过 visible 状态触发一次 ConfettiCelebration，具体动画细节交由子组件内管理
          if (!showEmptyConfetti) {
            setShowEmptyConfetti(true);
          }
        } else {
          // 仅在仍有待办任务时，为列表变化开启 LayoutAnimation，避免与烟花动画同时抢占性能
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        }

        setTodayReminders(updatedReminders);
      }

      // 状态切换成功后，重新加载提醒数据，保证「即将开始」卡片始终指向最近的未完成任务
      console.log(
        '[HomeScreen][handleToggleTaskCompletion] toggle success, reload reminders'
      );
      await loadReminders({ skipConfetti: true });
    } catch (error) {
      console.error('切换任务状态失败:', error);
      Alert.alert('错误', error.message || '切换任务状态失败，请稍后重试');
    }
  };

  // 计算每只宠物的「每日目标」和「下个任务」
  const taskStatsByPetId = todayTasks.reduce((acc, task) => {
    if (!task.petId) return acc; // 只统计关联到宠物的任务

    const stats = acc[task.petId] || {
      total: 0,
      completed: 0,
      nextTask: null,
    };

    stats.total += 1;
    if (task.completed) {
      stats.completed += 1;
    } else if (task._rawDate) {
      if (!stats.nextTask || (stats.nextTask._rawDate && task._rawDate < stats.nextTask._rawDate)) {
        stats.nextTask = task;
      }
    }

    acc[task.petId] = stats;
    return acc;
  }, {});

  // 全局「即将开始」卡片 - 用户所有任务中最近的一个
  const nextTask = nextReminder
    ? {
        id: nextReminder.id,
        title: nextReminder.title,
        time: formatTimeLabel(
          nextReminder.scheduledAt || nextReminder.dueAt || nextReminder.snoozeUntil
        ),
        icon: getIconForTags(nextReminder.tags),
        petId: nextReminder.petId || null,
      }
    : null;

  const nextTaskPet = nextTask?.petId ? findPetById(nextTask.petId) : null;

  const containerWidth = Math.min(SCREEN_WIDTH, MAX_WIDTH);

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Sidebar */}
      <Sidebar
        visible={isSidebarVisible}
        onClose={() => setIsSidebarVisible(false)}
        onNavigate={handleNavigate}
        userData={userData}
      />

      {/* Main Container */}
      <View
        style={[
          styles.mainContainer,
          { maxWidth: containerWidth },
          isDarkMode && styles.mainContainerDark,
        ]}
      >
        {/* Header */}
        <View style={[styles.header, isDarkMode && styles.headerDark]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsSidebarVisible(!isSidebarVisible)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isSidebarVisible ? 'close' : 'menu'}
                size={16}
                color="#EA580C"
              />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>我的宠物</Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.iconButton, isDarkMode && styles.iconButtonDark]}
                onPress={toggleTheme}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isDarkMode ? 'sunny' : 'moon'}
                  size={16}
                  color={isDarkMode ? "#F59E0B" : "#4B5563"}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.iconButton, isDarkMode && styles.iconButtonDark]}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications" size={16} color={isDarkMode ? "#9CA3AF" : "#4B5563"} />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Search Bar */}
          <View style={[styles.searchContainer, isDarkMode && styles.searchContainerDark]}>
            <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
              placeholder="Search tasks, health records..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            />
          </View>

          {/* Pet Profile Carousel */}
          <PetCarousel
            pets={pets}
            loading={loadingPets}
            currentPetIndex={currentPetIndex}
            onPetChange={handlePetChange}
            onAddPet={handleAddPet}
            isDarkMode={isDarkMode}
            taskStatsByPetId={taskStatsByPetId}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.9}
              onPress={handleAddTask}
            >
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>添加任务</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Ionicons name="search" size={14} color="#374151" />
              <Text style={styles.secondaryButtonText}>健康日志</Text>
            </TouchableOpacity>
          </View>

          {/* Next Up Card */}
          <View
            style={[styles.nextUpCard, isDarkMode && styles.nextUpCardDark]}
          >
            <View style={styles.nextUpHeader}>
              <Ionicons
                name="notifications"
                size={14}
                color={isDarkMode ? "#FB923C" : "#EA580C"}
              />
              <Text style={[styles.nextUpLabel, isDarkMode && styles.nextUpLabelDark]}>
                即将开始
              </Text>
            </View>
            {nextTask ? (
              <View style={styles.nextUpContent}>
                <View
                  style={[
                    styles.nextUpIconContainer,
                    isDarkMode && styles.nextUpIconContainerDark,
                  ]}
                >
                  <Ionicons
                    name={nextTask.icon}
                    size={16}
                    color={isDarkMode ? "#FB923C" : "#EA580C"}
                  />
                </View>
                <View style={styles.nextUpDetails}>
                  <Text style={[styles.nextUpTitle, isDarkMode && styles.nextUpTitleDark]}>
                    {nextTask.title}
                  </Text>
                  <View style={styles.nextUpTime}>
                    <Ionicons
                      name="time"
                      size={12}
                      color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                    />
                    <Text
                      style={[styles.nextUpTimeText, isDarkMode && styles.nextUpTimeTextDark]}
                    >
                      {nextTask.time}
                    </Text>
                  </View>
                </View>
                  {nextTaskPet && (
                    <View style={styles.nextUpPetAvatar}>
                      <View
                        style={[
                          styles.petAvatarCircle,
                          isDarkMode && styles.petAvatarCircleDark,
                        ]}
                      >
                        <Text style={styles.petAvatarEmoji}>
                          {getSpeciesEmoji(nextTaskPet.species)}
                        </Text>
                      </View>
                    </View>
                  )}
              </View>
            ) : (
              <View style={styles.nextUpContent}>
                <View style={styles.nextUpDetails}>
                  <Text style={[styles.nextUpTitle, isDarkMode && styles.nextUpTitleDark]}>
                    今天没有待办任务啦
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* Today's Tasks */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <View>
                <Text style={[styles.tasksSectionTitle, isDarkMode && styles.tasksSectionTitleDark]}>今日任务</Text>
                <Text style={[styles.tasksSectionDate, isDarkMode && styles.tasksSectionDateDark]}>
                  {formatTodayLabel()}
                </Text>
              </View>
              <View style={styles.tasksFilters}>
                <TouchableOpacity 
                  style={taskFilter === 'all' ? styles.filterButtonActive : [styles.filterButton, isDarkMode && styles.filterButtonDark]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTaskFilter('all');
                    setIsToDoCollapsed(false);
                    setIsCompletedCollapsed(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={taskFilter === 'all' ? styles.filterTextActive : [styles.filterText, isDarkMode && styles.filterTextDark]}>全部</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={taskFilter === 'done' ? styles.filterButtonActive : [styles.filterButton, isDarkMode && styles.filterButtonDark]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTaskFilter('done');
                    setIsToDoCollapsed(true);
                    setIsCompletedCollapsed(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={taskFilter === 'done' ? styles.filterTextActive : [styles.filterText, isDarkMode && styles.filterTextDark]}>已完成</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={taskFilter === 'todo' ? styles.filterButtonActive : [styles.filterButton, isDarkMode && styles.filterButtonDark]}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setTaskFilter('todo');
                    setIsToDoCollapsed(false);
                    setIsCompletedCollapsed(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={taskFilter === 'todo' ? styles.filterTextActive : [styles.filterText, isDarkMode && styles.filterTextDark]}>待办</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Incomplete Tasks */}
            <TouchableOpacity 
              style={[styles.tasksSectionSubHeader, isDarkMode && styles.tasksSectionSubHeaderDark]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsToDoCollapsed(!isToDoCollapsed);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tasksSubtitle, isDarkMode && styles.tasksSubtitleDark]}>待办 ({incompleteTasks.length})</Text>
              <Ionicons 
                name={isToDoCollapsed ? "chevron-down" : "chevron-up"} 
                size={16} 
                color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            {!isToDoCollapsed &&
              incompleteTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const pet = task.petId ? findPetById(task.petId) : null;
                const petEmoji = pet ? getSpeciesEmoji(pet.species) : null;
                return (
                  <View
                    key={task.id}
                    style={[styles.taskItem, isDarkMode && styles.taskItemDark]}
                  >
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => handleToggleTaskCompletion(task)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="ellipse-outline"
                        size={20}
                        color={isDarkMode ? '#4B5563' : '#D1D5DB'}
                      />
                    </TouchableOpacity>
                    <View style={[styles.taskIconBg, isDarkMode && styles.taskIconBgDark]}>
                      <Ionicons
                        name={task.icon}
                        size={16}
                        color={isDarkMode ? '#FB923C' : '#EA580C'}
                      />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text
                        style={[styles.taskTitle, isDarkMode && styles.taskTitleDark]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <View style={styles.taskMeta}>
                        <Text
                          style={[styles.taskTime, isDarkMode && styles.taskTimeDark]}
                          numberOfLines={1}
                        >
                          {task.time}
                        </Text>
                        {task.priority && (
                          <View
                            style={[
                              styles.taskBadge,
                              task.priority === 'high' && styles.taskBadgeHigh,
                              task.priority === 'medium' && styles.taskBadgeMedium,
                            ]}
                          >
                            <Text
                              style={[
                                styles.taskBadgeText,
                                task.priority === 'high' && styles.taskBadgeTextHigh,
                              ]}
                            >
                              {task.priority}
                            </Text>
                          </View>
                        )}
                        {overdue && (
                          <View style={styles.taskOverdueBadge}>
                            <Text style={styles.taskOverdueBadgeText}>超时</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {petEmoji && (
                      <View style={styles.taskPetAvatar}>
                        <View
                          style={[
                            styles.petAvatarCircle,
                            isDarkMode && styles.petAvatarCircleDark,
                          ]}
                        >
                          <Text style={styles.petAvatarEmoji}>{petEmoji}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

            {/* Completed Tasks */}
            <TouchableOpacity 
              style={[styles.tasksSectionSubHeader, { marginTop: 5 }, isDarkMode && styles.tasksSectionSubHeaderDark]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setIsCompletedCollapsed(!isCompletedCollapsed);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tasksSubtitle, isDarkMode && styles.tasksSubtitleDark]}>已完成 ({completedTasks.length})</Text>
              <Ionicons 
                name={isCompletedCollapsed ? "chevron-down" : "chevron-up"} 
                size={16} 
                color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            {!isCompletedCollapsed &&
              completedTasks.map((task) => {
                const pet = task.petId ? findPetById(task.petId) : null;
                const petEmoji = pet ? getSpeciesEmoji(pet.species) : null;
                return (
                  <View
                    key={task.id}
                    style={[styles.taskItemCompleted, isDarkMode && styles.taskItemCompletedDark]}
                  >
                    <TouchableOpacity
                      style={styles.taskCheckbox}
                      onPress={() => handleToggleTaskCompletion(task)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={isDarkMode ? '#6B7280' : '#9CA3AF'}
                      />
                    </TouchableOpacity>
                    <View style={styles.taskIconBgCompleted}>
                      <Ionicons name={task.icon} size={16} color="#9CA3AF" />
                    </View>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitleCompleted} numberOfLines={1}>
                        {task.title}
                      </Text>
                      <Text style={styles.taskTimeCompleted} numberOfLines={1}>
                        {task.time}
                      </Text>
                    </View>
                    {petEmoji && (
                      <View style={styles.taskPetAvatar}>
                        <View
                          style={[
                            styles.petAvatarCircle,
                            isDarkMode && styles.petAvatarCircleDark,
                          ]}
                        >
                          <Text style={styles.petAvatarEmoji}>{petEmoji}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
          </View>

          {/* Health Overview */}
          <View style={styles.healthSection}>
            <Text style={[styles.healthTitle, isDarkMode && styles.healthTitleDark]}>健康概览</Text>
            <View style={styles.healthCards}>
              {/* Weight Card */}
              <View style={[styles.healthCard, isDarkMode && styles.healthCardDark]}>
                <View style={[styles.healthIconBg, isDarkMode && styles.healthIconBgDark]}>
                  <Ionicons name="fitness" size={14} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                </View>
                <Text style={[styles.healthCardLabel, isDarkMode && styles.healthCardLabelDark]}>体重</Text>
                <View style={styles.healthCardValue}>
                  <Text style={[styles.healthCardNumber, isDarkMode && styles.healthCardNumberDark]}>28.5</Text>
                  <Text style={[styles.healthCardUnit, isDarkMode && styles.healthCardUnitDark]}>kg</Text>
                </View>
                <View style={styles.healthCardTrend}>
                  <Ionicons name="trending-up" size={12} color="#EA580C" />
                  <Text style={styles.healthCardTrendText}>+0.3 kg</Text>
                </View>
                <Text style={[styles.healthCardDate, isDarkMode && styles.healthCardDateDark]}>11月8日</Text>
              </View>

              {/* Exercise Card */}
              <View style={[styles.healthCard, isDarkMode && styles.healthCardDark]}>
                <View style={[styles.healthIconBg, isDarkMode && styles.healthIconBgDark]}>
                  <Ionicons name="timer" size={14} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                </View>
                <Text style={[styles.healthCardLabel, isDarkMode && styles.healthCardLabelDark]}>运动</Text>
                <View style={styles.healthCardValue}>
                  <Text style={[styles.healthCardNumber, isDarkMode && styles.healthCardNumberDark]}>45</Text>
                  <Text style={[styles.healthCardUnit, isDarkMode && styles.healthCardUnitDark]}>分钟</Text>
                </View>
                <View style={[styles.exerciseProgress, isDarkMode && styles.exerciseProgressDark]}>
                  <View style={styles.exerciseProgressFill} />
                </View>
                <Text style={[styles.healthCardDate, isDarkMode && styles.healthCardDateDark]}>目标: 60分钟</Text>
              </View>

              {/* BM Card */}
              <View style={[styles.healthCard, isDarkMode && styles.healthCardDark]}>
                <View style={[styles.healthIconBg, isDarkMode && styles.healthIconBgDark]}>
                  <Ionicons name="pulse" size={14} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                </View>
                <Text style={[styles.healthCardLabel, isDarkMode && styles.healthCardLabelDark]}>今日排便</Text>
                <View style={styles.healthCardValue}>
                  <Text style={[styles.healthCardNumber, isDarkMode && styles.healthCardNumberDark]}>2</Text>
                  <Text style={[styles.healthCardUnit, isDarkMode && styles.healthCardUnitDark]}>次</Text>
                </View>
                <View style={styles.healthBadge}>
                  <Text style={styles.healthBadgeText}>正常</Text>
                </View>
                <Text style={[styles.healthCardDate, isDarkMode && styles.healthCardDateDark]}>最近: 上午10:30</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, isDarkMode && styles.bottomNavDark]}>
          <TouchableOpacity style={styles.bottomNavItemActive}>
            <View style={styles.bottomNavIconActive}>
              <Ionicons name="home" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.bottomNavLabelActive}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomNavItem}>
            <View style={[styles.bottomNavIcon, isDarkMode && styles.bottomNavIconDark]}>
              <Ionicons name="compass" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </View>
            <Text style={[styles.bottomNavLabel, isDarkMode && styles.bottomNavLabelDark]}>Explore</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomNavItem}>
            <View style={[styles.bottomNavIcon, isDarkMode && styles.bottomNavIconDark]}>
              <Ionicons name="add" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </View>
            <Text style={[styles.bottomNavLabel, isDarkMode && styles.bottomNavLabelDark]}>Add</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomNavItem}>
            <View style={[styles.bottomNavIcon, isDarkMode && styles.bottomNavIconDark]}>
              <Ionicons name="notifications" size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            </View>
            <Text style={[styles.bottomNavLabel, isDarkMode && styles.bottomNavLabelDark]}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Confetti Overlay - keep this as one of the top-most layers inside main container */}
        <ConfettiCelebration visible={showEmptyConfetti} onHide={handleConfettiHide} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: Platform.OS === 'web' ? 0 : Constants.statusBarHeight,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FED7AA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconButtonDark: {
    backgroundColor: '#374151',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 80,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  searchContainerDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  searchInputDark: {
    color: '#F9FAFB',
  },
  // Pet-related styles (carousel now in separate component)
  petImageContainer: {
    position: 'relative',
  },
  petImage: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petImageEmoji: {
    fontSize: 32,
  },
  petBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA580C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  petNameDark: {
    color: '#F9FAFB',
  },
  petBreed: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  petBreedDark: {
    color: '#9CA3AF',
  },
  petAge: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  petAgeDark: {
    color: '#9CA3AF',
  },
  dailyGoalsCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      },
    }),
  },
  dailyGoalsCardDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  dailyGoalsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  dailyGoalsLabelDark: {
    color: '#9CA3AF',
  },
  dailyGoalsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  dailyGoalsValueDark: {
    color: '#F9FAFB',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  nextTaskCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      },
    }),
  },
  nextTaskIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextTaskDetails: {
    flex: 1,
  },
  nextTaskLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  nextTaskTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  nextTaskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextTaskTimeText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F97316',
    borderRadius: 6,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  nextUpCard: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  nextUpCardDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    borderColor: '#F97316',
  },
  nextUpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  nextUpLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C2410C',
  },
  nextUpLabelDark: {
    color: '#FB923C',
  },
  nextUpContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  nextUpIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextUpIconContainerDark: {
    backgroundColor: '#374151',
  },
  nextUpDetails: {
    flex: 1,
  },
  nextUpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  nextUpTitleDark: {
    color: '#F9FAFB',
  },
  nextUpTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nextUpTimeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  nextUpTimeTextDark: {
    color: '#9CA3AF',
  },
  nextUpPetAvatar: {
    justifyContent: 'center',
  },
  petAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  petAvatarCircleDark: {
    backgroundColor: '#374151',
    borderColor: '#F97316',
  },
  petAvatarEmoji: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  dividerDark: {
    backgroundColor: '#374151',
  },
  tasksSection: {
    gap: 8,
    marginBottom: 24,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingTop: 4,
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  tasksSectionDate: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  tasksFilters: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    minWidth: 60,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonDark: {
    backgroundColor: '#374151',
  },
  filterButtonActive: {
    minWidth: 60,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextDark: {
    color: '#D1D5DB',
  },
  filterTextActive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tasksSectionSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  tasksSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: 8,
    marginBottom: 6,
  },
  taskItemDark: {
    backgroundColor: '#374151',
    borderColor: '#F97316',
  },
  taskItemCompleted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 6,
  },
  taskItemCompletedDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  taskPetAvatar: {
    marginLeft: 4,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
  },
  taskIconBg: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIconBgDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
  },
  taskIconBgCompleted: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  taskTitleDark: {
    color: '#F9FAFB',
  },
  taskTitleCompleted: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginBottom: 2,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  taskTimeDark: {
    color: '#9CA3AF',
  },
  taskTimeCompleted: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  taskBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  taskBadgeHigh: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  taskBadgeMedium: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  taskBadgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  taskBadgeTextHigh: {
    color: '#C2410C',
  },
  taskOverdueBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(248, 113, 113, 0.12)', // 淡红色背景
  },
  taskOverdueBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#DC2626',
  },
  healthSection: {
    marginTop: 8,
  },
  healthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    paddingTop: 4,
  },
  healthCards: {
    flexDirection: 'row',
    gap: 8,
  },
  healthCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
  },
  healthCardDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  healthIconBg: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthIconBgDark: {
    backgroundColor: 'rgba(249, 115, 22, 0.3)',
  },
  healthCardLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  healthCardLabelDark: {
    color: '#9CA3AF',
  },
  healthCardValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  healthCardNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
    healthCardNumberDark: {
    color: '#F9FAFB',
  },
  healthCardUnit: {
    fontSize: 12,
    color: '#6B7280',
  },
  healthCardUnitDark: {
    color: '#9CA3AF',
  },
  healthCardTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  healthCardTrendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  healthCardDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  healthCardDateDark: {
    color: '#6B7280',
  },
  exerciseProgress: {
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  exerciseProgressDark: {
    backgroundColor: '#1F2937',
  },
  exerciseProgressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#F97316',
  },
  healthBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
    marginBottom: 4,
  },
  healthBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#059669',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomNavItem: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bottomNavItemActive: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bottomNavIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNavIconDark: {
    backgroundColor: '#374151',
  },
  bottomNavIconActive: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomNavLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  bottomNavLabelDark: {
    color: '#9CA3AF',
  },
  bottomNavLabelActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  // Dark Mode Styles
  containerDark: {
    backgroundColor: '#111827',
  },
  mainContainerDark: {
    backgroundColor: '#1F2937',
  },
  headerDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderBottomColor: '#374151',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  tasksSectionTitleDark: {
    color: '#F9FAFB',
  },
  tasksSectionDateDark: {
    color: '#9CA3AF',
  },
  tasksSectionSubHeaderDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  tasksSubtitleDark: {
    color: '#D1D5DB',
  },
  healthTitleDark: {
    color: '#F9FAFB',
  },
  bottomNavDark: {
    backgroundColor: '#1F2937',
    borderTopColor: '#374151',
  },
});

