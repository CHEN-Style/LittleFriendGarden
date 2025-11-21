import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../contexts/ThemeContext';
import * as storage from '../utils/storage';
import * as todoService from '../services/todoService';
import * as reminderService from '../services/reminderService';

const MAX_WIDTH = 448;

// 添加任务页的常用标签（供快捷选择）
// 说明：前端限制为单选预设标签，后端当前只按字符串 tags 保存
const SUGGESTED_TAGS = [
  // 宠物日常照护
  '喂食',
  '饮水',
  '零食控制',
  '散步',
  '训练',
  // 健康相关
  '体重记录',
  '疫苗',
  '驱虫',
  '体检',
  '看兽医',
  // 清洁与环境
  '洗澡',
  '美容',
  '清洁环境',
  '猫砂/厕所',
  // 用品与物资
  '购买用品',
  '补货',
];

// 每个标签对应的图标（Ionicons name）
const TAG_ICON_MAP = {
  '喂食': 'restaurant',
  '饮水': 'water',
  '零食控制': 'nutrition',
  '散步': 'walk',
  '训练': 'school',
  '体重记录': 'fitness',
  '疫苗': 'medkit',
  '驱虫': 'bug',
  '体检': 'clipboard',
  '看兽医': 'medkit',
  '洗澡': 'rainy',
  '美容': 'cut',
  '清洁环境': 'trash',
  '猫砂/厕所': 'cube',
  '购买用品': 'cart',
  '补货': 'refresh-circle',
};

// 启用 Android 的布局动画
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AddTaskScreen({ navigation, route }) {
  const { isDarkMode } = useTheme();
  const [mode, setMode] = useState('reminder'); // 'todo' | 'reminder'
  const [ownerType, setOwnerType] = useState('user'); // 'user' | 'pet'
  const [selectedPetId, setSelectedPetId] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [scheduledAt, setScheduledAt] = useState('');
  const [dueAt, setDueAt] = useState('');
  // 统一的日期时间选择状态（移动端）
  const [activePicker, setActivePicker] = useState(null); // 'scheduled' | 'scheduledTime' | 'due' | 'dueTime' | null
  const [tempDate, setTempDate] = useState(new Date());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-11
  const [tagsInput, setTagsInput] = useState('');
  const [repeatRule, setRepeatRule] = useState(null);

  // 下拉选择展开状态
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const pets = route?.params?.pets || [];
  const currentPetIdFromHome = route?.params?.currentPetId || null;

  useEffect(() => {
    if (currentPetIdFromHome) {
      setOwnerType('pet');
      setSelectedPetId(currentPetIdFromHome);
    }
  }, [currentPetIdFromHome]);

  const withSmoothLayout = (cb) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    cb();
  };

  const handleSelectOwnerUser = () => {
    withSmoothLayout(() => {
      setOwnerType('user');
      setSelectedPetId(null);
      setOwnerDropdownOpen(false);
    });
  };

  const handleSelectOwnerPet = (petId) => {
    withSmoothLayout(() => {
      setOwnerType('pet');
      setSelectedPetId(petId);
      setOwnerDropdownOpen(false);
    });
  };

  const handleSelectRepeat = (value) => {
    // 简单映射到 RRULE，后端按字符串保存
    switch (value) {
      case 'none':
        setRepeatRule(null);
        break;
      case 'daily':
        setRepeatRule('FREQ=DAILY;INTERVAL=1');
        break;
      case 'weekly':
        setRepeatRule('FREQ=WEEKLY;INTERVAL=1');
        break;
      case 'monthly':
        setRepeatRule('FREQ=MONTHLY;INTERVAL=1');
        break;
      default:
        setRepeatRule(null);
    }
  };

  const formatDateLabel = (value) => {
    if (!value) return '未选择';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未选择';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  };

  const parseTags = () => {
    const t = tagsInput.trim();
    // 只允许使用预设标签，且单选；否则视为未选择
    if (!t || !SUGGESTED_TAGS.includes(t)) {
      return [];
    }
    return [t];
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请填写任务标题');
      return;
    }

    try {
      const authData = await storage.getAuthData();
      if (!authData || !authData.tokens?.accessToken) {
        Alert.alert('提示', '尚未登录或登录已过期，请重新登录');
        return;
      }
      const token = authData.tokens.accessToken;

      const petId = ownerType === 'pet' ? selectedPetId : null;

      if (mode === 'todo') {
        const payload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          petId: petId || undefined,
          scheduledAt: scheduledAt || undefined,
          dueAt: dueAt || undefined,
          tags: parseTags(),
        };

        await todoService.createTodo(payload, token);
      } else {
        // 当前后端仅支持「为某只宠物创建提醒」
        if (!petId) {
          if (ownerType === 'user') {
            Alert.alert(
              '提示',
              '当前版本的“日程提醒”仅支持关联到某只宠物。\n\n你可以：\n- 切换到“任务”模式，用于只关于自己的待办；或\n- 在“任务归属”中选择一只宠物后再创建提醒。'
            );
          } else {
            Alert.alert('提示', '请先在“任务归属”中选择一只宠物，再创建提醒');
          }
          return;
        }

        const payload = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          petId,
          scheduledAt: scheduledAt || undefined,
          dueAt: dueAt || undefined,
          repeatRule: repeatRule || undefined,
          tags: parseTags(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        await reminderService.createReminder(payload, token);
      }

      Alert.alert('成功', mode === 'todo' ? '任务已创建' : '提醒已创建', [
        { text: '好的', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('创建任务失败:', error);
      Alert.alert('错误', error.message || '创建失败，请稍后重试');
    }
  };

  const containerWidth = Math.min(
    MAX_WIDTH,
    typeof window !== 'undefined' ? window.innerWidth : MAX_WIDTH
  );

  const currentTags = parseTags();

  const currentOwnerLabel = (() => {
    if (ownerType === 'user') return '只关于我';
    if (ownerType === 'pet' && selectedPetId) {
      const pet = pets.find((p) => p.id === selectedPetId);
      if (pet?.name) return pet.name;
      return '宠物';
    }
    return '请选择任务归属';
  })();

  const currentTagLabel = currentTags[0] || '未选择（可选）';

  // 标签改为「单选且仅限预设」
  const handleSelectSingleTag = (tag) => {
    setTagsInput((prev) => {
      const current = prev.trim();
      // 如果再次点击同一个标签，则清空；否则直接切换为该标签
      if (current === tag) {
        return '';
      }
      return tag;
    });
    withSmoothLayout(() => {
      setTagDropdownOpen(false);
    });
  };

  // 打开日期/时间选择器
  const openPicker = (type) => {
    let base;
    if (type === 'scheduled' || type === 'scheduledTime') {
      base = scheduledAt ? new Date(scheduledAt) : new Date();
    } else {
      base = dueAt ? new Date(dueAt) : new Date();
    }
    setTempDate(base);
     // 同步日历到当前值
    setCalendarYear(base.getFullYear());
    setCalendarMonth(base.getMonth());
    setActivePicker(type);
  };

  const handlePickerChange = (event, date) => {
    // Android 上如果用户点击了系统弹窗的取消
    if (Platform.OS === 'android' && event?.type === 'dismissed') {
      setActivePicker(null);
      return;
    }
    if (date) {
      setTempDate(date);
    }
  };

  const handleCancelPicker = () => {
    setActivePicker(null);
  };

  const handleConfirmPicker = () => {
    if (!activePicker) return;

    if (activePicker === 'scheduled') {
      const previous = scheduledAt ? new Date(scheduledAt) : new Date();
      previous.setFullYear(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate()
      );
      setScheduledAt(previous.toISOString());
      // 日期确认后自动进入时间选择
      setTempDate(previous);
      setActivePicker('scheduledTime');
      return;
    }

    if (activePicker === 'scheduledTime') {
      const base = scheduledAt ? new Date(scheduledAt) : new Date();
      base.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
      setScheduledAt(base.toISOString());
      setActivePicker(null);
      return;
    }

    if (activePicker === 'due') {
      const previous = dueAt ? new Date(dueAt) : new Date();
      previous.setFullYear(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        tempDate.getDate()
      );
      setDueAt(previous.toISOString());
      setTempDate(previous);
      setActivePicker('dueTime');
      return;
    }

    if (activePicker === 'dueTime') {
      const base = dueAt ? new Date(dueAt) : new Date();
      base.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
      setDueAt(base.toISOString());
      setActivePicker(null);
    }
  };

  // =========================
  // 自定义日期 + 时间选择逻辑
  // =========================

  // 构建当月日历矩阵
  const buildCalendarMatrix = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay(); // 0-6, 周日为 0

    const weeks = [];
    let currentDay = 1 - firstWeekday;

    for (let w = 0; w < 6; w += 1) {
      const week = [];
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(year, month, currentDay);
        week.push({
          date,
          inCurrentMonth: date.getMonth() === month,
        });
        currentDay += 1;
      }
      weeks.push(week);
    }

    return weeks;
  };

  const calendarMatrix = buildCalendarMatrix(calendarYear, calendarMonth);

  const handleChangeMonth = (delta) => {
    setCalendarMonth((prev) => {
      let nextMonth = prev + delta;
      let nextYear = calendarYear;
      if (nextMonth < 0) {
        nextMonth = 11;
        nextYear -= 1;
      } else if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
      }
      setCalendarYear(nextYear);
      return nextMonth;
    });
  };

  const handleSelectCalendarDay = (date) => {
    setTempDate((prev) => {
      const next = new Date(prev);
      next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      return next;
    });
  };

  const adjustTempHours = (delta) => {
    setTempDate((prev) => {
      const next = new Date(prev);
      let hours = next.getHours() + delta;
      if (hours < 0) hours = 23;
      if (hours > 23) hours = 0;
      next.setHours(hours);
      return next;
    });
  };

  const adjustTempMinutes = (delta) => {
    setTempDate((prev) => {
      const next = new Date(prev);
      let minutes = next.getMinutes() + delta;
      if (minutes < 0) minutes = 55;
      if (minutes > 59) minutes = 0;
      // 5 分钟步进
      next.setMinutes(Math.round(minutes / 5) * 5);
      return next;
    });
  };

  const isDateStep = activePicker === 'scheduled' || activePicker === 'due';
  const isTimeStep =
    activePicker === 'scheduledTime' || activePicker === 'dueTime';

  const handlePrimaryPickerAction = () => {
    // 日期步骤 -> 进入时间步骤
    if (isDateStep) {
      if (activePicker === 'scheduled') {
        setActivePicker('scheduledTime');
      } else if (activePicker === 'due') {
        setActivePicker('dueTime');
      }
      return;
    }

    // 时间步骤 -> 最终确认并写回字段
    if (isTimeStep) {
      if (activePicker === 'scheduledTime') {
        const base = scheduledAt ? new Date(scheduledAt) : new Date();
        base.setFullYear(
          tempDate.getFullYear(),
          tempDate.getMonth(),
          tempDate.getDate()
        );
        base.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
        setScheduledAt(base.toISOString());
      } else if (activePicker === 'dueTime') {
        const base = dueAt ? new Date(dueAt) : new Date();
        base.setFullYear(
          tempDate.getFullYear(),
          tempDate.getMonth(),
          tempDate.getDate()
        );
        base.setHours(tempDate.getHours(), tempDate.getMinutes(), 0, 0);
        setDueAt(base.toISOString());
      }
      setActivePicker(null);
    }
  };

  const handleSecondaryPickerAction = () => {
    // 日期步骤 -> 取消
    if (isDateStep) {
      setActivePicker(null);
      return;
    }

    // 时间步骤 -> 返回日期步骤
    if (isTimeStep) {
      if (activePicker === 'scheduledTime') {
        setActivePicker('scheduled');
      } else if (activePicker === 'dueTime') {
        setActivePicker('due');
      }
    }
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
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
              style={[styles.iconButton, isDarkMode && styles.iconButtonDark]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={isDarkMode ? '#F97316' : '#111827'}
              />
            </TouchableOpacity>
            <Text
              style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}
            >
              {mode === 'todo' ? '添加待办任务' : '添加任务'}
            </Text>
            <TouchableOpacity
              style={styles.headerToggleButton}
              onPress={() =>
                withSmoothLayout(() => {
                  setMode((prev) => (prev === 'reminder' ? 'todo' : 'reminder'));
                })
              }
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.headerToggleText,
                  isDarkMode && styles.headerToggleTextDark,
                ]}
              >
                {mode === 'reminder' ? '待办任务' : '添加任务'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Owner selection - 下拉选择 */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              任务归属
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownHeader,
                  isDarkMode && styles.dropdownHeaderDark,
                ]}
                onPress={() =>
                  withSmoothLayout(() => {
                    setOwnerDropdownOpen((prev) => !prev);
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.dropdownHeaderLeft}>
                  <Ionicons
                    name={ownerType === 'pet' ? 'paw' : 'person'}
                    size={16}
                    color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.dropdownHeaderText,
                      currentOwnerLabel === '请选择任务归属' &&
                        styles.dropdownHeaderPlaceholder,
                      isDarkMode && styles.dropdownHeaderTextDark,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {currentOwnerLabel}
                  </Text>
                </View>
                <Ionicons
                  name={ownerDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                />
              </TouchableOpacity>

              {ownerDropdownOpen && (
                <View
                  style={[
                    styles.dropdownPanel,
                    isDarkMode && styles.dropdownPanelDark,
                  ]}
                >
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        ownerType === 'user' && styles.dropdownItemActive,
                      ]}
                      onPress={handleSelectOwnerUser}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="person"
                        size={16}
                        color={
                          ownerType === 'user' ? '#FFFFFF' : '#4B5563'
                        }
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isDarkMode && styles.dropdownItemTextDark,
                          ownerType === 'user' && styles.dropdownItemTextActive,
                        ]}
                      >
                        只关于我
                      </Text>
                    </TouchableOpacity>

                    {pets.map((pet) => {
                      const active =
                        ownerType === 'pet' && selectedPetId === pet.id;
                      return (
                        <TouchableOpacity
                          key={pet.id}
                          style={[
                            styles.dropdownItem,
                            active && styles.dropdownItemActive,
                          ]}
                          onPress={() => handleSelectOwnerPet(pet.id)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="paw"
                            size={16}
                            color={active ? '#FFFFFF' : '#4B5563'}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isDarkMode && styles.dropdownItemTextDark,
                              active && styles.dropdownItemTextActive,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {pet.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Title & description */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              基本信息
            </Text>
            <View
              style={[
                styles.inputGroup,
                isDarkMode && styles.inputGroupDark,
              ]}
            >
              <TextInput
                style={[styles.input, isDarkMode && styles.inputDark]}
                placeholder="任务标题（必填）"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                value={title}
                onChangeText={setTitle}
              />
            </View>
            <View
              style={[
                styles.inputGroup,
                isDarkMode && styles.inputGroupDark,
              ]}
            >
              <TextInput
                style={[
                  styles.textArea,
                  isDarkMode && styles.inputDark,
                ]}
                placeholder="补充说明（可选）"
                placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                value={description}
                onChangeText={setDescription}
                multiline
              />
            </View>
          </View>

          {/* Priority */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              优先级
            </Text>
            <View style={styles.priorityRow}>
              {[
                { key: 'low', label: '低' },
                { key: 'medium', label: '中' },
                { key: 'high', label: '高' },
                { key: 'urgent', label: '紧急' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.key}
                  style={[
                    styles.priorityChip,
                    isDarkMode && styles.priorityChipDark,
                    priority === p.key && styles.priorityChipActive,
                  ]}
                  onPress={() =>
                    withSmoothLayout(() => {
                      setPriority(p.key);
                    })
                  }
                  activeOpacity={0.9}
                >
                  <Text
                    style={[
                      styles.priorityChipText,
                      priority === p.key && styles.priorityChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time fields */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              时间
            </Text>
            <View
              style={[
                styles.inputGroup,
                isDarkMode && styles.inputGroupDark,
              ]}
            >
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  placeholder="计划时间（例如 2025-11-20 10:00，可选）"
                  placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  value={scheduledAt}
                  onChangeText={setScheduledAt}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateField}
                    onPress={() => openPicker('scheduled')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.dateFieldText,
                        !scheduledAt && styles.dateFieldPlaceholder,
                        isDarkMode && styles.dateFieldTextDark,
                      ]}
                    >
                      {scheduledAt
                        ? formatDateLabel(scheduledAt)
                        : '选择计划时间（可选）'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
            <View
              style={[
                styles.inputGroup,
                isDarkMode && styles.inputGroupDark,
              ]}
            >
              {Platform.OS === 'web' ? (
                <TextInput
                  style={[styles.input, isDarkMode && styles.inputDark]}
                  placeholder="截止时间（例如 2025-11-20 18:00，可选）"
                  placeholderTextColor={isDarkMode ? '#6B7280' : '#9CA3AF'}
                  value={dueAt}
                  onChangeText={setDueAt}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.dateField}
                    onPress={() => openPicker('due')}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="time"
                      size={16}
                      color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.dateFieldText,
                        !dueAt && styles.dateFieldPlaceholder,
                        isDarkMode && styles.dateFieldTextDark,
                      ]}
                    >
                      {dueAt
                        ? formatDateLabel(dueAt)
                        : '选择截止时间（可选）'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* 标签（待办 & 提醒 共用） */}
          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                isDarkMode && styles.sectionTitleDark,
              ]}
            >
              标签（单选）
            </Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={[
                  styles.dropdownHeader,
                  isDarkMode && styles.dropdownHeaderDark,
                ]}
                onPress={() =>
                  withSmoothLayout(() => {
                    setTagDropdownOpen((prev) => !prev);
                  })
                }
                activeOpacity={0.8}
              >
                <View style={styles.dropdownHeaderLeft}>
                  <Ionicons
                    name="pricetag"
                    size={16}
                    color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.dropdownHeaderText,
                      !currentTags.length && styles.dropdownHeaderPlaceholder,
                      isDarkMode && styles.dropdownHeaderTextDark,
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {currentTagLabel}
                  </Text>
                </View>
                <Ionicons
                  name={tagDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={isDarkMode ? '#E5E7EB' : '#6B7280'}
                />
              </TouchableOpacity>

              {tagDropdownOpen && (
                <View
                  style={[
                    styles.dropdownPanel,
                    isDarkMode && styles.dropdownPanelDark,
                  ]}
                >
                  <ScrollView
                    style={styles.dropdownScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    {SUGGESTED_TAGS.map((tag) => {
                      const active = tagsInput.trim() === tag;
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.dropdownItem,
                            active && styles.dropdownItemActive,
                          ]}
                          onPress={() => handleSelectSingleTag(tag)}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name={TAG_ICON_MAP[tag] || 'pricetag'}
                            size={16}
                            color={active ? '#FFFFFF' : isDarkMode ? '#E5E7EB' : '#6B7280'}
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              isDarkMode && styles.dropdownItemTextDark,
                              active && styles.dropdownItemTextActive,
                            ]}
                          >
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* 提醒模式专属：重复规则 */}
          {mode === 'reminder' && (
            <View style={styles.section}>
              <Text
                style={[
                  styles.sectionTitle,
                  isDarkMode && styles.sectionTitleDark,
                ]}
              >
                重复规则
              </Text>
              <View style={styles.priorityRow}>
                {[
                  { key: 'none', label: '不重复' },
                  { key: 'daily', label: '每天' },
                  { key: 'weekly', label: '每周' },
                  { key: 'monthly', label: '每月' },
                ].map((item) => {
                  const active =
                    (item.key === 'none' && !repeatRule) ||
                    (item.key !== 'none' &&
                      repeatRule &&
                      repeatRule.includes(
                        item.key.toUpperCase()?.replace('LY', 'LY')
                      ));
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.priorityChip,
                        isDarkMode && styles.priorityChipDark,
                        active && styles.priorityChipActive,
                      ]}
                      onPress={() => handleSelectRepeat(item.key)}
                      activeOpacity={0.9}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          active && styles.priorityChipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Submit button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSubmit}
              activeOpacity={0.9}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>
                {mode === 'todo' ? '保存任务' : '保存提醒'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* 日期/时间选择浮层（移动端，自定义日历 + 时间调节） */}
      {Platform.OS !== 'web' && activePicker && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
          <View
            style={[
              styles.pickerSheet,
              isDarkMode && styles.pickerSheetDark,
            ]}
          >
            <Text
              style={[
                styles.pickerTitle,
                isDarkMode && styles.pickerTitleDark,
              ]}
            >
              {isDateStep
                ? activePicker === 'scheduled'
                  ? '选择计划日期'
                  : '选择截止日期'
                : activePicker === 'scheduledTime'
                ? '选择计划时间'
                : '选择截止时间'}
            </Text>

            {isDateStep ? (
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => handleChangeMonth(-1)}
                    style={styles.monthSwitchButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chevron-back"
                      size={18}
                      color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                    />
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.calendarHeaderText,
                      isDarkMode && styles.calendarHeaderTextDark,
                    ]}
                  >
                    {calendarYear}年 {calendarMonth + 1}月
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleChangeMonth(1)}
                    style={styles.monthSwitchButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarWeekHeader}>
                  {['日', '一', '二', '三', '四', '五', '六'].map((w) => (
                    <Text
                      key={w}
                      style={[
                        styles.calendarWeekDay,
                        isDarkMode && styles.calendarWeekDayDark,
                      ]}
                    >
                      {w}
                    </Text>
                  ))}
                </View>

                {calendarMatrix.map((week, idx) => (
                  <View key={idx} style={styles.calendarWeekRow}>
                    {week.map((cell) => {
                      const day = cell.date.getDate();
                      const isToday =
                        cell.date.toDateString() ===
                        new Date().toDateString();
                      const isSelected =
                        cell.date.toDateString() ===
                        tempDate.toDateString();
                      return (
                        <TouchableOpacity
                          key={cell.date.toISOString()}
                          style={[
                            styles.calendarDay,
                            !cell.inCurrentMonth &&
                              styles.calendarDayOutside,
                            isSelected && styles.calendarDaySelected,
                            isToday && styles.calendarDayToday,
                          ]}
                          onPress={() => handleSelectCalendarDay(cell.date)}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={[
                              styles.calendarDayText,
                              !cell.inCurrentMonth &&
                                styles.calendarDayTextOutside,
                              isSelected && styles.calendarDayTextSelected,
                            ]}
                          >
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.timeContainer}>
                <Text
                  style={[
                    styles.timeDisplay,
                    isDarkMode && styles.timeDisplayDark,
                  ]}
                >
                  {String(tempDate.getHours()).padStart(2, '0')}:
                  {String(tempDate.getMinutes()).padStart(2, '0')}
                </Text>

                <View style={styles.timeRow}>
                  <Text
                    style={[
                      styles.timeLabel,
                      isDarkMode && styles.timeLabelDark,
                    ]}
                  >
                    小时
                  </Text>
                  <View style={styles.timeAdjustGroup}>
                    <TouchableOpacity
                      style={styles.timeAdjustButton}
                      onPress={() => adjustTempHours(-1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.timeValue,
                        isDarkMode && styles.timeValueDark,
                      ]}
                    >
                      {String(tempDate.getHours()).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeAdjustButton}
                      onPress={() => adjustTempHours(1)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timeRow}>
                  <Text
                    style={[
                      styles.timeLabel,
                      isDarkMode && styles.timeLabelDark,
                    ]}
                  >
                    分钟（5 分钟步进）
                  </Text>
                  <View style={styles.timeAdjustGroup}>
                    <TouchableOpacity
                      style={styles.timeAdjustButton}
                      onPress={() => adjustTempMinutes(-5)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="remove"
                        size={18}
                        color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.timeValue,
                        isDarkMode && styles.timeValueDark,
                      ]}
                    >
                      {String(tempDate.getMinutes()).padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeAdjustButton}
                      onPress={() => adjustTempMinutes(5)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="add"
                        size={18}
                        color={isDarkMode ? '#E5E7EB' : '#4B5563'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.pickerActions}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.pickerButtonCancel]}
                onPress={handleSecondaryPickerAction}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    styles.pickerButtonTextCancel,
                  ]}
                >
                  {isDateStep ? '取消' : '返回日期'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickerButton, styles.pickerButtonConfirm]}
                onPress={handlePrimaryPickerAction}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pickerButtonText,
                    styles.pickerButtonTextConfirm,
                  ]}
                >
                  {isDateStep ? '下一步' : '完成'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  containerDark: {
    backgroundColor: '#111827',
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
  mainContainerDark: {
    backgroundColor: '#1F2937',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: Platform.OS === 'web' ? 0 : Constants.statusBarHeight,
  },
  headerDark: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderBottomColor: '#374151',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  headerTitleDark: {
    color: '#F9FAFB',
  },
  headerToggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F97316',
  },
  headerToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerToggleTextDark: {
    color: '#FFFFFF',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonDark: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#F9FAFB',
  },
  ownerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  ownerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
    gap: 6,
  },
  ownerChipDark: {
    backgroundColor: '#374151',
  },
  ownerChipActive: {
    backgroundColor: '#F97316',
  },
  ownerChipText: {
    fontSize: 13,
    color: '#374151',
  },
  ownerChipTextDark: {
    color: '#E5E7EB',
  },
  ownerChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputGroup: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  inputGroupDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  input: {
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  inputDark: {
    color: '#F9FAFB',
  },
  textArea: {
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  tagSuggestionContainer: {
    marginTop: 8,
    gap: 4,
  },
  tagSuggestionLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tagSuggestionLabelDark: {
    color: '#9CA3AF',
  },
  // 通用下拉样式
  dropdownContainer: {
    marginTop: 4,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownHeaderDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownHeaderText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownHeaderTextDark: {
    color: '#F9FAFB',
  },
  dropdownHeaderPlaceholder: {
    color: '#9CA3AF',
  },
  dropdownPanel: {
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownPanelDark: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemActive: {
    backgroundColor: '#F97316',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownItemTextDark: {
    color: '#E5E7EB',
  },
  dropdownItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  priorityChipDark: {
    backgroundColor: '#4B5563',
  },
  priorityChipActive: {
    backgroundColor: '#F97316',
  },
  priorityChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  priorityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dateFieldText: {
    fontSize: 14,
    color: '#111827',
  },
  dateFieldTextDark: {
    color: '#F9FAFB',
  },
  dateFieldPlaceholder: {
    color: '#9CA3AF',
  },
  // 日期时间选择浮层
  pickerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  pickerBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerSheet: {
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  pickerSheetDark: {
    backgroundColor: '#1F2937',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerTitleDark: {
    color: '#F9FAFB',
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
  pickerButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerButtonCancel: {
    backgroundColor: 'transparent',
  },
  pickerButtonConfirm: {
    backgroundColor: '#F97316',
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerButtonTextCancel: {
    color: '#6B7280',
  },
  pickerButtonTextConfirm: {
    color: '#FFFFFF',
  },
  // 日历
  calendarContainer: {
    marginTop: 4,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthSwitchButton: {
    padding: 4,
  },
  calendarHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  calendarHeaderTextDark: {
    color: '#F9FAFB',
  },
  calendarWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  calendarWeekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
  },
  calendarWeekDayDark: {
    color: '#9CA3AF',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  calendarDay: {
    flex: 1,
    marginVertical: 2,
    marginHorizontal: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  calendarDayOutside: {
    opacity: 0.3,
  },
  calendarDayToday: {
    borderWidth: 1,
    borderColor: '#F97316',
  },
  calendarDaySelected: {
    backgroundColor: '#F97316',
  },
  calendarDayText: {
    fontSize: 13,
    color: '#111827',
  },
  calendarDayTextOutside: {
    color: '#9CA3AF',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // 时间调整
  timeContainer: {
    marginTop: 8,
  },
  timeDisplay: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  timeDisplayDark: {
    color: '#F9FAFB',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#374151',
  },
  timeLabelDark: {
    color: '#D1D5DB',
  },
  timeAdjustGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeAdjustButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center',
  },
  timeValueDark: {
    color: '#F9FAFB',
  },
});


