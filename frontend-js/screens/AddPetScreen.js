import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import Constants from 'expo-constants';
import * as petService from '../services/petService.js';
import * as storage from '../utils/storage.js';

export default function AddPetScreen({ navigation }) {
  const { isDarkMode } = useTheme();
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    sex: 'unknown',
    birthDate: '',
    color: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 物种选项（根据后端 schema）
  const speciesOptions = [
    { value: 'dog', label: '狗 🐕', icon: 'paw' },
    { value: 'cat', label: '猫 🐱', icon: 'paw' },
    { value: 'bird', label: '鸟 🐦', icon: 'egg' },
    { value: 'rabbit', label: '兔子 🐰', icon: 'leaf' },
    { value: 'fish', label: '鱼 🐟', icon: 'water' },
    { value: 'reptile', label: '爬行动物 🦎', icon: 'bug' },
    { value: 'other', label: '其他 🐾', icon: 'ellipsis-horizontal' },
  ];

  // 性别选项
  const sexOptions = [
    { value: 'male', label: '雄性 ♂', icon: 'male' },
    { value: 'female', label: '雌性 ♀', icon: 'female' },
    { value: 'unknown', label: '未知', icon: 'help-circle' },
  ];

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // 验证表单
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '请输入宠物名字';
    }

    if (formData.birthDate && !isValidDate(formData.birthDate)) {
      newErrors.birthDate = '日期格式错误，请使用 YYYY-MM-DD';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 验证日期格式
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 获取 token
      const authData = await storage.getAuthData();
      if (!authData || !authData.tokens) {
        Alert.alert('错误', '请先登录');
        navigation.navigate('Onboarding');
        return;
      }

      // 准备提交数据
      const petData = {
        name: formData.name.trim(),
        species: formData.species,
        breed: formData.breed.trim() || undefined,
        sex: formData.sex,
        birthDate: formData.birthDate.trim() || undefined,
        color: formData.color.trim() || undefined,
      };

      // 调用 API 创建宠物
      const newPet = await petService.createPet(petData, authData.tokens.accessToken);

      Alert.alert(
        '成功',
        `${newPet.name} 已添加到您的宠物列表！`,
        [
          {
            text: '确定',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('创建宠物失败:', error);
      Alert.alert('错误', error.message || '创建宠物失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {/* Header */}
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#F9FAFB" : "#111827"} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>添加宠物</Text>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 名字 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>
            宠物名字 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode && styles.inputDark,
              errors.name && styles.inputError,
            ]}
            placeholder="例如：Charlie"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        {/* 物种 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>物种</Text>
          <View style={styles.optionsGrid}>
            {speciesOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionCard,
                  isDarkMode && styles.optionCardDark,
                  formData.species === option.value && styles.optionCardActive,
                ]}
                onPress={() => updateField('species', option.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={
                    formData.species === option.value
                      ? '#FFFFFF'
                      : isDarkMode
                      ? '#9CA3AF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    isDarkMode && styles.optionTextDark,
                    formData.species === option.value && styles.optionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 品种 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>品种（可选）</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="例如：Golden Retriever"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={formData.breed}
            onChangeText={(value) => updateField('breed', value)}
          />
        </View>

        {/* 性别 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>性别</Text>
          <View style={styles.sexOptions}>
            {sexOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.sexOption,
                  isDarkMode && styles.sexOptionDark,
                  formData.sex === option.value && styles.sexOptionActive,
                ]}
                onPress={() => updateField('sex', option.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={
                    formData.sex === option.value
                      ? '#FFFFFF'
                      : isDarkMode
                      ? '#9CA3AF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.sexOptionText,
                    isDarkMode && styles.sexOptionTextDark,
                    formData.sex === option.value && styles.sexOptionTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 出生日期 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>出生日期（可选）</Text>
          <TextInput
            style={[
              styles.input,
              isDarkMode && styles.inputDark,
              errors.birthDate && styles.inputError,
            ]}
            placeholder="YYYY-MM-DD，例如：2020-05-15"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={formData.birthDate}
            onChangeText={(value) => updateField('birthDate', value)}
          />
          {errors.birthDate && (
            <Text style={styles.errorText}>{errors.birthDate}</Text>
          )}
        </View>

        {/* 颜色 */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, isDarkMode && styles.labelDark]}>颜色（可选）</Text>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            placeholder="例如：金色"
            placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
            value={formData.color}
            onChangeText={(value) => updateField('color', value)}
          />
        </View>

        {/* 提交按钮 */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>创建宠物</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  containerDark: {
    backgroundColor: '#111827',
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
  headerDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelDark: {
    color: '#D1D5DB',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  inputDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
    color: '#F9FAFB',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  optionCardDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  optionCardActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  optionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  optionTextDark: {
    color: '#9CA3AF',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  sexOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sexOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
  },
  sexOptionDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  sexOptionActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  sexOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  sexOptionTextDark: {
    color: '#9CA3AF',
  },
  sexOptionTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

