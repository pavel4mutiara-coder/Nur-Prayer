
import { CalculationMethod, Madhab, Coordinates, PrayerTimes } from '../types';

/**
 * High-precision astronomical calculation for Islamic Prayer Times.
 * Implements standard algorithms based on Sun's position.
 */

const D2R = Math.PI / 180.0;
const R2D = 180.0 / Math.PI;

function fixAngle(a: number): number {
  a = a - 360.0 * Math.floor(a / 360.0);
  a = a < 0 ? a + 360.0 : a;
  return a;
}

function fixHour(h: number): number {
  h = h - 24.0 * Math.floor(h / 24.0);
  h = h < 0 ? h + 24.0 : h;
  return h;
}

export function calculateQibla(coords: Coordinates): number {
  const mLat = 21.4225 * D2R;
  const mLon = 39.8262 * D2R;
  const lat = coords.latitude * D2R;
  const lon = coords.longitude * D2R;

  const numerator = Math.sin(mLon - lon);
  const denominator = Math.cos(lat) * Math.tan(mLat) - Math.sin(lat) * Math.cos(mLon - lon);
  let qibla = Math.atan2(numerator, denominator) * R2D;
  return fixAngle(qibla);
}

/**
 * Calculates distance in kilometers between two coordinates using the Haversine formula.
 */
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = (coords2.latitude - coords1.latitude) * D2R;
  const dLon = (coords2.longitude - coords1.longitude) * D2R;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(coords1.latitude * D2R) * Math.cos(coords2.latitude * D2R) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Computes Hijri date from a Gregorian date with a manual day offset.
 */
export function getHijriDate(date: Date, offset: number = 0) {
  const adjustedDate = new Date(date);
  adjustedDate.setDate(date.getDate() + offset);

  // Julian Day
  let jd = Math.floor(adjustedDate.getTime() / 86400000) + 2440587.5;
  
  const l = Math.floor(jd - 1948439.5 + 0.5);
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n;
  const j = Math.floor((l2 - 1) / 354);
  const l3 = l2 - 354 * j;
  const k = Math.floor((l3 - 1) / 30);
  const year = 30 * n + j + 1;
  const month = k + 1;
  const day = l3 - 30 * k;

  const months = [
    "Muharram", "Safar", "Rabi' al-awwal", "Rabi' al-thani",
    "Jumada al-ula", "Jumada al-akhira", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
  ];
  
  return { day, month: months[month - 1], monthIndex: month, year };
}

/**
 * Converts Hijri date back to Julian Day, then to Gregorian Date.
 */
export function hijriToGregorian(hYear: number, hMonth: number, hDay: number, offset: number = 0): Date {
  const jd = Math.floor((11 * hYear + 3) / 30) + 354 * hYear + 30 * hMonth - Math.floor((hMonth - 1) / 2) + hDay + 1948440 - 385;
  const date = new Date((jd - 2440587.5) * 86400000);
  date.setDate(date.getDate() - offset);
  return date;
}

export function computePrayerTimes(
  date: Date,
  coords: Coordinates,
  method: CalculationMethod,
  madhab: Madhab,
  adjustments: Record<string, number> = {},
  tz: number = -date.getTimezoneOffset() / 60
): PrayerTimes {
  const julianDate = date.getTime() / 86400000 + 2440587.5;
  const d = julianDate - 2451545.0;
  
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const L = fixAngle(q + 1.915 * Math.sin(g * D2R) + 0.020 * Math.sin(2 * g * D2R));
  
  const e = 23.439 - 0.00000036 * d;
  const declination = Math.asin(Math.sin(e * D2R) * Math.sin(L * D2R)) * R2D;
  const correctRA = Math.atan2(Math.cos(e * D2R) * Math.sin(L * D2R), Math.cos(L * D2R)) * R2D / 15;
  
  const equationOfTime = q / 15 - fixHour(correctRA);
  const dhuhr = fixHour(12 + tz - coords.longitude / 15 - equationOfTime);

  const getSunTime = (angle: number, direction: 'rising' | 'setting') => {
    const val = (Math.sin(angle * D2R) - Math.sin(coords.latitude * D2R) * Math.sin(declination * D2R)) /
                (Math.cos(coords.latitude * D2R) * Math.cos(declination * D2R));
    if (val > 1 || val < -1) return NaN;
    const h = Math.acos(val) * R2D / 15;
    return dhuhr + (direction === 'rising' ? -h : h);
  };

  let fajrAngle = 18;
  let ishaAngle = 18;
  if (method === CalculationMethod.UMM_AL_QURA) { fajrAngle = 18.5; ishaAngle = 0; }
  else if (method === CalculationMethod.ISNA) { fajrAngle = 15; ishaAngle = 15; }
  else if (method === CalculationMethod.MWL) { fajrAngle = 18; ishaAngle = 17; }
  else if (method === CalculationMethod.EGYPT) { fajrAngle = 19.5; ishaAngle = 17.5; }
  else if (method === CalculationMethod.KARACHI) { fajrAngle = 18; ishaAngle = 18; }

  const sunrise = getSunTime(-0.833, 'rising');
  const maghrib = getSunTime(-0.833, 'setting');
  const fajr = getSunTime(-fajrAngle, 'rising');
  let isha = ishaAngle !== 0 ? getSunTime(-ishaAngle, 'setting') : maghrib + 1.5;

  const factor = madhab === Madhab.HANAFI ? 2 : 1;
  const asrAngle = Math.atan(1 / (factor + Math.tan(Math.abs(coords.latitude - declination) * D2R))) * R2D;
  const asr = getSunTime(asrAngle, 'setting');

  const format = (h: number, key: string) => {
    if (isNaN(h)) return '--:--';
    const hour = Math.floor(h);
    const min = Math.round((h - hour) * 60);
    const d = new Date(date);
    d.setHours(hour, min, 0, 0);
    const adj = adjustments[key] || 0;
    if (adj !== 0) {
      d.setMinutes(d.getMinutes() + adj);
    }
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return {
    fajr: format(fajr, 'fajr'),
    sunrise: format(sunrise, 'sunrise'),
    dhuhr: format(dhuhr, 'dhuhr'),
    asr: format(asr, 'asr'),
    maghrib: format(maghrib, 'maghrib'),
    isha: format(isha, 'isha'),
    date
  };
}
