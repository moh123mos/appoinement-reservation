export type AppLocale = "ar" | "en";
export type AppEnvironment = "development" | "staging" | "production";

type NumericEnvOptions = {
  min?: number;
  max?: number;
  fallback: number;
};

function parseAppEnvironment(value: string | undefined): AppEnvironment {
  if (value === "staging") {
    return "staging";
  }

  if (value === "production") {
    return "production";
  }

  return "development";
}

function parseLocale(value: string | undefined): AppLocale {
  return value === "en" ? "en" : "ar";
}

function parseNumericEnv(value: string | undefined, options: NumericEnvOptions): number {
  if (!value) {
    return options.fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return options.fallback;
  }

  if (options.min !== undefined && parsed < options.min) {
    return options.fallback;
  }

  if (options.max !== undefined && parsed > options.max) {
    return options.fallback;
  }

  return parsed;
}

const appEnvironment = parseAppEnvironment(process.env.NEXT_PUBLIC_APP_ENV ?? process.env.NODE_ENV);
const defaultLocale = parseLocale(process.env.NEXT_PUBLIC_DEFAULT_LOCALE);

export const appConfig = {
  environment: appEnvironment,
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
  siteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL ?? "",
  clinicDefaults: {
    tenantSlug: process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "demo-clinic",
    tenantName: process.env.NEXT_PUBLIC_DEFAULT_TENANT_NAME ?? "Demo Clinic",
    clinicName: process.env.NEXT_PUBLIC_DEFAULT_CLINIC_NAME ?? "Main Branch",
    doctorName: process.env.NEXT_PUBLIC_DEFAULT_DOCTOR_NAME ?? "Dr. Ahmed Khaled",
    timezone: process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE ?? "Africa/Cairo",
    locale: defaultLocale,
    slotMinutes: parseNumericEnv(process.env.NEXT_PUBLIC_SLOT_MINUTES, {
      min: 5,
      max: 120,
      fallback: 15,
    }),
    openingHour: parseNumericEnv(process.env.NEXT_PUBLIC_OPENING_HOUR, {
      min: 0,
      max: 23,
      fallback: 10,
    }),
    closingHour: parseNumericEnv(process.env.NEXT_PUBLIC_CLOSING_HOUR, {
      min: 1,
      max: 24,
      fallback: 16,
    }),
  },
} as const;

export function isConvexConfigured() {
  return Boolean(appConfig.convexUrl);
}
