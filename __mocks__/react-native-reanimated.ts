import React from 'react';
import { View } from 'react-native';

const useSharedValue = (init: any) => ({ value: init });
const useAnimatedStyle = (fn: () => any) => fn();
const useReducedMotion = () => false;
const withSpring = (val: any) => val;
const withTiming = (val: any, _config?: any, callback?: any) => {
  if (callback) callback(true);
  return val;
};
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

const AnimatedView = React.forwardRef((props: any, ref: any) =>
  React.createElement(View, { ...props, ref }),
);

const Animated = {
  View: AnimatedView,
  createAnimatedComponent: (comp: any) => comp,
};

export {
  useSharedValue,
  useAnimatedStyle,
  useReducedMotion,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
  useEvent,
  setGestureState,
};
export default Animated;
export type SharedValue<T> = { value: T };
