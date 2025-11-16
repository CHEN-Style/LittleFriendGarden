import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import FallingEmojis from '../components/onboarding/FallingEmojis';
import LoginModal from '../components/onboarding/LoginModal';
import RegisterModal from '../components/onboarding/RegisterModal';

export default function OnboardingScreen({ navigation, onLoginSuccess }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const [loginVisible, setLoginVisible] = useState(false);
  const [registerVisible, setRegisterVisible] = useState(false);
  const [emojiEnabled, setEmojiEnabled] = useState(true); // 控制动画开关
  const [tapCount, setTapCount] = useState(0); // 记录点击次数
  const tapTimerRef = React.useRef(null); // 点击计时器

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 页面失焦时清理动画（确保切换页面时关闭动画）
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // 页面失去焦点时关闭动画
      setEmojiEnabled(false);
    });

    const focusUnsubscribe = navigation.addListener('focus', () => {
      // 页面重新获得焦点时恢复动画（如果之前是开启的）
      // 这里默认不自动开启，让用户手动控制
    });

    return () => {
      unsubscribe();
      focusUnsubscribe();
      // 清理计时器
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, [navigation]);

  const handleLogin = () => {
    setLoginVisible(true);
  };

  const handleRegister = () => {
    setRegisterVisible(true);
  };

  const handleSwitchToRegister = () => {
    setLoginVisible(false);
    setTimeout(() => setRegisterVisible(true), 300);
  };

  const handleSwitchToLogin = () => {
    setRegisterVisible(false);
    setTimeout(() => setLoginVisible(true), 300);
  };

  const handleAuthSuccess = (authData) => {
    // 关闭动画（跳转前）
    setEmojiEnabled(false);
    // 通知App.js用户已登录
    if (onLoginSuccess) {
      onLoginSuccess(authData);
    }
    // 导航到主页
    navigation.navigate('Home');
  };

  // 隐蔽开关：右下角连续点击3次切换动画
  const handleSecretToggle = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // 清除之前的计时器
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    // 如果3次点击在1秒内完成，触发开关
    if (newCount >= 3) {
      setEmojiEnabled(!emojiEnabled);
      setTapCount(0);
      // 可选：显示一个短暂的提示
      // Alert.alert('', emojiEnabled ? '动画已关闭' : '动画已开启');
    } else {
      // 1秒后重置点击计数
      tapTimerRef.current = setTimeout(() => {
        setTapCount(0);
      }, 1000);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 渐变背景 */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53', '#FFA726']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />
      
      {/* 下落的动物emoji动效 - 可通过右下角开关控制 */}
      {emojiEnabled && (
        <FallingEmojis 
          batchSize={2}         // 每批2个
          interval={1200}       // 1.2秒生成一次
          emojiSize={28}        // emoji大小
          totalBatches={10}     // 总共10批次
          fallDuration={10000}  // 10秒下落时间
        />
      )}
      
      {/* 登录模态框 */}
      <LoginModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onSwitchToRegister={handleSwitchToRegister}
        onLoginSuccess={handleAuthSuccess}
      />
      
      {/* 注册模态框 */}
      <RegisterModal
        visible={registerVisible}
        onClose={() => setRegisterVisible(false)}
        onSwitchToLogin={handleSwitchToLogin}
        onRegisterSuccess={handleAuthSuccess}
      />
      
      {/* 装饰性圆形 */}
      <Animated.View 
        style={[
          styles.decorativeCircle1,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />
      <Animated.View 
        style={[
          styles.decorativeCircle2,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      />

      {/* 主要内容区域 */}
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.logoIcon}>
            <Text style={styles.heartIcon}>🐾</Text>
          </View>
          <Text style={styles.appName}>Little Friend Garden</Text>
          <Text style={styles.slogan}>让每一份陪伴都更有温度</Text>
        </Animated.View>

        {/* 按钮区域 */}
        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            activeOpacity={0.9}
          >
            <Text style={styles.registerButtonText}>注册</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.loginButton, { marginTop: 16 }]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>登录</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* 隐蔽的开关按钮 - 右下角 */}
      <View style={styles.secretToggleContainer}>
        <TouchableOpacity
          style={styles.secretToggle}
          onPress={handleSecretToggle}
          activeOpacity={0.6}
        >
          <Text style={styles.secretToggleIcon}>
            {emojiEnabled ? '🎨' : '⏸️'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }),
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    ...(Platform.OS === 'web' && {
      width: '100%',
      height: '100%',
    }),
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -50,
    right: -50,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: 100,
    left: -30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 80,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  heartIcon: {
    fontSize: 50,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  slogan: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  registerButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  secretToggleContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    left: 0,
    top: 0,
    pointerEvents: 'box-none', // 允许点击穿透，只有按钮本身可点击
    zIndex: 1000,
  },
  secretToggle: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 提高不透明度
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(147, 51, 234, 0.6)', // 紫色边框，与主题匹配
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android阴影
    zIndex: 1000, // 确保在最上层
  },
  secretToggleIcon: {
    fontSize: 24, // 增大emoji图标
  },
});

