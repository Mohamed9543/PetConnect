const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// react-native-maps has no web implementation; stub it out so the web bundle
// doesn't fail trying to resolve its native-only codegen files.
const { resolveRequest } = config.resolver;
config.resolver.resolveRequest = (context, moduleName, platform, ...rest) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "empty" };
  }
  return resolveRequest
    ? resolveRequest(context, moduleName, platform, ...rest)
    : context.resolveRequest(context, moduleName, platform, ...rest);
};

module.exports = withNativeWind(config, { input: "./global.css" });
