export type TimeFormat = '12h' | '24h';

export interface TimezoneItem {
  id: string;
  city: string;
  country: string;
  iana: string;
  label?: string;
  aliases?: string[];
}

export interface TimezonePreferences {
  timezones: TimezoneItem[];
  timeFormat: TimeFormat;
  referenceId: string;
}

export interface CalculatedZoneTime {
  timeStr: string;
  dateStr: string;
  dayStr: string;
  offsetStr: string;
  isWorkHours: boolean;
  isNight: boolean;
  localHour: number;
  localMinute: number;
}
