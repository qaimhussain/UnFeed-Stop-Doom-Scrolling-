const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to add AndroidLiquidGlass (io.github.kyant0:backdrop)
 * as a Gradle dependency from Maven Central.
 *
 * Coordinates: io.github.kyant0:backdrop:2.0.1
 * Minimum SDK: 21
 * License: Apache-2.0 (Kyant0)
 */
const withAndroidBackdrop = (config) => {
  return withAppBuildGradle(config, (modConfig) => {
    const buildGradle = modConfig.modResults.contents;
    const dependency = '    implementation("io.github.kyant0:backdrop:2.0.1")';

    if (!buildGradle.includes('io.github.kyant0:backdrop')) {
      // Find dependencies block and inject
      if (buildGradle.includes('dependencies {')) {
        modConfig.modResults.contents = buildGradle.replace(
          'dependencies {',
          `dependencies {\n${dependency}`
        );
      } else {
        modConfig.modResults.contents += `\ndependencies {\n${dependency}\n}\n`;
      }
    }
    return modConfig;
  });
};

module.exports = withAndroidBackdrop;
