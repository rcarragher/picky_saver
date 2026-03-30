import { View, Text, StyleSheet } from "react-native";

export default function SummaryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>All done!</Text>
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
