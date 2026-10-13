const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");

// iOS 27 traps at launch unless the app adopts the UIScene life cycle. Expo ships
// ExpoAppSceneDelegate for this, but the SDK 57 template still starts React Native
// from the app delegate, so this plugin switches the generated project over.

const WINDOW_SETUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

const replaceOnce = (source, from, to) => {
  if (!source.includes(from)) {
    throw new Error(`withSceneLifecycle: expected to find ${JSON.stringify(from)} in AppDelegate.swift; the Expo template changed.`);
  }
  return source.replace(from, to);
};

const withSceneAppDelegate = (config) =>
  withAppDelegate(config, (config) => {
    let source = config.modResults.contents;
    if (source.includes("ExpoAppSceneDelegate")) return config;
    source = replaceOnce(source, "class AppDelegate: ExpoAppDelegate {", "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {");
    source = replaceOnce(source, WINDOW_SETUP, "");
    source += "\nclass SceneDelegate: ExpoAppSceneDelegate {}\n";
    config.modResults.contents = source;
    return config;
  });

const withSceneManifest = (config) =>
  withInfoPlist(config, (config) => {
    config.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: "Default Configuration",
            UISceneDelegateClassName: "$(PRODUCT_MODULE_NAME).SceneDelegate",
          },
        ],
      },
    };
    return config;
  });

module.exports = (config) => withSceneManifest(withSceneAppDelegate(config));
