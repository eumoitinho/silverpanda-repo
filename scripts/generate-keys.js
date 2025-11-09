#!/usr/bin/env node

/**
 * Script to generate secure keys for Strapi CMS
 * Run with: node scripts/generate-keys.js
 */

const crypto = require('crypto');

function generateKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

function generateHexKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('=== Strapi Security Keys ===\n');
console.log('APP_KEYS (use 4 different keys):');
for (let i = 0; i < 4; i++) {
  console.log(`  ${generateKey(32)}`);
}

console.log('\nAPI_TOKEN_SALT:');
console.log(`  ${generateKey(32)}`);

console.log('\nADMIN_JWT_SECRET:');
console.log(`  ${generateKey(32)}`);

console.log('\nJWT_SECRET:');
console.log(`  ${generateKey(32)}`);

console.log('\nTRANSFER_TOKEN_SALT:');
console.log(`  ${generateKey(32)}`);

console.log('\n=== Alternative: Single 32-byte key ===');
console.log(generateKey(32));

console.log('\n=== Hex format (64 characters) ===');
console.log(generateHexKey(32));

