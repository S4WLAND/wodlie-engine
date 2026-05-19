import { env } from './env'

export const securityConfig = {
  jwt: {
    secret: env.JWT_SECRET,
    accessTokenTtlMinutes: env.AUTH_ACCESS_TOKEN_TTL_MINUTES,
  },
  cors: {
    origins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
  },
  appUrls: {
    backend: env.BACKEND_PUBLIC_URL,
    frontendPublic: env.FRONTEND_PUBLIC_URL,
    frontendAdmin: env.FRONTEND_ADMIN_URL,
  },
  auth: {
    cookie: {
      accessTokenName: env.AUTH_COOKIE_ACCESS_NAME,
      refreshTokenName: env.AUTH_COOKIE_REFRESH_NAME,
      csrfTokenName: env.AUTH_COOKIE_CSRF_NAME,
      oauthStateName: env.AUTH_COOKIE_OAUTH_STATE_NAME,
      oauthVerifierName: env.AUTH_COOKIE_OAUTH_VERIFIER_NAME,
      oauthContextName: env.AUTH_COOKIE_OAUTH_CONTEXT_NAME,
      domain: env.AUTH_COOKIE_DOMAIN,
      secure: env.AUTH_COOKIE_SECURE || env.NODE_ENV === 'production',
      sameSite: env.AUTH_COOKIE_SAME_SITE,
      accessPath: '/',
      refreshPath: '/api/v1/auth',
      csrfPath: '/api/v1/auth',
    },
    features: {
      emailVerificationEnabled: env.AUTH_EMAIL_VERIFICATION_ENABLED,
      passwordResetEnabled: env.AUTH_PASSWORD_RESET_ENABLED,
      googleOAuthEnabled: env.AUTH_OAUTH_GOOGLE_ENABLED,
      microsoftOAuthEnabled: env.AUTH_OAUTH_MICROSOFT_ENABLED,
    },
    invitationTtlMs: env.AUTH_INVITATION_TTL_HOURS * 60 * 60 * 1000,
    refreshTokenTtlMs: env.AUTH_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    emailVerificationTtlMs: env.AUTH_EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000,
    passwordResetTtlMs: env.AUTH_PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
    reauthTtlMs: env.AUTH_REAUTH_TTL_MINUTES * 60 * 1000,
    mail: {
      transport: env.AUTH_MAIL_TRANSPORT,
      from: env.AUTH_MAIL_FROM,
      smtp: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        password: env.SMTP_PASSWORD,
      },
    },
    oauth: {
      google: {
        clientId: env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
        redirectUri: env.GOOGLE_OAUTH_REDIRECT_URI,
      },
      microsoft: {
        clientId: env.MICROSOFT_OAUTH_CLIENT_ID,
        clientSecret: env.MICROSOFT_OAUTH_CLIENT_SECRET,
        tenantId: env.MICROSOFT_OAUTH_TENANT_ID ?? 'common',
        redirectUri: env.MICROSOFT_OAUTH_REDIRECT_URI,
      },
    },
  },
  swagger: {
    enabled: env.SWAGGER_ENABLED,
    routePrefix: '/docs',
  },
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },
}
