import React, { useCallback, useRef } from 'react';
import { Animated, Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native';

type AnimatedPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * A Pressable wrapper that adds a subtle scale + opacity press animation.
 * Scale 0.97, opacity 0.85, 100ms duration.
 */
export function AnimatedPressable({ style, onPressIn, onPressOut, children, ...rest }: AnimatedPressableProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.97, duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.85, duration: 100, useNativeDriver: true }),
      ]).start();
      onPressIn?.(e);
    },
    [scale, opacity, onPressIn],
  );

  const handlePressOut = useCallback(
    (e: any) => {
      Animated.parallel([
        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      onPressOut?.(e);
    },
    [scale, opacity, onPressOut],
  );

  return (
    <Animated.View style={[{ transform: [{ scale }], opacity }]}>
      <Pressable
        {...rest}
        style={style}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
