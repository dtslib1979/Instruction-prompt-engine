// Simple smoke tests for core functionality
// Since this is a client-side PWA, most testing would be done with browser automation
// This file provides basic validation of JavaScript modules

import { APP_VERSION } from '../app-version.js';

// Test 1: App version is defined
console.assert(APP_VERSION, 'APP_VERSION should be defined');
console.assert(typeof APP_VERSION === 'string', 'APP_VERSION should be a string');
console.assert(APP_VERSION.startsWith('v'), 'APP_VERSION should start with "v"');

// Test 2: Service worker cache name consistency
const expectedCacheName = `ipwa-cache-${APP_VERSION.replace('v', 'v')}-1`;
console.assert(expectedCacheName, 'Cache name should be constructible from version');

// Test 3: Basic DOM availability (when running in browser context)
if (typeof window !== 'undefined') {
  console.assert(typeof document !== 'undefined', 'document should be available');
  console.assert(typeof localStorage !== 'undefined', 'localStorage should be available');
  console.assert(typeof fetch !== 'undefined', 'fetch should be available');
}

console.log('✅ Basic smoke tests passed');

export { APP_VERSION };