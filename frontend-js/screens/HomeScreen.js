import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../components/home/Sidebar';
import * as storage from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 448; // max-w-md (28rem = 448px)

export default function HomeScreen({ navigation, onLogout }) {
  const [userData, setUserData] = useState(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  
  // 任务折叠状态
  const [isToDoCollapsed, setIsToDoCollapsed] = useState(false);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(false);
  
  // 任务过滤器状态
  const [taskFilter, setTaskFilter] = useState('all'); // 'all', 'done', 'todo'

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await storage.getAuthData();
      setUserData(authData?.user || null);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    }
  };

  const handleNavigate = (screen) => {
    if (screen === 'Profile') {
      navigation.navigate('Profile');
    }
  };

  // Mock 数据
  const mockPets = [
    {
      name: 'Charlie',
      breed: 'Golden Retriever',
      age: '3 years',
      goalsCompleted: 6,
      goalsTotal: 8,
      nextTask: {
        title: '下午玩耍时间',
        time: '下午 2:00',
        icon: 'footsteps',
      },
    },
  ];

  const mockTasks = [
    { id: '1', title: '早晨喂食', time: '上午 7:00', completed: true, icon: 'restaurant', priority: 'high' },
    { id: '2', title: '早晨散步', time: '上午 8:30', completed: true, icon: 'walk' },
    { id: '3', title: '喂维生素', time: '上午 9:00', completed: true, icon: 'medical', priority: 'medium' },
    { id: '4', title: '换水', time: '下午 12:00', completed: true, icon: 'water' },
    { id: '5', title: '下午玩耍时间', time: '下午 2:00', completed: false, icon: 'tennisball' },
    { id: '6', title: '晚餐喂食', time: '下午 6:00', completed: false, icon: 'restaurant', priority: 'high' },
    { id: '7', title: '晚间散步', time: '晚上 7:30', completed: false, icon: 'walk' },
    { id: '8', title: '美容护理', time: '晚上 8:00', completed: false, icon: 'cut', priority: 'medium' },
  ];

  const completedTasks = mockTasks.filter(t => t.completed);
  const incompleteTasks = mockTasks.filter(t => !t.completed);
  const nextTask = mockTasks.find(t => !t.completed);

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
      <View style={[styles.mainContainer, { maxWidth: containerWidth }, isDarkMode && styles.mainContainerDark]}>
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

          {/* Pet Profile Card */}
          <View style={[styles.petCard, isDarkMode && styles.petCardDark]}>
            <View style={styles.petCardContent}>
              {/* Pet Info */}
              <View style={styles.petInfo}>
                <View style={styles.petImageContainer}>
                  <View style={styles.petImage}>
                    <Text style={styles.petImageEmoji}>🐕</Text>
                  </View>
                  <View style={styles.petBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  </View>
                </View>
                
                <View style={styles.petDetails}>
                  <Text style={[styles.petName, isDarkMode && styles.petNameDark]}>{mockPets[0].name}</Text>
                  <Text style={[styles.petBreed, isDarkMode && styles.petBreedDark]}>{mockPets[0].breed}</Text>
                  <Text style={[styles.petAge, isDarkMode && styles.petAgeDark]}>{mockPets[0].age} old</Text>
                </View>
              </View>

              {/* Daily Goals */}
              <View style={[styles.dailyGoalsCard, isDarkMode && styles.dailyGoalsCardDark]}>
                <Text style={[styles.dailyGoalsLabel, isDarkMode && styles.dailyGoalsLabelDark]}>每日目标</Text>
                <Text style={[styles.dailyGoalsValue, isDarkMode && styles.dailyGoalsValueDark]}>
                  {mockPets[0].goalsCompleted}/{mockPets[0].goalsTotal}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${(mockPets[0].goalsCompleted / mockPets[0].goalsTotal) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Next Task */}
            {mockPets[0].nextTask && (
              <View style={[styles.nextTaskCard, isDarkMode && { borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' }]}>
                <View style={[styles.nextTaskIcon, isDarkMode && { borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' }]}>
                  <Ionicons name={mockPets[0].nextTask.icon} size={16} color={isDarkMode ? "#FB923C" : "#FFFFFF"} />
                </View>
                <View style={styles.nextTaskDetails}>
                  <Text style={[styles.nextTaskLabel, isDarkMode && { color: '#9CA3AF' }]}>下一个任务</Text>
                  <Text style={[styles.nextTaskTitle, isDarkMode && { color: '#F9FAFB' }]}>{mockPets[0].nextTask.title}</Text>
                  <View style={styles.nextTaskTime}>
                    <Ionicons name="time" size={12} color={isDarkMode ? "#9CA3AF" : "rgba(255, 255, 255, 0.9)"} />
                    <Text style={[styles.nextTaskTimeText, isDarkMode && { color: '#9CA3AF' }]}>{mockPets[0].nextTask.time}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
              <Ionicons name="add" size={14} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>添加任务</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
              <Ionicons name="search" size={14} color="#374151" />
              <Text style={styles.secondaryButtonText}>健康日志</Text>
            </TouchableOpacity>
          </View>

          {/* Next Up Card */}
          {nextTask && (
            <View style={[styles.nextUpCard, isDarkMode && styles.nextUpCardDark]}>
              <View style={styles.nextUpHeader}>
                <Ionicons name="notifications" size={14} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                <Text style={[styles.nextUpLabel, isDarkMode && styles.nextUpLabelDark]}>即将开始</Text>
              </View>
              <View style={styles.nextUpContent}>
                <View style={[styles.nextUpIconContainer, isDarkMode && styles.nextUpIconContainerDark]}>
                  <Ionicons name={nextTask.icon} size={16} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                </View>
                <View style={styles.nextUpDetails}>
                  <Text style={[styles.nextUpTitle, isDarkMode && styles.nextUpTitleDark]}>{nextTask.title}</Text>
                  <View style={styles.nextUpTime}>
                    <Ionicons name="time" size={12} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                    <Text style={[styles.nextUpTimeText, isDarkMode && styles.nextUpTimeTextDark]}>{nextTask.time}</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, isDarkMode && styles.dividerDark]} />

          {/* Today's Tasks */}
          <View style={styles.tasksSection}>
            <View style={styles.tasksSectionHeader}>
              <View>
                <Text style={[styles.tasksSectionTitle, isDarkMode && styles.tasksSectionTitleDark]}>今日任务</Text>
                <Text style={[styles.tasksSectionDate, isDarkMode && styles.tasksSectionDateDark]}>2025年11月10日 星期一</Text>
              </View>
              <View style={styles.tasksFilters}>
                <TouchableOpacity 
                  style={taskFilter === 'all' ? styles.filterButtonActive : [styles.filterButton, isDarkMode && styles.filterButtonDark]}
                  onPress={() => {
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
              onPress={() => setIsToDoCollapsed(!isToDoCollapsed)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tasksSubtitle, isDarkMode && styles.tasksSubtitleDark]}>待办 ({incompleteTasks.length})</Text>
              <Ionicons 
                name={isToDoCollapsed ? "chevron-down" : "chevron-up"} 
                size={16} 
                color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            {!isToDoCollapsed && incompleteTasks.map((task) => (
              <View key={task.id} style={[styles.taskItem, isDarkMode && styles.taskItemDark]}>
                <TouchableOpacity style={styles.taskCheckbox}>
                  <Ionicons name="ellipse-outline" size={20} color={isDarkMode ? "#4B5563" : "#D1D5DB"} />
                </TouchableOpacity>
                <View style={[styles.taskIconBg, isDarkMode && styles.taskIconBgDark]}>
                  <Ionicons name={task.icon} size={16} color={isDarkMode ? "#FB923C" : "#EA580C"} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, isDarkMode && styles.taskTitleDark]}>{task.title}</Text>
                  <View style={styles.taskMeta}>
                    <Text style={[styles.taskTime, isDarkMode && styles.taskTimeDark]}>{task.time}</Text>
                    {task.priority && (
                      <View style={[
                        styles.taskBadge,
                        task.priority === 'high' && styles.taskBadgeHigh,
                        task.priority === 'medium' && styles.taskBadgeMedium,
                      ]}>
                        <Text style={[
                          styles.taskBadgeText,
                          task.priority === 'high' && styles.taskBadgeTextHigh,
                        ]}>
                          {task.priority}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            ))}

            {/* Completed Tasks */}
            <TouchableOpacity 
              style={[styles.tasksSectionSubHeader, { marginTop: 5 }, isDarkMode && styles.tasksSectionSubHeaderDark]}
              onPress={() => setIsCompletedCollapsed(!isCompletedCollapsed)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tasksSubtitle, isDarkMode && styles.tasksSubtitleDark]}>已完成 ({completedTasks.length})</Text>
              <Ionicons 
                name={isCompletedCollapsed ? "chevron-down" : "chevron-up"} 
                size={16} 
                color={isDarkMode ? "#9CA3AF" : "#6B7280"} 
              />
            </TouchableOpacity>
            {!isCompletedCollapsed && completedTasks.map((task) => (
              <View key={task.id} style={[styles.taskItemCompleted, isDarkMode && styles.taskItemCompletedDark]}>
                <TouchableOpacity style={styles.taskCheckbox}>
                  <Ionicons name="checkmark-circle" size={20} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
                </TouchableOpacity>
                <View style={styles.taskIconBgCompleted}>
                  <Ionicons name={task.icon} size={16} color="#9CA3AF" />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitleCompleted}>{task.title}</Text>
                  <Text style={styles.taskTimeCompleted}>{task.time}</Text>
                </View>
              </View>
            ))}
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
  petCard: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  petCardDark: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  petCardContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 2,
  },
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

