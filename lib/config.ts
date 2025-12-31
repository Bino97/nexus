/**
 * Validates and exports configuration settings
 * Ensures all required environment variables are set correctly
 */

export function validateConfig() {
  const errors: string[] = [];

  // Validate JWT Secret
  const jwtSecret = process.env.NEXUS_JWT_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    errors.push('NEXUS_JWT_SECRET or JWT_SECRET environment variable must be set');
  } else if (jwtSecret.length < 32) {
    errors.push('JWT secret must be at least 32 characters long for security');
  } else if (jwtSecret === 'nexus-dev-secret-change-in-production-32chars') {
    errors.push('JWT secret is using the default development value. Change it in production!');
  }

  // Validate Node Environment
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'production' && (!jwtSecret || jwtSecret.includes('dev') || jwtSecret.includes('default'))) {
    errors.push('Production environment detected but JWT secret appears to be a development value');
  }

  if (errors.length > 0) {
    console.error('\n❌ NEXUS Configuration Error:\n');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\nPlease check your .env file and set the required environment variables.\n');
    process.exit(1);
  }

  console.log('✅ NEXUS configuration validated successfully');
}

export const config = {
  jwtSecret: process.env.NEXUS_JWT_SECRET || process.env.JWT_SECRET || '',
  tokenExpiry: process.env.NEXUS_TOKEN_EXPIRY || '24h',
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3000',
  databasePath: process.env.DATABASE_PATH || './nexus.db',
};
