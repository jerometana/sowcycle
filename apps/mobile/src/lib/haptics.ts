import * as Haptics from "expo-haptics";

// Feedback is best-effort: a device without haptics must never turn a successful action into a reported failure.
const fire = (feedback: Promise<void>) => {
  feedback.catch(() => {});
};

// One name per kind of moment, so screens pick feedback by intent rather than by API.
export const haptic = {
  tap: () => fire(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => fire(Haptics.selectionAsync()),
  success: () => fire(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => fire(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => fire(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
