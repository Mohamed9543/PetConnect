import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { api } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Registers this device for Expo push notifications and syncs the token to
// the backend (stored on User.pushToken, used by notifyUser()). Silently
// no-ops on simulators/emulators or when permission is denied — push is a
// nice-to-have, never something that should block or alert on failure here.
export async function registerPushToken() {
  try {
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const { data: pushToken } = await Notifications.getExpoPushTokenAsync();

    const form = new FormData();
    form.append("pushToken", pushToken);
    await api.put("/users/profile", form, { headers: { "Content-Type": "multipart/form-data" } });
  } catch {
    // Push registration is best-effort — the app works fine without it.
  }
}
