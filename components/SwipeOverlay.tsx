import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { fontSize, fontWeight } from '../constants/theme';

type Props = {
  animatedOpacity: SharedValue<number>;
  direction: 'keep' | 'delete';
};

export function SwipeOverlay({ animatedOpacity, direction }: Props) {
  const colors = useTheme();
  const isKeep = direction === 'keep';
  const color = isKeep ? colors.keep : colors.delete;
  const label = isKeep ? 'KEEP' : 'DELETE';
  const icon = isKeep ? '✓' : '✕';

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: color,
    borderWidth: 3,
    borderRadius: 12,
    opacity: animatedOpacity.value,
  }));

  return (
    <>
      <Animated.View
        style={[
          styles.overlay,
          isKeep ? styles.keepPosition : styles.deletePosition,
          animatedStyle,
        ]}
        pointerEvents="none"
      >
        <Text style={[styles.label, { color }]}>{label}</Text>
        <Text style={[styles.icon, { color }]}>{icon}</Text>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, borderStyle]} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 24,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  keepPosition: {
    left: 20,
  },
  deletePosition: {
    right: 20,
  },
  label: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
  icon: {
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
  },
});
