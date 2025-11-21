import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * 一次性的彩带 + 中心 Emoji 庆祝动效
 *
 * 使用方式：
 * - 由父组件管理 visible 状态
 * - 当需要触发时，将 visible 置为 true，组件内部会在动画结束后回调 onHide()
 * - 父组件在 onHide 中把 visible 置为 false 即可
 */
export default function ConfettiCelebration({
  visible,
  onHide,
  emoji = '🎉',
  colors = ['#F97316', '#FDBA74', '#FACC15', '#4ADE80', '#38BDF8', '#A855F7'],
  count = 120,
  explosionSpeed = 350,
  fallSpeed = 1800,
}) {
  const [emojiOpacity] = useState(() => new Animated.Value(0));
  const [confettiKey, setConfettiKey] = useState(0);

  const shouldRender = visible;

  const handleConfettiAnimationEnd = () => {
    Animated.timing(emojiOpacity, {
      toValue: 0,
      duration: 320,
      useNativeDriver: true,
    }).start(() => {
      onHide?.();
    });
  };

  // 当 visible 从 false -> true 时，启动一次动画
  useMemo(() => {
    if (!visible) return;

    // 重置动画状态
    emojiOpacity.setValue(0);
    setConfettiKey((key) => key + 1);

    Animated.timing(emojiOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      {/* 碎纸彩带本身的 overlay */}
      <View style={styles.confettiOverlay} pointerEvents="none">
        <ConfettiCannon
          key={confettiKey}
          count={count}
          origin={{
            x: SCREEN_WIDTH / 2,
            y: SCREEN_HEIGHT / 2,
          }}
          colors={colors}
          fadeOut
          explosionSpeed={explosionSpeed}
          fallSpeed={fallSpeed}
          onAnimationEnd={handleConfettiAnimationEnd}
        />
      </View>

      {/* 中心位置的彩带 emoji，独立 overlay，层级高于 ConfettiCannon，避免被其内部 zIndex/elevation 覆盖 */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.confettiEmojiContainer,
          {
            opacity: emojiOpacity,
            transform: [
              {
                scale: emojiOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.confettiEmoji}>{emoji}</Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  confettiOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  confettiEmojiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    elevation: 10, // Android 上确保层级足够高
  },
  confettiEmoji: {
    fontSize: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    ...Platform.select({
      web: {
        userSelect: 'none',
      },
    }),
  },
});


