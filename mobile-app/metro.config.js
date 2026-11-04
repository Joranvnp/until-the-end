const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.watchFolders = [path.resolve(__dirname, '..'), path.resolve(__dirname, '../convex')];

config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// Expo Go cannot load expo-iap's native StoreKit/Play Billing module. The dedicated
// `npm run expo-go` launcher enables this preview-only resolver so the rest of the
// boilerplate remains scannable without weakening production or development builds.
if (process.env.NOWSTACK_EXPO_GO === '1') {
  const defaultResolveRequest = nativeWindConfig.resolver.resolveRequest;
  nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'expo-iap') {
      return {
        filePath: path.resolve(__dirname, 'shims/expo-iap.js'),
        type: 'sourceFile',
      };
    }

    return defaultResolveRequest
      ? defaultResolveRequest(context, moduleName, platform)
      : context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = nativeWindConfig;
