const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (
        context.originModulePath?.includes('HMRClient.js') &&
        (moduleName === '../NativeModules/specs/NativeRedBox' ||
          moduleName.includes('NativeRedBox'))
      ) {
        const rnPath = path.dirname(
          path.dirname(
            path.dirname(context.originModulePath),
          ),
        );
        const resolved = path.join(
          rnPath,
          'Libraries',
          'NativeModules',
          'specs',
          'NativeRedBox.js',
        );
        return { type: 'sourceFile', filePath: resolved };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
