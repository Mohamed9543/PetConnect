import { Platform } from "react-native";

const FETCH_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// React Native's FormData needs the { uri, name, type } pseudo-file shape to
// upload local files — but that shape is meaningless to a real browser
// FormData (web), which needs an actual Blob. Without this split, image
// uploads silently arrive as zero files on web: no error, just an empty
// `images` array server-side, and photos that never show up anywhere.
//
// On web, converting the picked image's uri to a Blob can hang forever if
// it's a stale/invalid blob: URL — that previously froze the whole submit
// button indefinitely with zero network activity. This always resolves
// within FETCH_TIMEOUT_MS: returns true on success, false (never throws)
// if the photo couldn't be attached, so one bad photo never blocks the
// rest of the submission.
export async function attachImage(form: FormData, fieldName: string, uri: string, filename: string): Promise<boolean> {
  if (Platform.OS === "web") {
    try {
      const response = await withTimeout(fetch(uri), FETCH_TIMEOUT_MS, "Image fetch");
      const blob = await withTimeout(response.blob(), FETCH_TIMEOUT_MS, "Image blob conversion");
      form.append(fieldName, blob, filename);
      return true;
    } catch (error) {
      console.warn(`attachImage: failed to attach "${filename}":`, (error as Error).message);
      return false;
    }
  }

  form.append(fieldName, { uri, name: filename, type: "image/jpeg" } as any);
  return true;
}
