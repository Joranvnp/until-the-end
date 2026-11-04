const { withXcodeProject } = require('@expo/config-plugins');

// The Expo template runs the bundle script via an unquoted `...` substitution,
// which breaks when the project path contains spaces ("1 - En cours").
const UNQUOTED_START = '`\\"$NODE_BINARY\\" --print';
const QUOTED_START = '\\"$(\\"$NODE_BINARY\\" --print';
const UNQUOTED_END = '/scripts/react-native-xcode.sh\'\\"`';
const QUOTED_END = '/scripts/react-native-xcode.sh\'\\")\\"';

const withQuotedBundlePhase = (config) =>
  withXcodeProject(config, (config) => {
    const phases = config.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};

    for (const phase of Object.values(phases)) {
      if (typeof phase !== 'object' || typeof phase.shellScript !== 'string') continue;
      if (!phase.shellScript.includes(UNQUOTED_START)) continue;
      phase.shellScript = phase.shellScript
        .replace(UNQUOTED_START, QUOTED_START)
        .replace(UNQUOTED_END, QUOTED_END);
    }

    return config;
  });

module.exports = withQuotedBundlePhase;
