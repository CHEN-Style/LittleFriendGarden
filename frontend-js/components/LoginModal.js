import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as authService from '../services/authService';
import * as storage from '../utils/storage';

export default function LoginModal({ visible, onClose, onSwitchToRegister, onLoginSuccess }) {
  const [emailOrUsername, setEmailOrUsername] = useState('123@qq.com'); // 测试默认值
  const [password, setPassword] = useState('12345678'); // 测试默认值
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const dragY = React.useRef(new Animated.Value(0)).current;

  // 手势处理器
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只在向下滑动时响应
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // 只允许向下拖动
        if (gestureState.dy > 0) {
          dragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // 如果下滑超过 100 像素，关闭模态框
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          // 否则弹回原位
          Animated.spring(dragY, {
            toValue: 0,
            tension: 65,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  React.useEffect(() => {
    if (visible) {
      // 确保从正确的初始位置开始
      dragY.setValue(0);
      slideAnim.setValue(0);
      backdropOpacity.setValue(0);
      
      // 蒙版淡入
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // 表单从下向上滑入
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
    // 注意：不在这里重置动画值，让关闭动画自然完成
  }, [visible]);

  const handleClose = () => {
    // 表单向下滑出 + dragY 同时向下滑动
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.spring(dragY, {
        toValue: 600, // 同时让dragY也向下滑
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
    // 蒙版淡出
    Animated.timing(backdropOpacity, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        // 关闭动画完成后，重置所有动画值到初始状态
        dragY.setValue(0);
        slideAnim.setValue(0);
        backdropOpacity.setValue(0);
        // 通知父组件关闭
        onClose();
      }
    });
  };

  const handleLogin = async () => {
    // 清除之前的错误
    setError('');

    if (!emailOrUsername.trim() || !password.trim()) {
      setError('请填写所有字段');
      Platform.OS === 'web' 
        ? alert('错误: 请填写所有字段') 
        : Alert.alert('错误', '请填写所有字段');
      return;
    }

    setLoading(true);

    try {
      // 调用登录 API
      const result = await authService.login({
        identifier: emailOrUsername.trim(),
        password,
      });

      // 保存认证信息
      await storage.saveAuthData(result);

      // 清空表单
      setEmailOrUsername('');
      setPassword('');

      // 通知父组件登录成功
      if (onLoginSuccess) {
        onLoginSuccess(result);
      }

      // 关闭模态框
      handleClose();

      // 显示成功提示（不阻塞流程）
      setTimeout(() => {
        Platform.OS === 'web' ? alert('登录成功！') : Alert.alert('成功', '登录成功！');
      }, 300);
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error.message || '登录失败，请检查用户名和密码';
      setError(errorMessage);
      
      // 显示错误提示
      Platform.OS === 'web' 
        ? alert('登录失败: ' + errorMessage) 
        : Alert.alert('登录失败', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {/* 半透明蒙版 */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.modalContainer,
            {
              transform: [
                {
                  translateY: Animated.add(
                    slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                    dragY
                  ),
                },
              ],
            },
          ]}
        >
          {/* 拖动指示器 */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>登录</Text>
              <Text style={styles.subtitle}>欢迎回来！</Text>
              {/* 关闭按钮 */}
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email/Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>邮箱或用户名</Text>
                <TextInput
                  style={styles.input}
                  placeholder="输入邮箱或用户名"
                  placeholderTextColor="#9CA3AF"
                  value={emailOrUsername}
                  onChangeText={setEmailOrUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="输入密码"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="off"
                  textContentType="none"
                  passwordRules=""
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>忘记密码？</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? '登录中...' : '登录'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>或</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Switch to Register */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>还没有账号？</Text>
                <TouchableOpacity onPress={onSwitchToRegister}>
                  <Text style={styles.switchLink}>立即注册</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
  },
  form: {
    paddingHorizontal: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
    marginLeft: 4,
  },
});

