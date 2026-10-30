import type { CalculatedZoneTime, TimeFormat, TimezoneItem } from './types';

export const DEFAULT_TIMEZONES: TimezoneItem[] = [
  {
    id: 'asia-kolkata-bangalore',
    city: 'Bangalore',
    country: 'India',
    iana: 'Asia/Kolkata',
    label: 'Bangalore (IST)',
    aliases: ['IST', 'India', 'India Standard Time', 'Bengaluru'],
  },
  {
    id: 'america-los-angeles-san-francisco',
    city: 'San Francisco',
    country: 'United States',
    iana: 'America/Los_Angeles',
    label: 'San Francisco (PT)',
    aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time', 'West Coast', 'SF', 'Bay Area'],
  },
  {
    id: 'asia-tokyo-tokyo',
    city: 'Tokyo',
    country: 'Japan',
    iana: 'Asia/Tokyo',
    label: 'Tokyo (JST)',
    aliases: ['JST', 'Japan', 'Japan Standard Time'],
  },
  {
    id: 'america-bogota-colombia',
    city: 'Colombia (Bogotá)',
    country: 'Colombia',
    iana: 'America/Bogota',
    label: 'Colombia (COT)',
    aliases: ['COT', 'Colombia', 'Bogota', 'Medellin'],
  },
  {
    id: 'america-edmonton-edmonton',
    city: 'Edmonton',
    country: 'Canada',
    iana: 'America/Edmonton',
    label: 'Edmonton (MT)',
    aliases: ['MST', 'MDT', 'MT', 'Mountain', 'Mountain Time', 'Alberta', 'Calgary'],
  },
  {
    id: 'etc-utc',
    city: 'UTC',
    country: 'Coordinated Universal Time',
    iana: 'UTC',
    label: 'UTC (Universal)',
    aliases: ['GMT', 'Zulu', 'Z', 'Universal Time'],
  },
];

export const TIMEZONE_CONVENTIONS: Omit<TimezoneItem, 'id'>[] = [
  {
    city: 'Pacific Time (PT)',
    country: 'US & Canada (PST/PDT)',
    iana: 'America/Los_Angeles',
    aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time', 'Pacific Standard Time', 'Pacific Daylight Time'],
  },
  {
    city: 'Eastern Time (ET)',
    country: 'US & Canada (EST/EDT)',
    iana: 'America/New_York',
    aliases: ['EST', 'EDT', 'ET', 'Eastern', 'Eastern Time', 'Eastern Standard Time', 'Eastern Daylight Time'],
  },
  {
    city: 'Central Time (CT)',
    country: 'US & Canada (CST/CDT)',
    iana: 'America/Chicago',
    aliases: ['CST', 'CDT', 'CT', 'Central', 'Central Time', 'Central Standard Time', 'Central Daylight Time'],
  },
  {
    city: 'Mountain Time (MT)',
    country: 'US & Canada (MST/MDT)',
    iana: 'America/Denver',
    aliases: ['MST', 'MDT', 'MT', 'Mountain', 'Mountain Time', 'Mountain Standard Time', 'Mountain Daylight Time'],
  },
  {
    city: 'Alaska Time (AKT)',
    country: 'United States (AKST/AKDT)',
    iana: 'America/Anchorage',
    aliases: ['AKST', 'AKDT', 'AKT', 'Alaska', 'Alaska Time'],
  },
  {
    city: 'Hawaii Time (HST)',
    country: 'United States (HST)',
    iana: 'Pacific/Honolulu',
    aliases: ['HST', 'HDT', 'Hawaii', 'Hawaii Time', 'Honolulu'],
  },
  {
    city: 'Greenwich Mean Time (GMT / BST)',
    country: 'United Kingdom (London)',
    iana: 'Europe/London',
    aliases: ['GMT', 'BST', 'Greenwich', 'British Summer Time', 'UK', 'London'],
  },
  {
    city: 'Central European Time (CET / CEST)',
    country: 'Central Europe (Paris, Berlin, Rome)',
    iana: 'Europe/Paris',
    aliases: ['CET', 'CEST', 'Central European', 'Central European Time', 'Europe'],
  },
  {
    city: 'Eastern European Time (EET / EEST)',
    country: 'Eastern Europe (Athens, Helsinki)',
    iana: 'Europe/Athens',
    aliases: ['EET', 'EEST', 'Eastern European', 'Eastern European Time'],
  },
  {
    city: 'India Standard Time (IST)',
    country: 'India (IST)',
    iana: 'Asia/Kolkata',
    aliases: ['IST', 'India', 'India Standard Time'],
  },
  {
    city: 'Japan Standard Time (JST)',
    country: 'Japan (JST)',
    iana: 'Asia/Tokyo',
    aliases: ['JST', 'Japan', 'Japan Standard Time'],
  },
  {
    city: 'Korea Standard Time (KST)',
    country: 'South Korea (KST)',
    iana: 'Asia/Seoul',
    aliases: ['KST', 'Korea', 'Korea Standard Time', 'Seoul'],
  },
  {
    city: 'China Standard Time (CST)',
    country: 'China (Beijing, Shanghai)',
    iana: 'Asia/Shanghai',
    aliases: ['CST', 'China', 'China Standard Time', 'Beijing', 'Shanghai'],
  },
  {
    city: 'Singapore Time (SGT)',
    country: 'Singapore (SGT)',
    iana: 'Asia/Singapore',
    aliases: ['SGT', 'Singapore', 'Singapore Time'],
  },
  {
    city: 'Hong Kong Time (HKT)',
    country: 'Hong Kong (HKT)',
    iana: 'Asia/Hong_Kong',
    aliases: ['HKT', 'Hong Kong', 'Hong Kong Time'],
  },
  {
    city: 'Australian Eastern Time (AEST / AEDT)',
    country: 'Australia (Sydney, Melbourne)',
    iana: 'Australia/Sydney',
    aliases: ['AEST', 'AEDT', 'Sydney', 'Melbourne', 'Australian Eastern Time'],
  },
  {
    city: 'Australian Central Time (ACST / ACDT)',
    country: 'Australia (Adelaide, Darwin)',
    iana: 'Australia/Adelaide',
    aliases: ['ACST', 'ACDT', 'Adelaide', 'Darwin', 'Australian Central Time'],
  },
  {
    city: 'Australian Western Time (AWST)',
    country: 'Australia (Perth)',
    iana: 'Australia/Perth',
    aliases: ['AWST', 'Perth', 'Australian Western Time'],
  },
  {
    city: 'New Zealand Time (NZST / NZDT)',
    country: 'New Zealand (Auckland, Wellington)',
    iana: 'Pacific/Auckland',
    aliases: ['NZST', 'NZDT', 'New Zealand', 'Auckland', 'Wellington'],
  },
  {
    city: 'Gulf Standard Time (GST)',
    country: 'United Arab Emirates (Dubai, Abu Dhabi)',
    iana: 'Asia/Dubai',
    aliases: ['GST', 'Gulf', 'Dubai', 'Abu Dhabi'],
  },
];

export const POPULAR_CITIES: Omit<TimezoneItem, 'id'>[] = [
  { city: 'Bangalore', country: 'India', iana: 'Asia/Kolkata', aliases: ['IST', 'India', 'Bengaluru'] },
  { city: 'Mumbai', country: 'India', iana: 'Asia/Kolkata', aliases: ['IST', 'India', 'Bombay'] },
  { city: 'New Delhi', country: 'India', iana: 'Asia/Kolkata', aliases: ['IST', 'India', 'Delhi'] },
  { city: 'San Francisco', country: 'United States', iana: 'America/Los_Angeles', aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time', 'West Coast', 'SF', 'Bay Area'] },
  { city: 'Los Angeles', country: 'United States', iana: 'America/Los_Angeles', aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time', 'LA'] },
  { city: 'Seattle', country: 'United States', iana: 'America/Los_Angeles', aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time'] },
  { city: 'New York', country: 'United States', iana: 'America/New_York', aliases: ['EST', 'EDT', 'ET', 'Eastern', 'Eastern Time', 'NYC', 'East Coast'] },
  { city: 'Boston', country: 'United States', iana: 'America/New_York', aliases: ['EST', 'EDT', 'ET', 'Eastern', 'Eastern Time'] },
  { city: 'Chicago', country: 'United States', iana: 'America/Chicago', aliases: ['CST', 'CDT', 'CT', 'Central', 'Central Time', 'Midwest'] },
  { city: 'Austin', country: 'United States', iana: 'America/Chicago', aliases: ['CST', 'CDT', 'CT', 'Central', 'Central Time', 'Texas'] },
  { city: 'Denver', country: 'United States', iana: 'America/Denver', aliases: ['MST', 'MDT', 'MT', 'Mountain', 'Mountain Time', 'Colorado'] },
  { city: 'Phoenix', country: 'United States', iana: 'America/Phoenix', aliases: ['MST', 'Mountain', 'Arizona', 'AZ'] },
  { city: 'Edmonton', country: 'Canada', iana: 'America/Edmonton', aliases: ['MST', 'MDT', 'MT', 'Mountain', 'Mountain Time', 'Alberta'] },
  { city: 'Calgary', country: 'Canada', iana: 'America/Edmonton', aliases: ['MST', 'MDT', 'MT', 'Mountain', 'Mountain Time', 'Alberta'] },
  { city: 'Toronto', country: 'Canada', iana: 'America/Toronto', aliases: ['EST', 'EDT', 'ET', 'Eastern', 'Eastern Time', 'Ontario'] },
  { city: 'Vancouver', country: 'Canada', iana: 'America/Vancouver', aliases: ['PST', 'PDT', 'PT', 'Pacific', 'Pacific Time', 'BC'] },
  { city: 'Montreal', country: 'Canada', iana: 'America/Toronto', aliases: ['EST', 'EDT', 'ET', 'Eastern', 'Eastern Time', 'Quebec'] },
  { city: 'Tokyo', country: 'Japan', iana: 'Asia/Tokyo', aliases: ['JST', 'Japan', 'Japan Standard Time'] },
  { city: 'Kyoto', country: 'Japan', iana: 'Asia/Tokyo', aliases: ['JST', 'Japan'] },
  { city: 'Osaka', country: 'Japan', iana: 'Asia/Tokyo', aliases: ['JST', 'Japan'] },
  { city: 'Bogotá (Colombia)', country: 'Colombia', iana: 'America/Bogota', aliases: ['COT', 'Colombia', 'Bogota'] },
  { city: 'Medellín', country: 'Colombia', iana: 'America/Bogota', aliases: ['COT', 'Colombia'] },
  { city: 'UTC', country: 'Universal Time Coordinated', iana: 'UTC', aliases: ['GMT', 'Zulu', 'Z'] },
  { city: 'London', country: 'United Kingdom', iana: 'Europe/London', aliases: ['GMT', 'BST', 'Greenwich', 'British Summer Time', 'UK'] },
  { city: 'Dublin', country: 'Ireland', iana: 'Europe/Dublin', aliases: ['GMT', 'IST', 'Irish Standard Time', 'Ireland'] },
  { city: 'Paris', country: 'France', iana: 'Europe/Paris', aliases: ['CET', 'CEST', 'Central European Time', 'France'] },
  { city: 'Berlin', country: 'Germany', iana: 'Europe/Berlin', aliases: ['CET', 'CEST', 'Central European Time', 'Germany'] },
  { city: 'Frankfurt', country: 'Germany', iana: 'Europe/Berlin', aliases: ['CET', 'CEST', 'Central European Time', 'Germany'] },
  { city: 'Amsterdam', country: 'Netherlands', iana: 'Europe/Amsterdam', aliases: ['CET', 'CEST', 'Central European Time', 'Netherlands'] },
  { city: 'Zurich', country: 'Switzerland', iana: 'Europe/Zurich', aliases: ['CET', 'CEST', 'Central European Time', 'Switzerland'] },
  { city: 'Geneva', country: 'Switzerland', iana: 'Europe/Zurich', aliases: ['CET', 'CEST', 'Central European Time', 'Switzerland'] },
  { city: 'Madrid', country: 'Spain', iana: 'Europe/Madrid', aliases: ['CET', 'CEST', 'Central European Time', 'Spain'] },
  { city: 'Barcelona', country: 'Spain', iana: 'Europe/Madrid', aliases: ['CET', 'CEST', 'Central European Time', 'Spain'] },
  { city: 'Rome', country: 'Italy', iana: 'Europe/Rome', aliases: ['CET', 'CEST', 'Central European Time', 'Italy'] },
  { city: 'Milan', country: 'Italy', iana: 'Europe/Rome', aliases: ['CET', 'CEST', 'Central European Time', 'Italy'] },
  { city: 'Stockholm', country: 'Sweden', iana: 'Europe/Stockholm', aliases: ['CET', 'CEST', 'Sweden'] },
  { city: 'Oslo', country: 'Norway', iana: 'Europe/Oslo', aliases: ['CET', 'CEST', 'Norway'] },
  { city: 'Copenhagen', country: 'Denmark', iana: 'Europe/Copenhagen', aliases: ['CET', 'CEST', 'Denmark'] },
  { city: 'Helsinki', country: 'Finland', iana: 'Europe/Helsinki', aliases: ['EET', 'EEST', 'Finland'] },
  { city: 'Warsaw', country: 'Poland', iana: 'Europe/Warsaw', aliases: ['CET', 'CEST', 'Poland'] },
  { city: 'Prague', country: 'Czech Republic', iana: 'Europe/Prague', aliases: ['CET', 'CEST', 'Czech'] },
  { city: 'Vienna', country: 'Austria', iana: 'Europe/Vienna', aliases: ['CET', 'CEST', 'Austria'] },
  { city: 'Brussels', country: 'Belgium', iana: 'Europe/Brussels', aliases: ['CET', 'CEST', 'Belgium'] },
  { city: 'Lisbon', country: 'Portugal', iana: 'Europe/Lisbon', aliases: ['WET', 'WEST', 'Portugal'] },
  { city: 'Athens', country: 'Greece', iana: 'Europe/Athens', aliases: ['EET', 'EEST', 'Greece'] },
  { city: 'Istanbul', country: 'Turkey', iana: 'Europe/Istanbul', aliases: ['TRT', 'Turkey'] },
  { city: 'Dubai', country: 'United Arab Emirates', iana: 'Asia/Dubai', aliases: ['GST', 'Gulf', 'UAE'] },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', iana: 'Asia/Dubai', aliases: ['GST', 'Gulf', 'UAE'] },
  { city: 'Riyadh', country: 'Saudi Arabia', iana: 'Asia/Riyadh', aliases: ['AST', 'Arabia', 'Saudi'] },
  { city: 'Doha', country: 'Qatar', iana: 'Asia/Qatar', aliases: ['AST', 'Qatar'] },
  { city: 'Tel Aviv', country: 'Israel', iana: 'Asia/Jerusalem', aliases: ['IDT', 'IST', 'Israel'] },
  { city: 'Singapore', country: 'Singapore', iana: 'Asia/Singapore', aliases: ['SGT', 'Singapore'] },
  { city: 'Hong Kong', country: 'Hong Kong', iana: 'Asia/Hong_Kong', aliases: ['HKT', 'Hong Kong'] },
  { city: 'Seoul', country: 'South Korea', iana: 'Asia/Seoul', aliases: ['KST', 'Korea', 'South Korea'] },
  { city: 'Beijing', country: 'China', iana: 'Asia/Shanghai', aliases: ['CST', 'China', 'China Standard Time'] },
  { city: 'Shanghai', country: 'China', iana: 'Asia/Shanghai', aliases: ['CST', 'China', 'China Standard Time'] },
  { city: 'Taipei', country: 'Taiwan', iana: 'Asia/Taipei', aliases: ['CST', 'Taiwan'] },
  { city: 'Bangkok', country: 'Thailand', iana: 'Asia/Bangkok', aliases: ['ICT', 'Thailand'] },
  { city: 'Jakarta', country: 'Indonesia', iana: 'Asia/Jakarta', aliases: ['WIB', 'Indonesia'] },
  { city: 'Kuala Lumpur', country: 'Malaysia', iana: 'Asia/Kuala_Lumpur', aliases: ['MYT', 'Malaysia'] },
  { city: 'Manila', country: 'Philippines', iana: 'Asia/Manila', aliases: ['PHT', 'Philippines'] },
  { city: 'Sydney', country: 'Australia', iana: 'Australia/Sydney', aliases: ['AEST', 'AEDT', 'Australian Eastern Time', 'Australia'] },
  { city: 'Melbourne', country: 'Australia', iana: 'Australia/Melbourne', aliases: ['AEST', 'AEDT', 'Australian Eastern Time', 'Australia'] },
  { city: 'Brisbane', country: 'Australia', iana: 'Australia/Brisbane', aliases: ['AEST', 'Queensland', 'Australia'] },
  { city: 'Perth', country: 'Australia', iana: 'Australia/Perth', aliases: ['AWST', 'Western Australia', 'Australia'] },
  { city: 'Adelaide', country: 'Australia', iana: 'Australia/Adelaide', aliases: ['ACST', 'ACDT', 'South Australia', 'Australia'] },
  { city: 'Auckland', country: 'New Zealand', iana: 'Pacific/Auckland', aliases: ['NZST', 'NZDT', 'New Zealand'] },
  { city: 'Wellington', country: 'New Zealand', iana: 'Pacific/Auckland', aliases: ['NZST', 'NZDT', 'New Zealand'] },
  { city: 'Honolulu', country: 'United States', iana: 'Pacific/Honolulu', aliases: ['HST', 'Hawaii', 'Hawaii Time'] },
  { city: 'Anchorage', country: 'United States', iana: 'America/Anchorage', aliases: ['AKST', 'AKDT', 'Alaska', 'Alaska Time'] },
  { city: 'São Paulo', country: 'Brazil', iana: 'America/Sao_Paulo', aliases: ['BRT', 'BRST', 'Brazil'] },
  { city: 'Rio de Janeiro', country: 'Brazil', iana: 'America/Sao_Paulo', aliases: ['BRT', 'BRST', 'Brazil'] },
  { city: 'Buenos Aires', country: 'Argentina', iana: 'America/Argentina/Buenos_Aires', aliases: ['ART', 'Argentina'] },
  { city: 'Santiago', country: 'Chile', iana: 'America/Santiago', aliases: ['CLT', 'CLST', 'Chile'] },
  { city: 'Lima', country: 'Peru', iana: 'America/Lima', aliases: ['PET', 'Peru'] },
  { city: 'Mexico City', country: 'Mexico', iana: 'America/Mexico_City', aliases: ['CST', 'CDT', 'Mexico'] },
  { city: 'Cairo', country: 'Egypt', iana: 'Africa/Cairo', aliases: ['EET', 'Egypt'] },
  { city: 'Johannesburg', country: 'South Africa', iana: 'Africa/Johannesburg', aliases: ['SAST', 'South Africa'] },
  { city: 'Cape Town', country: 'South Africa', iana: 'Africa/Johannesburg', aliases: ['SAST', 'South Africa'] },
  { city: 'Lagos', country: 'Nigeria', iana: 'Africa/Lagos', aliases: ['WAT', 'Nigeria'] },
  { city: 'Nairobi', country: 'Kenya', iana: 'Africa/Nairobi', aliases: ['EAT', 'Kenya'] },
  { city: 'Kathmandu', country: 'Nepal', iana: 'Asia/Kathmandu', aliases: ['NPT', 'Nepal Time', 'Nepal'] },
  { city: 'Dhaka', country: 'Bangladesh', iana: 'Asia/Dhaka', aliases: ['BST', 'Bangladesh'] },
  { city: 'Colombo', country: 'Sri Lanka', iana: 'Asia/Colombo', aliases: ['IST', 'Sri Lanka'] },
  { city: 'Karachi', country: 'Pakistan', iana: 'Asia/Karachi', aliases: ['PKT', 'Pakistan'] },
];

/**
 * Builds a searchable list combining popular cities with standard IANA zones
 */
export function getAllAvailableTimezones(): TimezoneItem[] {
  const seen = new Set<string>();
  const list: TimezoneItem[] = [];

  // 1. Regional timezone conventions (PST, EST, CST, GMT, CET, IST, etc.)
  for (const item of TIMEZONE_CONVENTIONS) {
    const id = `convention-${item.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (!seen.has(id)) {
      seen.add(id);
      list.push({
        id,
        city: item.city,
        country: item.country,
        iana: item.iana,
        label: `${item.city}, ${item.country}`,
        aliases: item.aliases,
      });
    }
  }

  // 2. Popular cities
  for (const item of POPULAR_CITIES) {
    const id = `${item.iana.toLowerCase().replace(/\//g, '-')}-${item.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    if (!seen.has(id)) {
      seen.add(id);
      list.push({
        id,
        city: item.city,
        country: item.country,
        iana: item.iana,
        label: `${item.city}, ${item.country}`,
        aliases: item.aliases,
      });
    }
  }

  // Fallback / standard IANA values if supported
  if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
    try {
      const allIana = Intl.supportedValuesOf('timeZone');
      for (const iana of allIana) {
        const id = `iana-${iana.toLowerCase().replace(/\//g, '-')}`;
        if (!list.some((it) => it.iana.toLowerCase() === iana.toLowerCase())) {
          const parts = iana.split('/');
          const city = parts[parts.length - 1].replace(/_/g, ' ');
          const country = parts[0].replace(/_/g, ' ');
          list.push({
            id,
            city,
            country,
            iana,
            label: `${city} (${iana})`,
          });
        }
      }
    } catch {
      // Ignore if not supported in test environment
    }
  }

  return list;
}

export function searchTimezones(query: string, availableList?: TimezoneItem[]): TimezoneItem[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  const list = availableList || getAllAvailableTimezones();
  const matches = list.filter((item) => {
    const cityMatch = item.city.toLowerCase().includes(clean);
    const countryMatch = item.country.toLowerCase().includes(clean);
    const ianaMatch = item.iana.toLowerCase().includes(clean);
    const labelMatch = item.label ? item.label.toLowerCase().includes(clean) : false;
    const aliasMatch = item.aliases
      ? item.aliases.some((a) => a.toLowerCase().includes(clean))
      : false;
    return cityMatch || countryMatch || ianaMatch || labelMatch || aliasMatch;
  });

  // Sort matches so exact city/alias matches rank first
  matches.sort((a, b) => {
    const aExactCity = a.city.toLowerCase() === clean;
    const bExactCity = b.city.toLowerCase() === clean;
    if (aExactCity && !bExactCity) return -1;
    if (!aExactCity && bExactCity) return 1;

    const aExactAlias = a.aliases?.some((al) => al.toLowerCase() === clean);
    const bExactAlias = b.aliases?.some((al) => al.toLowerCase() === clean);
    if (aExactAlias && !bExactAlias) return -1;
    if (!aExactAlias && bExactAlias) return 1;

    const aStartsCity = a.city.toLowerCase().startsWith(clean);
    const bStartsCity = b.city.toLowerCase().startsWith(clean);
    if (aStartsCity && !bStartsCity) return -1;
    if (!aStartsCity && bStartsCity) return 1;

    return 0;
  });

  return matches.slice(0, 15);
}

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
  timeZoneName: string;
}

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    hourCycle: 'h23',
    timeZoneName: 'shortOffset',
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );

  return {
    year: parseInt(parts.year, 10) || 2026,
    month: parseInt(parts.month, 10) || 1,
    day: parseInt(parts.day, 10) || 1,
    hour: parseInt(parts.hour, 10) || 0,
    minute: parseInt(parts.minute, 10) || 0,
    second: parseInt(parts.second, 10) || 0,
    weekday: parts.weekday || '',
    timeZoneName: parts.timeZoneName || 'UTC',
  };
}

/**
 * Returns UTC timestamp for a specified local date & time in a timezone
 */
export function getTimestampForZone(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string
): number {
  const targetLocalMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = targetLocalMs;
  for (let i = 0; i < 3; i++) {
    const parts = getZonedParts(new Date(guess), timeZone);
    const localGuess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0);
    const diff = targetLocalMs - localGuess;
    if (diff === 0) break;
    guess += diff;
  }
  return guess;
}

/**
 * Returns the start timestamp (midnight of yesterday in reference zone) for 72-hour window
 */
export function getTimelineStartMs(referenceDate: Date, referenceIana: string): number {
  const parts = getZonedParts(referenceDate, referenceIana);
  // Midnight of yesterday in reference timezone
  return getTimestampForZone(parts.year, parts.month, parts.day - 1, 0, 0, referenceIana);
}

/**
 * Generates an array of 72 UTC timestamp numbers (1 hour apart) covering yesterday, today, and tomorrow
 */
export function getThreeDayTimelineHours(referenceTimestampMs: number, referenceIana: string): number[] {
  const startMs = getTimelineStartMs(new Date(referenceTimestampMs), referenceIana);
  const hours: number[] = [];
  for (let i = 0; i < 72; i++) {
    hours.push(startMs + i * 3600000);
  }
  return hours;
}

/**
 * Calculates current display state for a timezone at a given timestamp
 */
export function calculateZoneTime(
  timestampMs: number,
  timeZone: string,
  timeFormat: TimeFormat
): CalculatedZoneTime {
  const date = new Date(timestampMs);
  const parts = getZonedParts(date, timeZone);

  const isWorkHours = parts.hour >= 9 && parts.hour < 18;
  const isNight = parts.hour >= 22 || parts.hour < 7;

  let timeStr = '';
  if (timeFormat === '12h') {
    const period = parts.hour >= 12 ? 'PM' : 'AM';
    const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
    const mStr = parts.minute.toString().padStart(2, '0');
    timeStr = `${h12}:${mStr} ${period}`;
  } else {
    const hStr = parts.hour.toString().padStart(2, '0');
    const mStr = parts.minute.toString().padStart(2, '0');
    timeStr = `${hStr}:${mStr}`;
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthStr = monthNames[parts.month - 1] || '';
  const dateStr = `${monthStr} ${parts.day}, ${parts.year}`;

  return {
    timeStr,
    dateStr,
    dayStr: parts.weekday,
    offsetStr: parts.timeZoneName,
    isWorkHours,
    isNight,
    localHour: parts.hour,
    localMinute: parts.minute,
  };
}

export interface FormattedTimelineTile {
  hourText: string;
  isWorkHours: boolean;
  isNight: boolean;
  isMidnight: boolean;
  dayBadge?: string;
}

/**
 * Formats an individual hourly tile for a timezone row
 */
export function formatTimelineTile(
  timestampMs: number,
  timeZone: string,
  timeFormat: TimeFormat
): FormattedTimelineTile {
  const date = new Date(timestampMs);
  const parts = getZonedParts(date, timeZone);

  const isWorkHours = parts.hour >= 9 && parts.hour < 18;
  const isNight = parts.hour >= 22 || parts.hour < 7;
  const isMidnight = parts.hour === 0;

  let hourText = '';
  if (timeFormat === '12h') {
    const period = parts.hour >= 12 ? 'p' : 'a';
    const h12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
    if (parts.minute !== 0) {
      hourText = `${h12}:${parts.minute.toString().padStart(2, '0')}${period}`;
    } else {
      hourText = `${h12}${period}`;
    }
  } else {
    hourText = `${parts.hour.toString().padStart(2, '0')}:${parts.minute.toString().padStart(2, '0')}`;
  }

  let dayBadge: string | undefined;
  if (isMidnight) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dayBadge = `${parts.weekday} ${parts.day} ${monthNames[parts.month - 1]}`;
  }

  return {
    hourText,
    isWorkHours,
    isNight,
    isMidnight,
    dayBadge,
  };
}

/**
 * Formats a clean clipboard meeting summary for all active timezones
 */
export function formatMeetingSummary(
  timestampMs: number,
  timezones: TimezoneItem[],
  timeFormat: TimeFormat
): string {
  const lines: string[] = ['📅 Meeting Times:'];
  for (const tz of timezones) {
    const calc = calculateZoneTime(timestampMs, tz.iana, timeFormat);
    lines.push(`• ${tz.city} (${tz.country}): ${calc.dayStr}, ${calc.dateStr} at ${calc.timeStr} (${calc.offsetStr})`);
  }
  return lines.join('\n');
}
