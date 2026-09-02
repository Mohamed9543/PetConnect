import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

export default function Index() {
  const user = useAuthStore((state) => state.user);
  return <Redirect href={user ? "/(tabs)" : "/onboarding"} />;
}
