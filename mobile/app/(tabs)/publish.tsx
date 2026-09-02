// This tab is never actually navigated to: `href: null` on its Tabs.Screen
// (see (tabs)/_layout.tsx) removes it as a real route, and the tabPress
// listener intercepts the tap to open the "/publish" modal instead. An
// earlier version rendered <Redirect href="/publish" /> here, which caused
// an infinite navigation loop (this tab regains focus after the modal
// closes, redirecting again, refocusing, ...). Keep this a plain no-op.
export default function PublishTab() {
  return null;
}
