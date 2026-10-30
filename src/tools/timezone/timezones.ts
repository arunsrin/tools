import type { CalculatedZoneTime, TimeFormat, TimezoneItem } from './types';

export const DEFAULT_TIMEZONES: TimezoneItem[] = [
  {
    id: 'asia-kolkata-bangalore',
    city: 'Bangalore',
    country: 'India',
    iana: 'Asia/Kolkata',
    label: 'Bangalore (IST)',
  },
  {
    id: 'america-los-angeles-san-francisco',
    city: 'San Francisco',
    country: 'United States',
    iana: 'America/Los_Angeles',
    label: 'San Francisco (PT)',
  },
  {
    id: 'asia-tokyo-tokyo',
    city: 'Tokyo',
    country: 'Japan',
    iana: 'Asia/Tokyo',
    label: 'Tokyo (JST)',
  },
  {
    id: 'america-bogota-colombia',
    city: 'Colombia (Bogotá)',
    country: 'Colombia',
    iana: 'America/Bogota',
    label: 'Colombia (COT)',
  },
  {
    id: 'america-edmonton-edmonton',
    city: 'Edmonton',
    country: 'Canada',
    iana: 'America/Edmonton',
    label: 'Edmonton (MT)',
  },
  {
    id: 'etc-utc',
    city: 'UTC',
    country: 'Coordinated Universal Time',
    iana: 'UTC',
    label: 'UTC (Universal)',
  },
];

export const POPULAR_CITIES: Omit<TimezoneItem, 'id'>[] = [
  { city: 'Bangalore', country: 'India', iana: 'Asia/Kolkata' },
  { city: 'Mumbai', country: 'India', iana: 'Asia/Kolkata' },
  { city: 'New Delhi', country: 'India', iana: 'Asia/Kolkata' },
  { city: 'San Francisco', country: 'United States', iana: 'America/Los_Angeles' },
  { city: 'Los Angeles', country: 'United States', iana: 'America/Los_Angeles' },
  { city: 'Seattle', country: 'United States', iana: 'America/Los_Angeles' },
  { city: 'New York', country: 'United States', iana: 'America/New_York' },
  { city: 'Boston', country: 'United States', iana: 'America/New_York' },
  { city: 'Chicago', country: 'United States', iana: 'America/Chicago' },
  { city: 'Austin', country: 'United States', iana: 'America/Chicago' },
  { city: 'Denver', country: 'United States', iana: 'America/Denver' },
  { city: 'Phoenix', country: 'United States', iana: 'America/Phoenix' },
  { city: 'Edmonton', country: 'Canada', iana: 'America/Edmonton' },
  { city: 'Calgary', country: 'Canada', iana: 'America/Edmonton' },
  { city: 'Toronto', country: 'Canada', iana: 'America/Toronto' },
  { city: 'Vancouver', country: 'Canada', iana: 'America/Vancouver' },
  { city: 'Montreal', country: 'Canada', iana: 'America/Toronto' },
  { city: 'Tokyo', country: 'Japan', iana: 'Asia/Tokyo' },
  { city: 'Kyoto', country: 'Japan', iana: 'Asia/Tokyo' },
  { city: 'Osaka', country: 'Japan', iana: 'Asia/Tokyo' },
  { city: 'Bogotá (Colombia)', country: 'Colombia', iana: 'America/Bogota' },
  { city: 'Medellín', country: 'Colombia', iana: 'America/Bogota' },
  { city: 'UTC', country: 'Universal Time Coordinated', iana: 'UTC' },
  { city: 'London', country: 'United Kingdom', iana: 'Europe/London' },
  { city: 'Dublin', country: 'Ireland', iana: 'Europe/Dublin' },
  { city: 'Paris', country: 'France', iana: 'Europe/Paris' },
  { city: 'Berlin', country: 'Germany', iana: 'Europe/Berlin' },
  { city: 'Frankfurt', country: 'Germany', iana: 'Europe/Berlin' },
  { city: 'Amsterdam', country: 'Netherlands', iana: 'Europe/Amsterdam' },
  { city: 'Zurich', country: 'Switzerland', iana: 'Europe/Zurich' },
  { city: 'Geneva', country: 'Switzerland', iana: 'Europe/Zurich' },
  { city: 'Madrid', country: 'Spain', iana: 'Europe/Madrid' },
  { city: 'Barcelona', country: 'Spain', iana: 'Europe/Madrid' },
  { city: 'Rome', country: 'Italy', iana: 'Europe/Rome' },
  { city: 'Milan', country: 'Italy', iana: 'Europe/Rome' },
  { city: 'Stockholm', country: 'Sweden', iana: 'Europe/Stockholm' },
  { city: 'Oslo', country: 'Norway', iana: 'Europe/Oslo' },
  { city: 'Copenhagen', country: 'Denmark', iana: 'Europe/Copenhagen' },
  { city: 'Helsinki', country: 'Finland', iana: 'Europe/Helsinki' },
  { city: 'Warsaw', country: 'Poland', iana: 'Europe/Warsaw' },
  { city: 'Prague', country: 'Czech Republic', iana: 'Europe/Prague' },
  { city: 'Vienna', country: 'Austria', iana: 'Europe/Vienna' },
  { city: 'Brussels', country: 'Belgium', iana: 'Europe/Brussels' },
  { city: 'Lisbon', country: 'Portugal', iana: 'Europe/Lisbon' },
  { city: 'Athens', country: 'Greece', iana: 'Europe/Athens' },
  { city: 'Istanbul', country: 'Turkey', iana: 'Europe/Istanbul' },
  { city: 'Dubai', country: 'United Arab Emirates', iana: 'Asia/Dubai' },
  { city: 'Abu Dhabi', country: 'United Arab Emirates', iana: 'Asia/Dubai' },
  { city: 'Riyadh', country: 'Saudi Arabia', iana: 'Asia/Riyadh' },
  { city: 'Doha', country: 'Qatar', iana: 'Asia/Qatar' },
  { city: 'Tel Aviv', country: 'Israel', iana: 'Asia/Jerusalem' },
  { city: 'Singapore', country: 'Singapore', iana: 'Asia/Singapore' },
  { city: 'Hong Kong', country: 'Hong Kong', iana: 'Asia/Hong_Kong' },
  { city: 'Seoul', country: 'South Korea', iana: 'Asia/Seoul' },
  { city: 'Beijing', country: 'China', iana: 'Asia/Shanghai' },
  { city: 'Shanghai', country: 'China', iana: 'Asia/Shanghai' },
  { city: 'Taipei', country: 'Taiwan', iana: 'Asia/Taipei' },
  { city: 'Bangkok', country: 'Thailand', iana: 'Asia/Bangkok' },
  { city: 'Jakarta', country: 'Indonesia', iana: 'Asia/Jakarta' },
  { city: 'Kuala Lumpur', country: 'Malaysia', iana: 'Asia/Kuala_Lumpur' },
  { city: 'Manila', country: 'Philippines', iana: 'Asia/Manila' },
  { city: 'Sydney', country: 'Australia', iana: 'Australia/Sydney' },
  { city: 'Melbourne', country: 'Australia', iana: 'Australia/Melbourne' },
  { city: 'Brisbane', country: 'Australia', iana: 'Australia/Brisbane' },
  { city: 'Perth', country: 'Australia', iana: 'Australia/Perth' },
  { city: 'Adelaide', country: 'Australia', iana: 'Australia/Adelaide' },
  { city: 'Auckland', country: 'New Zealand', iana: 'Pacific/Auckland' },
  { city: 'Wellington', country: 'New Zealand', iana: 'Pacific/Auckland' },
  { city: 'Honolulu', country: 'United States', iana: 'Pacific/Honolulu' },
  { city: 'Anchorage', country: 'United States', iana: 'America/Anchorage' },
  { city: 'São Paulo', country: 'Brazil', iana: 'America/Sao_Paulo' },
  { city: 'Rio de Janeiro', country: 'Brazil', iana: 'America/Sao_Paulo' },
  { city: 'Buenos Aires', country: 'Argentina', iana: 'America/Argentina/Buenos_Aires' },
  { city: 'Santiago', country: 'Chile', iana: 'America/Santiago' },
  { city: 'Lima', country: 'Peru', iana: 'America/Lima' },
  { city: 'Mexico City', country: 'Mexico', iana: 'America/Mexico_City' },
  { city: 'Cairo', country: 'Egypt', iana: 'Africa/Cairo' },
  { city: 'Johannesburg', country: 'South Africa', iana: 'Africa/Johannesburg' },
  { city: 'Cape Town', country: 'South Africa', iana: 'Africa/Johannesburg' },
  { city: 'Lagos', country: 'Nigeria', iana: 'Africa/Lagos' },
  { city: 'Nairobi', country: 'Kenya', iana: 'Africa/Nairobi' },
  { city: 'Kathmandu', country: 'Nepal', iana: 'Asia/Kathmandu' },
  { city: 'Dhaka', country: 'Bangladesh', iana: 'Asia/Dhaka' },
  { city: 'Colombo', country: 'Sri Lanka', iana: 'Asia/Colombo' },
  { city: 'Karachi', country: 'Pakistan', iana: 'Asia/Karachi' },
];

/**
 * Builds a searchable list combining popular cities with standard IANA zones
 */
export function getAllAvailableTimezones(): TimezoneItem[] {
  const seen = new Set<string>();
  const list: TimezoneItem[] = [];

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
  return list
    .filter((item) => {
      const cityMatch = item.city.toLowerCase().includes(clean);
      const countryMatch = item.country.toLowerCase().includes(clean);
      const ianaMatch = item.iana.toLowerCase().includes(clean);
      const labelMatch = item.label ? item.label.toLowerCase().includes(clean) : false;
      return cityMatch || countryMatch || ianaMatch || labelMatch;
    })
    .slice(0, 15);
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
