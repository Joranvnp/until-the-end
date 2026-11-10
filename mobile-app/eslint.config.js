const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Generated/native output: `expo prebuild` and `npm run ios` create these,
    // and linting them makes `npm run lint` fail after any native build.
    ignores: ['dist/*', 'web-app/dist/*', '.expo/**', 'ios/**', 'android/**', 'game/engine.js'],
  },
  {
    rules: {
      'react/display-name': 'off',
    },
  },
]);
