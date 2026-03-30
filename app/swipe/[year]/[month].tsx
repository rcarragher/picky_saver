import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SwipeScreen() {
  const { year, month } = useLocalSearchParams<{
    year: string;
    month: string;
  }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Swipe — {month}/{year}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
});
