const { withPodfile } = require('@expo/config-plugins');

const DEFAULT_DEPLOYMENT_TARGET = '15.1';
const MARKER = '# with-pods-deployment-target';

// Xcode 27 refuses pod targets below iOS 15 (Stripe, SDWebImage, RNSVG bundles still declare 9.0-13.4).
const withPodsDeploymentTarget = (config, props = {}) => {
  const target = props.version ?? DEFAULT_DEPLOYMENT_TARGET;

  return withPodfile(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(MARKER)) {
      return config;
    }

    const snippet = [
      `    ${MARKER}`,
      '    installer.pods_project.targets.each do |t|',
      '      t.build_configurations.each do |bc|',
      `        if bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${target}`,
      `          bc.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${target}'`,
      '        end',
      '      end',
      '    end',
    ].join('\n');

    contents = contents.replace(/(react_native_post_install\([\s\S]*?\n\s*\)\n)/, `$1${snippet}\n`);
    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withPodsDeploymentTarget;
