#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptPath = fileURLToPath(import.meta.url);
const mobileRoot = resolve(dirname(scriptPath), '..');
const repoRoot = resolve(mobileRoot, '..');
const siteConfigPath = resolve(repoRoot, 'site-config.ts');
const packagePath = resolve(mobileRoot, 'package.json');

const platforms = ['ios', 'android'];
const demoSeed = 'nowstack-store-demo-v1';
const shotDefinitions = [
  {
    slot: 1,
    slug: 'onboarding',
    route: 'onboarding',
    requiredVisibleText: ['Welcome to NowStack', 'Get started'],
  },
  {
    slot: 2,
    slug: 'auth',
    route: 'onboarding',
    query: { storeStep: 'sign-in' },
    requiredVisibleTextByPlatform: {
      ios: ['Sign in', 'Create an account to sync your notes', 'Continue with email'],
      android: ['Sign in', 'Create an account to sync your notes', 'Continue with email'],
    },
  },
  {
    slot: 3,
    slug: 'home',
    route: 'home',
    requiresAuth: true,
    requiredVisibleText: ['Home', 'Your app starts here'],
  },
  {
    slot: 4,
    slug: 'core-feature',
    route: 'tutorials/payments',
    requiresAuth: true,
    requiredVisibleText: ['How Payments Work', 'Store IAP flow'],
  },
  {
    slot: 5,
    slug: 'paywall',
    route: 'paywall',
    query: { preview: '1' },
    requiredVisibleTextByPlatform: {
      ios: ['Lifetime Access', 'Get Lifetime Access'],
      android: ['Lifetime Access', 'Get Lifetime Access'],
    },
  },
  {
    slot: 6,
    slug: 'settings',
    route: 'settings',
    requiresAuth: true,
    requiredVisibleText: ['Settings', 'Privacy'],
  },
];

const forbiddenText = [
  'localhost',
  'DEBUG',
  'lorem ipsum',
  'Bearer ',
  'sk_',
  'pk_test_',
  'pk_live_',
  'AIza',
];

const devices = {
  ios: {
    name: 'iPhone 15 Pro Max',
    family: 'iphone-6.7',
    osVersion: 'latest-supported',
    resolution: { width: 1290, height: 2796 },
  },
  android: {
    name: 'Android phone emulator',
    family: 'phone',
    osVersion: 'latest-supported',
    resolution: { width: 1080, height: 1920 },
  },
};

function help() {
  return `Store screenshot manifest and optional native capture helper.

Usage:
  node scripts/store-screenshots.mjs [options]

Options:
  --platform ios|android|all  Platforms to include. Default: all
  --locale en-US             Locale folder/manifest value. Default: en-US
  --date YYYY-MM-DD          Output date. Default: today's UTC date
  --output <path>            Output root. Default: ../documents/store-screenshots/<date> relative to mobile-app
  --execute                  Run Maestro and native screenshot commands. Default is dry-run
  --skip-maestro             Do not run Maestro flow command
  --ios-device <udid|booted> iOS simulator target for simctl. Default: booted
  --android-device <serial>  Android adb serial. Passes -s <serial> when provided
  --continue-on-maestro-failure
                             Continue native capture after Maestro failures. Native failures still fail
  --help                     Show this help

Safety:
  Dry-run is the default and still writes manifest.json. This script never uploads,
  never reads credentials, and writes screenshots only inside the selected output root.
  Authenticated routes expect the simulator to already be signed in with the
  App Review test account before --execute. The generated flows preserve state.
`;
}

function todayUtcDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseArgs(argv) {
  const options = {
    platform: 'all',
    locale: 'en-US',
    date: todayUtcDate(),
    output: null,
    execute: false,
    skipMaestro: false,
    iosDevice: 'booted',
    androidDevice: null,
    continueOnMaestroFailure: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const [flag, inlineValue] = arg.includes('=') ? arg.split(/=(.*)/s, 2) : [arg, null];
    const readValue = () => {
      if (inlineValue !== null) return inlineValue;
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        throw new Error(`${flag} requires a value`);
      }
      index += 1;
      return next;
    };

    if (flag === '--platform') options.platform = readValue();
    else if (flag === '--locale') options.locale = readValue();
    else if (flag === '--date') options.date = readValue();
    else if (flag === '--output') options.output = readValue();
    else if (flag === '--ios-device') options.iosDevice = readValue();
    else if (flag === '--android-device') options.androidDevice = readValue();
    else if (arg === '--execute') options.execute = true;
    else if (arg === '--skip-maestro') options.skipMaestro = true;
    else if (arg === '--continue-on-maestro-failure') options.continueOnMaestroFailure = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function validateOptions(options) {
  if (!['ios', 'android', 'all'].includes(options.platform)) {
    throw new Error('--platform must be ios, android, or all');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
    throw new Error('--date must be YYYY-MM-DD');
  }
  const parsedDate = new Date(`${options.date}T00:00:00.000Z`);
  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== options.date
  ) {
    throw new Error('--date must be a real UTC calendar date');
  }
  if (!/^[A-Za-z0-9_-]+(?:-[A-Za-z0-9_-]+)*$/.test(options.locale)) {
    throw new Error('--locale may only contain letters, numbers, underscores, and hyphens');
  }
  if (!options.iosDevice || /^\s/.test(options.iosDevice) || /\s$/.test(options.iosDevice)) {
    throw new Error(
      '--ios-device must be a non-empty UDID or booted value without surrounding whitespace'
    );
  }
  if (
    options.androidDevice !== null &&
    (!options.androidDevice || /\s/.test(options.androidDevice))
  ) {
    throw new Error('--android-device must be a non-empty adb serial without whitespace');
  }
}

function loadRegexValue(source, key, fallback) {
  const match = source.match(new RegExp(`${key}\\s*:\\s*[\"']([^\"']+)[\"']`));
  return match?.[1] ?? fallback;
}

function loadAppValues() {
  let configSource = '';
  try {
    configSource = readFileSync(siteConfigPath, 'utf8');
  } catch {
    configSource = '';
  }

  let packageJson = {};
  try {
    packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  } catch {
    packageJson = {};
  }

  return {
    title: loadRegexValue(configSource, 'title', 'NowStack'),
    scheme: loadRegexValue(configSource, 'slug', 'nowstack'),
    bundleId: loadRegexValue(configSource, 'bundleId', 'com.nowstack.mobile'),
    androidPackage: loadRegexValue(
      configSource,
      'androidPackage',
      loadRegexValue(configSource, 'bundleId', 'com.nowstack.mobile')
    ),
    version: packageJson.version ?? '0.0.0',
    buildNumber: 'pending',
    gitSha: gitSha(),
  };
}

function gitSha() {
  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status !== 0) return 'unknown';
  return result.stdout.trim() || 'unknown';
}

function selectedPlatforms(platform) {
  return platform === 'all' ? platforms : [platform];
}

function outputRootFor(options) {
  const output = options.output ?? join('..', 'documents', 'store-screenshots', options.date);
  return isAbsolute(output) ? resolve(output) : resolve(mobileRoot, output);
}

function assertInside(root, target) {
  const rel = relative(root, target);
  if (rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))) return;
  throw new Error(`Refusing to write outside output root: ${target}`);
}

function displayPath(target, base = repoRoot) {
  const rel = relative(base, target);
  const normalized = rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel : target;
  return normalized.split(sep).join('/');
}

function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function commandString(command, args) {
  return [command, ...args].map(shellQuote).join(' ');
}

function qaPending() {
  return {
    status: 'pending',
    checks: {
      correctScreen: 'pending',
      notBlank: 'pending',
      readableCopy: 'pending',
      safeAreasOk: 'pending',
      noKeyboardOverlay: 'pending',
      noPrivateData: 'pending',
      noSecrets: 'pending',
      noPlaceholders: 'pending',
      brandConsistent: 'pending',
      policySafe: 'pending',
    },
    aiReview: {
      model: null,
      reviewedAt: null,
      summary: null,
      issues: [],
      fixInstructions: [],
    },
    humanApproval: {
      approved: false,
      approvedBy: null,
      approvedAt: null,
    },
  };
}

function flowForPlatform(platform) {
  const real = resolve(mobileRoot, 'maestro', 'store', `${platform}-store-screenshots.yaml`);
  const example = resolve(
    mobileRoot,
    'maestro',
    'store',
    `${platform}-store-screenshots.example.yaml`
  );
  const selected = existsSync(real) ? real : example;
  return {
    path: selected,
    mobileRelative: displayPath(selected, mobileRoot),
    repoRelative: displayPath(selected, repoRoot),
    isExample: selected === example,
  };
}

function paddedSlot(shot) {
  return String(shot.slot).padStart(2, '0');
}

function perShotFlowName(platform, shot) {
  return `${platform}-${paddedSlot(shot)}-${shot.slug}.yaml`;
}

function perShotFlowCandidates(platform, shot) {
  const slot = paddedSlot(shot);
  const rawSlot = String(shot.slot);
  const storeRoot = resolve(mobileRoot, 'maestro', 'store');
  const candidates = [
    resolve(storeRoot, platform, `${slot}-${shot.slug}.yaml`),
    resolve(storeRoot, `${platform}-${slot}-${shot.slug}.yaml`),
  ];

  if (rawSlot !== slot) {
    candidates.push(resolve(storeRoot, platform, `${rawSlot}-${shot.slug}.yaml`));
    candidates.push(resolve(storeRoot, `${platform}-${rawSlot}-${shot.slug}.yaml`));
  }

  return candidates;
}

function flowRecord(path, options = {}) {
  return {
    path,
    mobileRelative: displayPath(path, mobileRoot),
    repoRelative: displayPath(path, repoRoot),
    isGenerated: options.isGenerated ?? false,
  };
}

function existingPerShotFlow(platform, shot) {
  const path = perShotFlowCandidates(platform, shot).find((candidate) => existsSync(candidate));
  return path ? flowRecord(path) : null;
}

function yamlString(value) {
  return JSON.stringify(value);
}

function deepLinkForShot({ scheme, locale, shot }) {
  const params = new URLSearchParams({
    storeDemo: '1',
    seed: demoSeed,
    locale,
    ...(shot.query ?? {}),
  });
  const route = shot.route ? `${shot.route}?` : '?';
  const separator = shot.slug === 'onboarding' ? ':///' : '://';
  return `${scheme}${separator}${route}${params.toString()}`;
}

function generatedFlowContent({ appId, scheme, locale, platform, shot, requiredVisibleText }) {
  const deepLink = deepLinkForShot({ scheme, locale, shot });
  const shouldNavigateInMaestro = platform !== 'android';
  const lines = [
    '# Generated by scripts/store-screenshots.mjs for one per-shot native capture.',
    '# Prefer a checked-in per-shot flow under maestro/store/ once testIDs are stable.',
    `appId: ${yamlString(appId)}`,
    `name: ${yamlString(`Store screenshot ${platform} ${paddedSlot(shot)} ${shot.slug}`)}`,
    '---',
    '- launchApp:',
    '    arguments:',
    '      STORE_SCREENSHOTS: "1"',
    `      STORE_DEMO_SEED: ${yamlString(demoSeed)}`,
    `      STORE_LOCALE: ${yamlString(locale)}`,
    `      STORE_PLATFORM: ${yamlString(platform)}`,
    '- extendedWaitUntil:',
    '    visible: "Home"',
    '    timeout: 45000',
  ];

  if (shouldNavigateInMaestro) {
    lines.push(`- openLink: ${yamlString(deepLink)}`);
    lines.push('- waitForAnimationToEnd');

    for (const text of requiredVisibleText ?? []) {
      lines.push('- extendedWaitUntil:');
      lines.push(`    visible: ${yamlString(text)}`);
      lines.push('    timeout: 20000');
    }
  }

  return `${lines.join('\n')}\n`;
}

function generatedPerShotFlow(outputRoot, platform, shot) {
  const path = resolve(outputRoot, '_maestro', perShotFlowName(platform, shot));
  assertInside(outputRoot, path);
  return flowRecord(path, { isGenerated: true });
}

function ensurePerShotFlow({ appId, entry, locale, outputRoot }) {
  const existing = existingPerShotFlow(entry.platform, entry._shot);
  if (existing) return existing;

  const generated = generatedPerShotFlow(outputRoot, entry.platform, entry._shot);
  mkdirSync(dirname(generated.path), { recursive: true });
  writeFileSync(
    generated.path,
    generatedFlowContent({
      appId,
      scheme: entry.app.deepLinkScheme,
      locale,
      platform: entry.platform,
      shot: entry._shot,
      requiredVisibleText: entry.requiredVisibleText,
    })
  );
  return generated;
}

function screenshotPath(outputRoot, platform, locale, shot) {
  const deviceFolder = platform === 'ios' ? 'iphone-67' : 'phone';
  const fileName = `${paddedSlot(shot)}-${shot.slug}.png`;
  const target = resolve(outputRoot, platform, deviceFolder, locale, fileName);
  assertInside(outputRoot, target);
  return target;
}

function capturePlan(platform, imagePath, mobileRelativeImagePath, options) {
  if (platform === 'ios') {
    return {
      command: 'xcrun',
      args: ['simctl', 'io', options.iosDevice, 'screenshot', imagePath],
      display: commandString('xcrun', [
        'simctl',
        'io',
        options.iosDevice,
        'screenshot',
        mobileRelativeImagePath,
      ]),
      stdoutToFile: false,
    };
  }

  const deviceArgs = options.androidDevice ? ['-s', options.androidDevice] : [];
  const args = [...deviceArgs, 'exec-out', 'screencap', '-p'];

  return {
    command: 'adb',
    args,
    display: `${commandString('adb', args)} > ${shellQuote(mobileRelativeImagePath)}`,
    stdoutToFile: true,
  };
}

function buildEntries(options, outputRoot) {
  const entries = [];
  const flows = Object.fromEntries(
    platforms.map((platform) => [platform, flowForPlatform(platform)])
  );
  const app = loadAppValues();

  for (const platform of selectedPlatforms(options.platform)) {
    for (const shot of shotDefinitions) {
      const imagePath = screenshotPath(outputRoot, platform, options.locale, shot);
      const mobileRelativeImagePath = relative(mobileRoot, imagePath).split(sep).join('/');
      const repoRelativeImagePath = displayPath(imagePath, repoRoot);
      const plan = capturePlan(platform, imagePath, mobileRelativeImagePath, options);
      const requiredVisibleText =
        shot.requiredVisibleTextByPlatform?.[platform] ?? shot.requiredVisibleText;

      entries.push({
        id: `${platform}-${devices[platform].family.replaceAll('.', '')}-${options.locale.toLowerCase()}-${paddedSlot(shot)}-${shot.slug}`,
        platform,
        app: {
          appId: platform === 'android' ? app.androidPackage : app.bundleId,
          deepLinkScheme: app.scheme,
        },
        device: devices[platform],
        locale: options.locale,
        route: shot.route,
        flow: flows[platform].repoRelative,
        captureCommand: plan.display,
        path: repoRelativeImagePath,
        rawPath: repoRelativeImagePath,
        framedPath: null,
        storeSlot: shot.slot,
        requiresAuth: Boolean(shot.requiresAuth),
        requiredVisibleText,
        forbiddenText,
        capture: {
          status: options.execute ? 'pending' : 'dry-run',
          executedAt: null,
          error: null,
        },
        qa: qaPending(),
        _imagePath: imagePath,
        _capturePlan: plan,
        _shot: shot,
      });
    }
  }

  return { entries, flows };
}

function cleanManifestEntry(entry) {
  const { _imagePath, _capturePlan, _shot, ...clean } = entry;
  return clean;
}

function writeManifest(manifestPath, manifest) {
  const clean = {
    ...manifest,
    screenshots: manifest.screenshots.map(cleanManifestEntry),
  };
  writeFileSync(manifestPath, `${JSON.stringify(clean, null, 2)}\n`);
}

function runProcess(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: options.cwd ?? mobileRoot,
    encoding: options.encoding ?? 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

function streamToText(stream) {
  if (typeof stream === 'string') return stream.trim();
  if (Buffer.isBuffer(stream)) return stream.toString('utf8').trim();
  return '';
}

function formatProcessError(result) {
  if (result.error) return result.error.message;
  const stderr = streamToText(result.stderr);
  const stdout = streamToText(result.stdout);
  return stderr || stdout || `process exited with status ${result.status}`;
}

function runMaestro(entry, flow, manifest) {
  const args = ['test', flow.mobileRelative];
  const command = commandString('maestro', args);
  console.log(`Executing Maestro (${entry.id}): ${command}`);
  const result = runProcess('maestro', args);
  const ok = result.status === 0 && !result.error;
  const record = {
    id: entry.id,
    platform: entry.platform,
    storeSlot: entry.storeSlot,
    route: entry.route,
    command,
    flow: flow.repoRelative,
    generatedFlow: flow.isGenerated,
    status: ok ? 'passed' : 'failed',
    error: ok ? null : formatProcessError(result),
  };
  manifest.execution.maestro.push(record);
  if (record.error) console.error(`Maestro failed for ${entry.id}: ${record.error}`);
  return record;
}

function runNativeCapture(entry) {
  mkdirSync(dirname(entry._imagePath), { recursive: true });
  const plan = entry._capturePlan;
  console.log(`Executing native capture: ${plan.display}`);

  if (plan.stdoutToFile) {
    const result = spawnSync(plan.command, plan.args, {
      cwd: mobileRoot,
      encoding: 'buffer',
      maxBuffer: 50 * 1024 * 1024,
    });
    if (result.status !== 0 || result.error || !result.stdout?.length) {
      return { ok: false, error: result.error?.message ?? formatProcessError(result) };
    }
    writeFileSync(entry._imagePath, result.stdout);
    return { ok: true, error: null };
  }

  const result = runProcess(plan.command, plan.args);
  if (result.status !== 0 || result.error) {
    return { ok: false, error: formatProcessError(result) };
  }
  return { ok: true, error: null };
}

function waitSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function runAndroidDeepLink(entry, options) {
  const deviceArgs = options.androidDevice ? ['-s', options.androidDevice] : [];
  const deepLink = deepLinkForShot({
    scheme: entry.app.deepLinkScheme,
    locale: entry.locale,
    shot: entry._shot,
  });
  const args = [
    ...deviceArgs,
    'shell',
    'am',
    'start',
    '-W',
    '-p',
    entry.app.appId,
    '-a',
    'android.intent.action.VIEW',
    '-d',
    deepLink,
  ];
  const command = commandString('adb', args);
  console.log(`Executing Android deep link: ${command}`);
  const result = runProcess('adb', args);
  if (result.status !== 0 || result.error) {
    return { ok: false, error: formatProcessError(result) };
  }
  waitSync(7000);
  return { ok: true, error: null };
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(help());
      return 0;
    }
    validateOptions(options);
  } catch (error) {
    console.error(`Error: ${error.message}\n`);
    console.error(help());
    return 2;
  }

  const outputRoot = outputRootFor(options);
  const manifestPath = resolve(outputRoot, 'manifest.json');
  assertInside(outputRoot, manifestPath);
  mkdirSync(outputRoot, { recursive: true });

  const app = loadAppValues();
  const { entries, flows } = buildEntries(options, outputRoot);
  for (const entry of entries) mkdirSync(dirname(entry._imagePath), { recursive: true });

  const manifest = {
    schemaVersion: '1.0',
    generatedAt: new Date().toISOString(),
    mode: options.execute ? 'execute' : 'dry-run',
    app: {
      name: app.title,
      deepLinkScheme: app.scheme,
      bundleId: app.bundleId,
      version: app.version,
      buildNumber: app.buildNumber,
      gitSha: app.gitSha,
    },
    demoMode: {
      enabled: true,
      seed: demoSeed,
      locale: options.locale,
      dataPolicy:
        'Seeded demo data only; no production users, tokens, emails, credentials, or private content.',
    },
    outputRoot: displayPath(outputRoot, repoRoot),
    manifestPath: displayPath(manifestPath, repoRoot),
    execution: {
      skipMaestro: options.skipMaestro,
      continueOnMaestroFailure: options.continueOnMaestroFailure,
      iosDevice: options.iosDevice,
      androidDevice: options.androidDevice,
      maestro: [],
      nativeCapture: [],
      notes: [
        'No upload is performed by this script.',
        'Default mode is dry-run; pass --execute to call per-shot Maestro flows and simctl/adb.',
      ],
    },
    screenshots: entries,
  };

  console.log(`${options.execute ? 'EXECUTE' : 'DRY RUN'}: store screenshot helper`);
  console.log(`App: ${app.title} (${app.bundleId})`);
  if (app.androidPackage !== app.bundleId) {
    console.log(`Android package: ${app.androidPackage}`);
  }
  console.log(`Output root: ${displayPath(outputRoot, repoRoot)}`);
  console.log(`Manifest: ${displayPath(manifestPath, repoRoot)}`);

  let maestroFailures = 0;
  let nativeFailures = 0;
  let generatedFlowWarnings = 0;
  for (const platform of selectedPlatforms(options.platform)) {
    if (!options.execute && !options.skipMaestro) {
      const flow = flows[platform];
      const maestroCommand = commandString('maestro', ['test', flow.mobileRelative]);
      console.log(`Example full-platform flow for humans (${platform}): ${maestroCommand}`);
      if (flow.isExample)
        console.log(`Using example Maestro flow for ${platform}: ${flow.mobileRelative}`);
    }

    if (options.skipMaestro) console.log(`Skipping Maestro for ${platform}`);

    for (const entry of entries.filter((candidate) => candidate.platform === platform)) {
      if (!options.execute) {
        console.log(`Would capture ${entry.id}: ${entry.captureCommand}`);
        continue;
      }

      let maestroRecord = null;
      if (!options.skipMaestro) {
        const appId = entry.platform === 'android' ? app.androidPackage : app.bundleId;
        const flow = ensurePerShotFlow({
          appId,
          entry,
          locale: options.locale,
          outputRoot,
        });
        entry.flow = flow.repoRelative;
        if (flow.isGenerated) {
          generatedFlowWarnings += 1;
          console.warn(
            `Generated per-shot Maestro flow for ${entry.id}: ${flow.repoRelative}. ` +
              `The app must support ${app.scheme}:// store-demo deep links and required visible text assertions.`
          );
        }
        maestroRecord = runMaestro(entry, flow, manifest);
        if (maestroRecord.status !== 'passed') {
          maestroFailures += 1;
          if (!options.continueOnMaestroFailure) {
            entry.capture.status = 'skipped';
            entry.capture.executedAt = new Date().toISOString();
            entry.capture.error =
              'Skipped because Maestro failed; pass --continue-on-maestro-failure to capture anyway.';
            manifest.execution.nativeCapture.push({
              id: entry.id,
              command: entry.captureCommand,
              status: entry.capture.status,
              path: entry.path,
              error: entry.capture.error,
              maestroStatus: maestroRecord.status,
            });
            continue;
          }
        }
      }

      if (entry.platform === 'android') {
        const result = runAndroidDeepLink(entry, options);
        if (!result.ok) {
          nativeFailures += 1;
          entry.capture.status = 'failed';
          entry.capture.executedAt = new Date().toISOString();
          entry.capture.error = `Android deep link failed before capture: ${result.error}`;
          manifest.execution.nativeCapture.push({
            id: entry.id,
            command: entry.captureCommand,
            status: entry.capture.status,
            path: entry.path,
            error: entry.capture.error,
            maestroStatus: maestroRecord?.status ?? (options.skipMaestro ? 'skipped' : null),
          });
          continue;
        }
      }

      const result = runNativeCapture(entry);
      entry.capture.status = result.ok ? 'captured' : 'failed';
      entry.capture.executedAt = new Date().toISOString();
      entry.capture.error = result.error;
      manifest.execution.nativeCapture.push({
        id: entry.id,
        command: entry.captureCommand,
        status: entry.capture.status,
        path: entry.path,
        error: entry.capture.error,
        maestroStatus: maestroRecord?.status ?? (options.skipMaestro ? 'skipped' : null),
      });
      if (!result.ok) {
        nativeFailures += 1;
        console.error(`Native capture failed for ${entry.id}: ${result.error}`);
      }
    }
  }

  if (generatedFlowWarnings > 0) {
    manifest.execution.notes.push(
      `${generatedFlowWarnings} generated per-shot Maestro flow(s) were used. The app must support ${app.scheme}://store/... deep links, storeDemo mode, seeded demo data, and stable visible text/testIDs.`
    );
  }

  writeManifest(manifestPath, manifest);
  console.log(
    `Wrote ${displayPath(manifestPath, repoRoot)} with ${entries.length} screenshot entries.`
  );

  const maestroFailuresForExit = options.continueOnMaestroFailure ? 0 : maestroFailures;
  if (maestroFailuresForExit > 0 || nativeFailures > 0) {
    if (maestroFailuresForExit > 0) {
      console.error(
        `${maestroFailuresForExit} Maestro command(s) failed; native capture was skipped for those shots.`
      );
    }
    if (nativeFailures > 0) {
      console.error(`${nativeFailures} native capture command(s) failed.`);
    }
    console.error('Manifest was still written for debugging/QA.');
    return 1;
  }

  return 0;
}

process.exitCode = main();
