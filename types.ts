
export enum Language {
  ENGLISH = 'en',
  BANGLA = 'bn',
  ARABIC = 'ar',
  INDONESIAN = 'id'
}

export enum CalculationMethod {
  MWL = 'MWL',
  ISNA = 'ISNA',
  EGYPT = 'Egypt',
  KARACHI = 'Karachi',
  UMM_AL_QURA = 'UmmAlQura',
  DUBAI = 'Dubai',
  KUWAIT = 'Kuwait',
  QATAR = 'Qatar',
  SINGAPORE = 'Singapore',
  TEHRAN = 'Tehran',
  TURKEY = 'Turkey'
}

export enum Madhab {
  SHAFI = 'Shafi',
  HANAFI = 'Hanafi'
}

export type AzanNotificationMode = 'sound' | 'vibrate' | 'silent';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PrayerTimes {
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  date: Date;
}

export interface UserPreferences {
  language: Language;
  method: CalculationMethod;
  madhab: Madhab;
  coordinates: Coordinates;
  locationName: string;
  isDarkMode: boolean;
  hijriOffset: number;
  adjustments: {
    fajr: number;
    sunrise: number;
    dhuhr: number;
    asr: number;
    maghrib: number;
    isha: number;
  };
  azan: {
    enabled: {
      fajr: boolean;
      dhuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
    };
    selectedSoundId: string;
    pitch: number;
    mode: AzanNotificationMode;
  };
  reminders: {
    enabled: {
      fajr: boolean;
      dhuhr: boolean;
      asr: boolean;
      maghrib: boolean;
      isha: boolean;
    };
    offsetMinutes: number;
  };
}
