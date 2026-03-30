import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { SwipeOverlay } from './SwipeOverlay';
import { borderRadius } from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.4;
const MAX_ROTATION = 15;

type Props = {
  asset: { uri: string; width: number; height: number; id: string };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
};

export function PhotoCard({ asset, onSwipeLeft, onSwipeRight }: Props) {
  const translateX = useSharedValue(0);
  const keepOpacity = useSharedValue(0);
  const deleteOpacity = useSharedValue(0);
  const hasTriggeredHaptic = useSharedValue(false);
  const reduceMotion = useReducedMotion();

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const fireSwipeLeft = () => {
    onSwipeLeft();
  };
  const fireSwipeRight = () => {
    onSwipeRight();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;

      const progress = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
      const opacity = progress * 0.6;

      if (event.translationX > 0) {
        keepOpacity.value = opacity;
        deleteOpacity.value = 0;
      } else {
        deleteOpacity.value = opacity;
        keepOpacity.value = 0;
      }

      if (Math.abs(event.translationX) >= SWIPE_THRESHOLD && !hasTriggeredHaptic.value) {
        hasTriggeredHaptic.value = true;
        runOnJS(triggerHaptic)();
      } else if (Math.abs(event.translationX) < SWIPE_THRESHOLD) {
        hasTriggeredHaptic.value = false;
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        if (reduceMotion) {
          keepOpacity.value = 0;
          translateX.value = 0;
          runOnJS(fireSwipeRight)();
        } else {
          translateX.value = withTiming(
            SCREEN_WIDTH * 1.5,
            { duration: 300, easing: Easing.out(Easing.ease) },
            () => runOnJS(fireSwipeRight)(),
          );
        }
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        if (reduceMotion) {
          deleteOpacity.value = 0;
          translateX.value = 0;
          runOnJS(fireSwipeLeft)();
        } else {
          translateX.value = withTiming(
            -SCREEN_WIDTH * 1.5,
            { duration: 300, easing: Easing.out(Easing.ease) },
            () => runOnJS(fireSwipeLeft)(),
          );
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        keepOpacity.value = withTiming(0, { duration: 200 });
        deleteOpacity.value = withTiming(0, { duration: 200 });
      }
    })
    .withTestId('photo-pan');

  const cardStyle = useAnimatedStyle(() => {
    const rotation = reduceMotion
      ? 0
      : (translateX.value / SCREEN_WIDTH) * MAX_ROTATION;

    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  const aspectRatio = asset.width && asset.height ? asset.width / asset.height : 3 / 4;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, cardStyle]} testID="photo-card">
        <Image
          source={{ uri: asset.uri }}
          style={[styles.image, { aspectRatio }]}
          contentFit="cover"
          testID="photo-image"
        />
        <SwipeOverlay animatedOpacity={keepOpacity} direction="keep" />
        <SwipeOverlay animatedOpacity={deleteOpacity} direction="delete" />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    borderRadius: borderRadius.md,
  },
});
