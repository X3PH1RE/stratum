const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Release builds on EAS can fail when Gradle evaluates a custom hermesCommand
 * that resolves to null. Let React Native use its default Hermes toolchain.
 *
 * @see https://github.com/expo/expo/issues/44514
 */
function withFixHermesBuildGradle(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language === 'groovy') {
      modConfig.modResults.contents = modConfig.modResults.contents.replace(
        /^\s*hermesCommand\s*=.*\n/m,
        '',
      );
    }
    return modConfig;
  });
}

module.exports = withFixHermesBuildGradle;
