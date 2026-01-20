/**
 * Environment configuration utilities
 * Provides type-safe access to environment variables and dynamic URL generation
 */

/**
 * Get the base URL of the application based on the current environment
 * @returns The base URL (e.g., http://localhost:3000 or https://kpp-planos2.vercel.app)
 */
export function getBaseUrl(): string {
  // Client-side: use NEXT_PUBLIC_APP_URL if available
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  }

  // Server-side: Priority order
  // 1. Use NEXT_PUBLIC_APP_URL if explicitly set (production domain)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // 2. Vercel provides VERCEL_URL automatically (deployment-specific URL)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the LINE Login callback URL
 * @returns The full callback URL for LINE authentication
 */
export function getLineCallbackUrl(): string {
  // Use explicit LINE_CALLBACK_URL if set (for custom configurations)
  if (process.env.LINE_CALLBACK_URL) {
    return process.env.LINE_CALLBACK_URL;
  }

  // Otherwise, construct from base URL
  return `${getBaseUrl()}/api/auth/line`;
}

/**
 * Get the NextAuth URL
 * @returns The NextAuth base URL
 */
export function getNextAuthUrl(): string {
  return process.env.NEXTAUTH_URL || getBaseUrl();
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Environment variables with type safety
 */
export const env = {
  // Database
  databaseUrl: process.env.DATABASE_URL,
  directUrl: process.env.DIRECT_URL,

  // LINE Login
  lineChannelId: process.env.LINE_CHANNEL_ID,
  lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
  lineCallbackUrl: getLineCallbackUrl(),

  // NextAuth
  nextAuthSecret: process.env.NEXTAUTH_SECRET,
  nextAuthUrl: getNextAuthUrl(),

  // Supabase
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // App
  baseUrl: getBaseUrl(),
  nodeEnv: process.env.NODE_ENV,
  isProduction: isProduction(),
  isDevelopment: isDevelopment(),
} as const;
