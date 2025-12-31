
import React from 'react';
import { PrayerTimes, Language, UserPreferences } from '../types';

interface PrayerListProps {
  prayerTimes: PrayerTimes;
  t: any;
  prefs: UserPreferences;
  currentTime: Date;
  journal?: Record<string, boolean>;
  onToggleJournal?: (id: string) => void;
}

const PrayerList: React.FC<PrayerListProps> = ({ prayerTimes, t, prefs, currentTime, journal = {}, onToggleJournal }) => {
  const isRtl = prefs.language === Language.ARABIC;

  const prayers = [
    { id: 'fajr', label: t.fajr, time: prayerTimes.fajr, icon: 'fa-sun-haze' },
    { id: 'sunrise', label: t.sunrise, time: prayerTimes.sunrise, icon: 'fa-sunrise' },
    { id: 'dhuhr', label: t.dhuhr, time: prayerTimes.dhuhr, icon: 'fa-sun' },
    { id: 'asr', label: t.asr, time: prayerTimes.asr, icon: 'fa-cloud-sun' },
    { id: 'maghrib', label: t.maghrib, time: prayerTimes.maghrib, icon: 'fa-moon-stars' },
    { id: 'isha', label: t.isha, time: prayerTimes.isha, icon: 'fa-moon' },
  ];

  const getTimeInMinutes = (timeStr: string) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  
  let currentPrayerId = 'isha';
  for (let i = 0; i < prayers.length; i++) {
    const pMinutes = getTimeInMinutes(prayers[i].time);
    if (currentMinutes < pMinutes) {
      currentPrayerId = prayers[i === 0 ? prayers.length - 1 : i - 1].id;
      break;
    }
    if (i === prayers.length - 1) currentPrayerId = 'isha';
  }

  return (
    <div className="space-y-3 py-4" dir={isRtl ? 'rtl' : 'ltr'}>
      {prayers.map((prayer) => {
        const isActive = prayer.id === currentPrayerId;
        const isAzanEnabled = prefs.azan.enabled[prayer.id as keyof typeof prefs.azan.enabled];
        const isPerformed = journal[prayer.id];
        
        return (
          <div 
            key={prayer.id}
            onClick={() => prayer.id !== 'sunrise' && onToggleJournal?.(prayer.id)}
            className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 cursor-pointer ${
              isActive 
                ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]' 
                : prefs.isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 shadow-sm border border-emerald-50'
            } ${isPerformed && !isActive ? 'opacity-70 grayscale-[0.5]' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${isPerformed ? 'rotate-[360deg]' : ''} ${isActive ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                {isPerformed && prayer.id !== 'sunrise' ? (
                  <i className="fa-solid fa-check text-lg"></i>
                ) : (
                  <i className={`fa-solid ${prayer.icon} text-lg`}></i>
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-semibold ${isPerformed ? 'line-through opacity-50' : ''}`}>{prayer.label}</span>
                {prayer.id !== 'sunrise' && (
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                    <i className={`fa-solid ${isAzanEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} mr-1`}></i>
                    {isAzanEnabled ? 'Azan ON' : 'Azan OFF'}
                  </span>
                )}
              </div>
            </div>
            <div className={`text-xl font-medium tracking-tighter ${isPerformed ? 'opacity-30' : ''}`}>
              {prayer.time}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PrayerList;
