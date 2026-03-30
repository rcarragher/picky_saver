import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { colors } from "../constants/theme";

export default function RootLayout() {
  const scheme = useColorScheme();
  const themeColors = scheme === "dark" ? colors.dark : colors.light;

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: themeColors.background },
          animation: "slide_from_right",
          animationDuration: 250,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="date-picker" />
        <Stack.Screen name="swipe/[year]/[month]" />
        <Stack.Screen
          name="summary"
          options={{
            // Prevent swiping back to the swipe screen
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="to-delete" />
      </Stack>
    </>
  );
}
