import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as storage from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import Constants from 'expo-constants';

export default function ProfileScreen({ navigation, onLogout }) {
  const { isDarkMode } = useTheme();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const authData = await storage.getAuthData();
      setUserData(authData?.user || null);
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // Web 端使用 confirm
      if (window.confirm('确定要退出登录吗？')) {
        executeLogout();
      }
    } else {
      // 移动端使用 Alert
      Alert.alert(
        '退出登录',
        '确定要退出登录吗？',
        [
          {
            text: '取消',
            style: 'cancel',
          },
          {
            text: '确定',
            onPress: executeLogout,
          },
        ],
      );
    }
  };

  const executeLogout = async () => {
    await storage.clearAuthData();
    if (onLogout) {
      onLogout();
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Onboarding' }],
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "light-content"} />
      
      {/* 渐变背景 */}
      <LinearGradient
        colors={isDarkMode ? ['#1F2937', '#374151', '#4B5563'] : ['#FF6B6B', '#FF8E53', '#FFA726']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* 头部 */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity
          style={[styles.backButton, isDarkMode && styles.backButtonDark]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>← 返回</Text>
        </TouchableOpacity>
        <View>
          <Text style={[styles.welcomeText, isDarkMode && styles.welcomeTextDark]}>个人资料</Text>
          <Text style={[styles.usernameText, isDarkMode && styles.usernameTextDark]}>
            {userData?.username || '用户'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.logoutButton, isDarkMode && styles.logoutButtonDark]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutButtonText, isDarkMode && styles.logoutButtonTextDark]}>退出</Text>
        </TouchableOpacity>
      </View>

      {/* 内容区域 */}
      <ScrollView style={[styles.content, isDarkMode && styles.contentDark]} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.card, isDarkMode && styles.cardDark]}>
          <Text style={styles.cardIcon}>🐾</Text>
          <Text style={[styles.cardTitle, isDarkMode && styles.cardTitleDark]}>Little Friend Garden</Text>
          <Text style={[styles.cardDescription, isDarkMode && styles.cardDescriptionDark]}>
            让每一份陪伴都更有温度
          </Text>
        </View>

        {/* 用户信息卡片 */}
        <View style={[styles.infoCard, isDarkMode && styles.infoCardDark]}>
          <Text style={[styles.infoTitle, isDarkMode && styles.infoTitleDark]}>个人信息</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>用户名：</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>{userData?.username || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>邮箱：</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>{userData?.email || '-'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, isDarkMode && styles.infoLabelDark]}>用户ID：</Text>
            <Text style={[styles.infoValue, isDarkMode && styles.infoValueDark]}>{userData?.id || '-'}</Text>
          </View>
        </View>

        {/* 功能卡片 */}
        <View style={styles.featuresContainer}>
          <TouchableOpacity style={[styles.featureCard, isDarkMode && styles.featureCardDark]} activeOpacity={0.8}>
            <Text style={styles.featureIcon}>🐱</Text>
            <Text style={[styles.featureTitle, isDarkMode && styles.featureTitleDark]}>我的宠物</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, isDarkMode && styles.featureCardDark]} activeOpacity={0.8}>
            <Text style={styles.featureIcon}>📅</Text>
            <Text style={[styles.featureTitle, isDarkMode && styles.featureTitleDark]}>喂养记录</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, isDarkMode && styles.featureCardDark]} activeOpacity={0.8}>
            <Text style={styles.featureIcon}>💊</Text>
            <Text style={[styles.featureTitle, isDarkMode && styles.featureTitleDark]}>健康管理</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.featureCard, isDarkMode && styles.featureCardDark]} activeOpacity={0.8}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={[styles.featureTitle, isDarkMode && styles.featureTitleDark]}>相册</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 250,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' ? 60 : Math.max(Constants.statusBarHeight + 20, 60),
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '400',
  },
  usernameText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Dark Mode Styles
  containerDark: {
    backgroundColor: '#111827',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
  loadingTextDark: {
    color: '#F9FAFB',
  },
  headerDark: {
    backgroundColor: 'transparent',
  },
  backButtonDark: {
    backgroundColor: 'rgba(55, 65, 81, 0.8)',
  },
  backButtonTextDark: {
    color: '#F9FAFB',
  },
  welcomeTextDark: {
    color: '#F9FAFB',
  },
  usernameTextDark: {
    color: '#D1D5DB',
  },
  logoutButtonDark: {
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
  },
  logoutButtonTextDark: {
    color: '#FFFFFF',
  },
  contentDark: {
    backgroundColor: 'transparent',
  },
  cardDark: {
    backgroundColor: '#374151',
  },
  cardTitleDark: {
    color: '#F9FAFB',
  },
  cardDescriptionDark: {
    color: '#D1D5DB',
  },
  infoCardDark: {
    backgroundColor: '#374151',
  },
  infoTitleDark: {
    color: '#F9FAFB',
  },
  infoLabelDark: {
    color: '#9CA3AF',
  },
  infoValueDark: {
    color: '#F9FAFB',
  },
  featureCardDark: {
    backgroundColor: '#374151',
  },
  featureTitleDark: {
    color: '#F9FAFB',
  },
});

