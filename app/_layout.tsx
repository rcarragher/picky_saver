import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="date-picker" />
      <Stack.Screen name="swipe/[year]/[month]" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="to-delete" />
    </Stack>
  );
}
