import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import * as storage from './utils/storage';
import { ThemeProvider } from './contexts/ThemeContext';

// 导入页面组件
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查用户是否已登录
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authData = await storage.getAuthData();
      setIsLoggedIn(!!authData && !!authData.access_token);
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 登录成功回调
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // 登出回调
  const handleLogout = async () => {
    await storage.clearAuthData();
    setIsLoggedIn(false);
  };

  // 加载中显示
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" />
        <Stack.Navigator
          initialRouteName={isLoggedIn ? 'Home' : 'Onboarding'}
          screenOptions={{
            headerShown: false,
            headerTitleStyle: {
              fontSize: 18,
              fontWeight: '700',
            },
          }}
        >
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen {...props} onLoginSuccess={handleLoginSuccess} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Home">
            {(props) => (
              <HomeScreen {...props} onLogout={handleLogout} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {(props) => (
              <ProfileScreen {...props} onLogout={handleLogout} />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
