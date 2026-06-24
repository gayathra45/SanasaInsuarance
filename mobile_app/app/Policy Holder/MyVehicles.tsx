import React from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import PolicyHolderNavbar from "../Components/policy holder/page";

export default function MyVehicles() {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      {/* Empty flex view to push the navbar to the bottom */}
      <View style={styles.content} />
      <PolicyHolderNavbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" },
  content: { flex: 1 },
});
