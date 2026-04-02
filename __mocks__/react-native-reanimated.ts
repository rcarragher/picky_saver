import React from 'react';
import { View, Text } from 'react-native';

const useSharedValue = (init: any) => ({ value: init });
const useAnimatedStyle = (fn: () => any) => fn();
const useReducedMotion = () => false;
const withSpring = (val: any) => val;
const withTiming = (val: any, _config?: any, callback?: any) => {
  if (callback) callback(true);
  return val;
};
const withDelay = (_delay: any, anim: any) => anim;
const runOnJS = (fn: any) => fn;
const Easing = {
  out: (fn: any) => fn,
  ease: (v: any) => v,
  in: (fn: any) => fn,
  inOut: (fn: any) => fn,
  linear: (v: any) => v,
};

const useEvent = (_callback: any, _events: any, _rebuild: any) => ({});
const setGestureState = () => {};

const AnimatedView = React.forwardRef(function AnimatedView(props: any, ref: any) {
  return React.createElement(View, { ...props, ref });
});

const AnimatedText = React.forwardRef(function AnimatedText(props: any, ref: any) {
  return React.createElement(Text, { ...props, ref });
});

const Animated = {
  View: AnimatedView,
  Text: AnimatedText,
  createAnimatedComponent: (comp: any) => comp,
};

export {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
  useEvent,
  setGestureState,
};
export default Animated;
export type SharedValue<T> = { value: T };
