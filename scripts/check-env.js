#!/usr/bin/env node

/**
 * Environment Variables Check
 * Verifies that .env.local is loaded and configured correctly
 */

console.log('🔍 Checking environment configuration...\n');

const required = {
  'MONGODB_URI': 'MongoDB connection string',
  'MONGODB_DB_NAME': 'MongoDB database name',
  'REDIS_URL': 'Redis connection URL',
  'JWT_SECRET': 'JWT signing secret'
};

let allPresent = true;

for (const [key, description] of Object.entries(required)) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${description}`);
    console.log(`   → ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}\n`);
  } else {
    console.log(`❌ ${key}: MISSING`);
    console.log(`   → ${description}\n`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('✨ All environment variables are configured!\n');
  console.log('Expected values for local development:');
  console.log('  MONGODB_URI should contain: localhost:27017');
  console.log('  REDIS_URL should contain: localhost:6379');
  console.log('\nIf these don\'t match, make sure Docker is running:');
  console.log('  docker-compose up -d\n');
} else {
  console.log('⚠️  Some environment variables are missing.');
  console.log('\nMake sure .env.local exists in the project root.');
  console.log('It should be already committed to the repository.\n');
  process.exit(1);
}
