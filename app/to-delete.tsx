import { View, Text, StyleSheet } from "react-native";

export default function ToDeleteScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>To Be Deleted</Text>
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
