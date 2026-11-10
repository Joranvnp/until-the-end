const { withProjectBuildGradle } = require('@expo/config-plugins');

const DEFAULT_NDK_VERSION = '28.0.13004108';

const withAndroidNdkVersion = (config, props = {}) => {
  const ndkVersion = props.version ?? DEFAULT_NDK_VERSION;

  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      return config;
    }

    const ndkLine = `ext.ndkVersion = "${ndkVersion}"`;
    const ndkComment =
      '// Google Play requires 16 KB native page-size alignment; NDK r28 builds with it by default.';
    const ndkBlock = `${ndkComment}\n${ndkLine}`;
    let contents = config.modResults.contents;

    if (/ext\.ndkVersion\s*=\s*["'][^"']+["']/.test(contents)) {
      contents = contents.replace(/ext\.ndkVersion\s*=\s*["'][^"']+["']/, ndkLine);
    } else if (contents.includes('apply plugin: "expo-root-project"')) {
      contents = contents.replace(
        'apply plugin: "expo-root-project"',
        `${ndkBlock}\n\napply plugin: "expo-root-project"`
      );
    } else {
      contents = `${ndkBlock}\n\n${contents}`;
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withAndroidNdkVersion;
