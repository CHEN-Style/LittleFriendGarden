import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

// 动物emoji列表
const ANIMAL_EMOJIS = ['🐾', '🐱', '🐶', '🐰', '🐹', '🐢', '🐼', '🦊', '🐨', '🐯', '🦁', '🐮', '🐷', '🐦', '🐟', '🦖', '🦜', '🐧'];

export default function FallingEmojis({ 
  batchSize = 1,           // 每批生成数量（默认1个）
  interval = 1000,         // 生成间隔（默认1秒）
  emojiSize = 30,          // emoji大小
  totalBatches = 10,       // 总批次数（默认10批）
  fallDuration = 12000,    // 下落时间（默认12秒）
}) {
  const [emojis, setEmojis] = useState([]);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const emojiIdCounter = useRef(0);
  const batchCounterRef = useRef(0);
  const timeoutRefs = useRef([]);
  const animationRefs = useRef(new Map());
  const dimensionsRef = useRef(dimensions);

  // 更新 dimensions ref
  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  // 监听屏幕尺寸变化
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  // 创建并启动单个emoji的下落动画
  const createFallingEmoji = React.useCallback((batchIndex) => {
    const currentDimensions = dimensionsRef.current;
    const id = emojiIdCounter.current++;
    
    // 随机选择emoji
    const emoji = ANIMAL_EMOJIS[Math.floor(Math.random() * ANIMAL_EMOJIS.length)];
    
    // 创建动画值
    const translateY = new Animated.Value(-50);
    const translateX = new Animated.Value(Math.random() * (currentDimensions.width - 50));
    const opacity = new Animated.Value(0.5 + Math.random() * 0.5);
    const scale = new Animated.Value(0.8 + Math.random() * 0.4);
    const rotation = new Animated.Value(0);
    
    // 随机下落速度（略有变化，更自然）
    const duration = fallDuration * (0.8 + Math.random() * 0.4);
    
    // 创建旋转动画（持续循环）
    const rotationAnim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000 + Math.random() * 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // 创建下落动画（使用ease缓动，更自然）
    const fallingAnim = Animated.timing(translateY, {
      toValue: currentDimensions.height + 50,
      duration: duration,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1), // 自然的缓动曲线
      useNativeDriver: true,
    });

    // 组合动画
    const parallelAnim = Animated.parallel([
      fallingAnim,
      rotationAnim,
    ]);
    
    // 保存动画引用
    animationRefs.current.set(id, parallelAnim);
    
    // 创建emoji数据
    const emojiData = {
      id,
      emoji,
      translateY,
      translateX,
      opacity,
      scale,
      rotation,
      batchIndex, // 记录所属批次
    };
    
    // 添加到列表
    setEmojis((prev) => [...prev, emojiData]);
    
    // 使用setTimeout确保动画完成后清理（备用清理机制）
    const cleanupTimeout = setTimeout(() => {
      setEmojis((prev) => prev.filter((e) => e.id !== id));
      animationRefs.current.delete(id);
    }, duration + 500); // 动画时长 + 缓冲时间
    
    timeoutRefs.current.push(cleanupTimeout);
    
    // 启动动画
    parallelAnim.start((result) => {
      // 无论动画是否完成，都清理
      clearTimeout(cleanupTimeout);
      setEmojis((prev) => prev.filter((e) => e.id !== id));
      animationRefs.current.delete(id);
    });
  }, [fallDuration]);

  // 固定批次循环生成emoji
  useEffect(() => {
    // 清理之前的timeout
    timeoutRefs.current.forEach((timeout) => {
      if (timeout) {
        clearTimeout(timeout);
      }
    });
    timeoutRefs.current = [];
    
    // 计算总循环时间（确保覆盖整个流程）
    const totalCycleTime = interval * totalBatches;
    const batchCleanupDelay = fallDuration + 1000; // 在动画完成后额外延迟1秒再清理
    
    // 生成一批emoji的函数
    const generateBatch = (batchIndex) => {
      for (let i = 0; i < batchSize; i++) {
        const timeout = setTimeout(() => {
          createFallingEmoji(batchIndex);
        }, i * 200); // 每批内部稍微错开
        timeoutRefs.current.push(timeout);
      }
    };
    
    // 循环生成函数
    const startCycle = () => {
      batchCounterRef.current = 0;
      
      // 生成所有批次
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const timeout = setTimeout(() => {
          generateBatch(batchIndex);
          batchCounterRef.current++;
          
          // 如果这是最后一批，安排下一个循环
          if (batchCounterRef.current >= totalBatches) {
            const nextCycleTimeout = setTimeout(() => {
              startCycle();
            }, interval); // 最后一批后等待interval时间再开始新循环
            timeoutRefs.current.push(nextCycleTimeout);
          }
        }, batchIndex * interval);
        timeoutRefs.current.push(timeout);
      }
    };
    
    // 启动第一个循环
    startCycle();

    // 清理函数
    return () => {
      // 清理所有timeout
      timeoutRefs.current.forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });
      timeoutRefs.current = [];
      // 停止所有动画
      animationRefs.current.forEach((anim) => {
        anim.stop();
      });
      animationRefs.current.clear();
      // 清空emoji列表
      setEmojis([]);
    };
  }, [batchSize, interval, totalBatches, fallDuration, createFallingEmoji]);

  // 旋转插值
  const getRotation = (rotation) => {
    return rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  };

  return (
    <View style={styles.container} pointerEvents="none">
      {emojis.map((emojiData) => (
        <Animated.View
          key={emojiData.id}
          style={[
            styles.emojiContainer,
            {
              transform: [
                { translateX: emojiData.translateX },
                { translateY: emojiData.translateY },
                { scale: emojiData.scale },
                { rotate: getRotation(emojiData.rotation) },
              ],
              opacity: emojiData.opacity,
            },
          ]}
        >
          <Text style={[styles.emoji, { fontSize: emojiSize }]}>
            {emojiData.emoji}
          </Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  emojiContainer: {
    position: 'absolute',
    top: 0,
  },
  emoji: {
    textAlign: 'center',
  },
});

