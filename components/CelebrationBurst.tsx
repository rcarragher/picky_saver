import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../constants/theme';

const EMOJIS = ['🎉', '⭐', '✨', '🎊', '🎉', '✨'];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function EmojiParticle({ emoji, index }: { emoji: string; index: number }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const targetX = randomBetween(-120, 120);
    const targetY = randomBetween(-180, -40);

    translateX.value = withDelay(index * 50, withTiming(targetX, { duration: 1200 }));
    translateY.value = withDelay(index * 50, withTiming(targetY, { duration: 1200 }));
    opacity.value = withDelay(index * 50, withTiming(0, { duration: 1500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.emoji, animatedStyle]}>
      {emoji}
    </Animated.Text>
  );
}

export function CelebrationBurst() {
  const colors = useTheme();
  const checkScale = useSharedValue(0);

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 8, stiffness: 120 });
  }, []);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {EMOJIS.map((emoji, i) => (
        <EmojiParticle key={i} emoji={emoji} index={i} />
      ))}
      <Animated.Text
        style={[styles.checkmark, { color: colors.accent }, checkAnimatedStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        ✓
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    marginBottom: spacing.md,
  },
  emoji: {
    fontSize: 24,
    position: 'absolute',
  },
  checkmark: {
    fontSize: 64,
  },
});
