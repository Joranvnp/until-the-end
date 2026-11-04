const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STOREKIT_FILENAME = 'App.storekit';

const withStoreKitConfig = (config) => {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const storeKitFile = path.join(projectRoot, STOREKIT_FILENAME);

      if (!fs.existsSync(storeKitFile)) {
        console.warn(
          `[with-storekit-config] ${STOREKIT_FILENAME} not found at project root, skipping`
        );
        return config;
      }

      const projectName = config.modRequest.projectName;
      const schemePath = path.join(
        config.modRequest.platformProjectRoot,
        `${projectName}.xcodeproj`,
        'xcshareddata',
        'xcschemes',
        `${projectName}.xcscheme`
      );

      if (!fs.existsSync(schemePath)) {
        console.warn(`[with-storekit-config] Scheme not found at ${schemePath}`);
        return config;
      }

      let scheme = fs.readFileSync(schemePath, 'utf8');

      if (scheme.includes('StoreKitConfigurationFileReference')) {
        return config;
      }

      const storeKitEntry = `      <StoreKitConfigurationFileReference
         identifier = "../../${STOREKIT_FILENAME}">
      </StoreKitConfigurationFileReference>`;

      scheme = scheme.replace(/(\s*)<\/LaunchAction>/, `\n${storeKitEntry}$1</LaunchAction>`);

      fs.writeFileSync(schemePath, scheme);

      console.log(`[with-storekit-config] Added StoreKit reference to ${projectName}.xcscheme`);
      return config;
    },
  ]);
};

module.exports = withStoreKitConfig;
