import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Constants from 'expo-constants';

export default function Sidebar({ visible, onClose, onNavigate, userData }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const navItems = [
    { icon: 'home', label: '首页', screen: 'Home', active: true },
    { icon: 'paw', label: '我的宠物', screen: null },
    { icon: 'calendar', label: '日程安排', screen: null },
    { icon: 'heart', label: '健康', screen: null },
    { icon: 'trophy', label: '成就', screen: null },
    { icon: 'chatbubbles', label: '社区', screen: null },
    { icon: 'settings', label: '设置', screen: null },
  ];

  if (!visible) return null;

  const handleNavigate = (screen) => {
    if (screen && onNavigate) {
      onNavigate(screen);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      
      {/* 侧边栏 */}
      <View style={[styles.sidebar, isDarkMode && styles.sidebarDark]}>
        <View style={styles.sidebarContainer}>
          {/* 头部 */}
          <View style={[styles.header, isDarkMode && styles.headerDark]}>
            <View style={styles.headerContent}>
              <View style={styles.logoContainer}>
                <Ionicons name="heart" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.appName, isDarkMode && styles.appNameDark]}>PetCare</Text>
                <Text style={[styles.appSlogan, isDarkMode && styles.appSloganDark]}>您的宠物伴侣</Text>
              </View>
            </View>
          </View>

          {/* 导航项 */}
          <ScrollView style={styles.navContainer} showsVerticalScrollIndicator={false}>
            {navItems.map((item, index) => {
              const isActive = item.active;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.navItem,
                    isActive && styles.navItemActive,
                  ]}
                  onPress={() => handleNavigate(item.screen)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isActive ? '#FFFFFF' : (isDarkMode ? '#9CA3AF' : '#374151')}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      isActive && styles.navLabelActive,
                      !isActive && isDarkMode && styles.navLabelDark,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 暗黑模式切换 */}
          <View style={[styles.themeSection, isDarkMode && styles.themeSectionDark]}>
            <TouchableOpacity
              style={[styles.themeToggle, isDarkMode && styles.themeToggleDark]}
              onPress={toggleTheme}
              activeOpacity={0.7}
            >
              <View style={styles.themeToggleLeft}>
                <Ionicons
                  name={isDarkMode ? 'moon' : 'sunny'}
                  size={16}
                  color={isDarkMode ? '#9CA3AF' : '#374151'}
                />
                <Text style={[styles.themeLabel, isDarkMode && styles.themeLabelDark]}>
                  {isDarkMode ? '暗黑模式' : '明亮模式'}
                </Text>
              </View>
              <View style={[styles.toggleSwitch, isDarkMode && styles.toggleSwitchActive]}>
                <View style={[styles.toggleThumb, isDarkMode && styles.toggleThumbActive]} />
              </View>
            </TouchableOpacity>
          </View>

          {/* 用户卡片 */}
          <View style={[styles.userSection, isDarkMode && styles.userSectionDark]}>
            <TouchableOpacity
              style={[styles.userCard, isDarkMode && styles.userCardDark]}
              onPress={() => handleNavigate('Profile')}
              activeOpacity={0.8}
            >
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color="#FFFFFF" />
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, isDarkMode && styles.userNameDark]} numberOfLines={1}>
                  {userData?.username || '用户'}
                </Text>
                <Text style={[styles.userType, isDarkMode && styles.userTypeDark]} numberOfLines={1}>
                  高级会员
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 40,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(4px)',
      },
    }),
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 224, // 56 * 4 = 224
    backgroundColor: '#FFFFFF',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  sidebarDark: {
    backgroundColor: '#1F2937',
  },
  sidebarContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  header: {
    paddingTop: Platform.OS === 'web' ? 16 : Math.max(Constants.statusBarHeight + 10, 16),
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerDark: {
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  appNameDark: {
    color: '#F9FAFB',
  },
  appSlogan: {
    fontSize: 12,
    color: '#6B7280',
  },
  appSloganDark: {
    color: '#9CA3AF',
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: '#F97316',
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  navLabelDark: {
    color: '#9CA3AF',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  themeSection: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  themeSectionDark: {
    borderTopColor: '#374151',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  themeToggleDark: {
    backgroundColor: '#374151',
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  themeLabelDark: {
    color: '#9CA3AF',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#D1D5DB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#F97316',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  userSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  userSectionDark: {
    borderTopColor: '#374151',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  userCardDark: {
    backgroundColor: '#374151',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  userNameDark: {
    color: '#F9FAFB',
  },
  userType: {
    fontSize: 12,
    color: '#6B7280',
  },
  userTypeDark: {
    color: '#9CA3AF',
  },
});

