import { Component, type ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Screens crashing during render (e.g. a missing native module) otherwise
// leave the app on a permanent blank white screen in production builds,
// since Hermes/React don't show a red-box error there like they do in dev.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: "#fff", paddingTop: 60 }}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
            Une erreur est survenue
          </Text>
          <Text style={{ fontSize: 14, color: "#444", marginBottom: 20 }}>
            {error.message}
          </Text>
          <Pressable
            onPress={() => this.setState({ error: null })}
            style={{ backgroundColor: "#22c55e", padding: 14, borderRadius: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>Réessayer</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}
