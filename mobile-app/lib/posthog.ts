import PostHog from 'posthog-react-native';
import type { PostHogEventProperties } from '@posthog/core';
import Constants from 'expo-constants';
import { InteractionManager } from 'react-native';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isPostHogConfigured = !!apiKey && apiKey !== 'phc_your_project_token_here';

if (__DEV__) {
  console.log('PostHog config:', {
    apiKey: apiKey ? 'SET' : 'NOT SET',
    host: host ? 'SET' : 'NOT SET',
    isConfigured: isPostHogConfigured,
  });
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  host,
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  flushAt: 20,
  flushInterval: 10000,
  maxBatchSize: 100,
  maxQueueSize: 1000,
  preloadFeatureFlags: true,
  requestTimeout: 10000,
  fetchRetryCount: 3,
  fetchRetryDelay: 3000,
});

export function safeCapture(event: string, properties?: PostHogEventProperties) {
  InteractionManager.runAfterInteractions(() => {
    try {
      posthog.capture(event, properties);
    } catch {
      if (__DEV__) console.warn(`[PostHog] Failed to capture "${event}"`);
    }
  });
}
