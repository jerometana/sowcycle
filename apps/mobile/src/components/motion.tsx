import { useEffect, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  useAnimatedValue,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// Enter timing mirrors the web's page template (src/app/(main)/template.tsx).
export const motion = {
  press: 0.97,
  duration: 300,
  easing: Easing.out(Easing.cubic),
  offset: 10,
  stagger: 40,
  maxStagger: 8,
} as const;

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
};

export function PressableScale({ style, onPressIn, onPressOut, ...props }: PressableScaleProps) {
  const scale = useAnimatedValue(1);
  const [pressed, setPressed] = useState(false);
  const springTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, speed: 40, bounciness: toValue === 1 ? 6 : 0 }).start();

  return (
    <AnimatedPressable
      {...props}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        springTo(motion.press);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        springTo(1);
        onPressOut?.(e);
      }}
      style={[typeof style === "function" ? style({ pressed }) : style, { transform: [{ scale }] }]}
    />
  );
}

// Items past maxStagger render static, so a long list scrolled into view never waits on a delay.
export function FadeIn(props: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const index = props.index ?? 0;
  const reduced = useReducedMotion();
  const progress = useAnimatedValue(index < motion.maxStagger ? 0 : 1);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration,
      delay: index * motion.stagger,
      easing: motion.easing,
      useNativeDriver: true,
    }).start();
  }, [progress, index]);

  if (reduced) return <Animated.View style={props.style}>{props.children}</Animated.View>;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [motion.offset, 0] });
  return <Animated.View style={[props.style, { opacity: progress, transform: [{ translateY }] }]}>{props.children}</Animated.View>;
}
