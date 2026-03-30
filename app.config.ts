import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Picky Saver",
  slug: "picky-saver",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  scheme: "picky-saver",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#FAFAF8",
  },
  ios: {
    supportsTablet: false,
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "Picky Saver needs access to your photos so you can organize them by swiping.",
      NSPhotoLibraryAddUsageDescription:
        "Picky Saver needs permission to save photos to albums.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#FAFAF8",
    },
    permissions: [
      "android.permission.READ_MEDIA_IMAGES",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
    ],
    edgeToEdgeEnabled: true,
  },
  plugins: ["expo-router"],
});
