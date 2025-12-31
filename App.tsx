
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Language, 
  CalculationMethod, 
  Madhab, 
  UserPreferences, 
  PrayerTimes,
  AzanNotificationMode
} from './types';
import { TRANSLATIONS, METHOD_NAMES, AZAN_SOUNDS } from './constants';
import { computePrayerTimes, getHijriDate, calculateQibla } from './utils/astronomy';
import { db } from './services/db';
import Header from './components/Header';
import PrayerList from './components/PrayerList';
import Compass from './components/Compass';
import Settings from './components/Settings';
import Calendar from './components/Calendar';

const DEFAULT_PREFS: UserPreferences = {
  language: Language.ENGLISH,
  method: CalculationMethod.MWL,
  madhab: Madhab.SHAFI,
  coordinates: { latitude: 23.8103, longitude: 90.4125 },
  locationName: 'Dhaka, Bangladesh',
  isDarkMode: false,
  hijriOffset: 0,
  adjustments: { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
  azan: {
    enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    selectedSoundId: 'makkah',
    pitch: 1.0,
    mode: 'sound'
  },
  reminders: {
    enabled: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    offsetMinutes: 10
  }
};

const App: React.FC = () => {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFS);
  const [journal, setJournal] = useState<Record<string, boolean>>({});
  const [isReady, setIsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'qibla' | 'calendar' | 'settings'>('home');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const lastPlayedTime = useRef<string | null>(null);
  const lastNotifiedTime = useRef<string | null>(null);

  const dateId = useMemo(() => currentTime.toISOString().split('T')[0], [currentTime]);

  // DB Initialization
  useEffect(() => {
    const initApp = async () => {
      try {
        await db.init();
        const savedPrefs = await db.getPreferences();
        if (savedPrefs) {
          setPrefs({ ...DEFAULT_PREFS, ...savedPrefs });
        }
        const dailyJournal = await db.getJournalEntry(dateId);
        if (dailyJournal) {
          setJournal(dailyJournal);
        }
        setIsReady(true);
      } catch (err) {
        console.error("Failed to initialize database", err);
        setIsReady(true); // Fallback to defaults
      }
    };
    initApp();
  }, [dateId]);

  // Persist Preferences
  useEffect(() => {
    if (isReady) {
      db.savePreferences(prefs);
    }
  }, [prefs, isReady]);

  // Prayer Journal Logic
  const togglePrayerStatus = async (prayerId: string) => {
    const newJournal = { ...journal, [prayerId]: !journal[prayerId] };
    setJournal(newJournal);
    await db.saveJournalEntry(dateId, newJournal);
  };

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const showNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const handleAzanTrigger = useCallback(() => {
    const { mode, selectedSoundId, pitch } = prefs.azan;
    if (mode === 'sound') {
      const sound = AZAN_SOUNDS.find(s => s.id === selectedSoundId) || AZAN_SOUNDS[0];
      const audio = new Audio(sound.url);
      audio.playbackRate = pitch || 1.0;
      audio.play().catch(e => console.error("Audio playback failed:", e));
    } else if (mode === 'vibrate') {
      if ("vibrate" in navigator) {
        navigator.vibrate([1000, 500, 1000]);
      }
    }
  }, [prefs.azan]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const times = computePrayerTimes(now, prefs.coordinates, prefs.method, prefs.madhab, prefs.adjustments);
      const t = TRANSLATIONS[prefs.language];

      const checkEvents = (prayerId: keyof typeof prefs.azan.enabled, prayerTimeStr: string) => {
        if (lastPlayedTime.current !== timeStr && prefs.azan.enabled[prayerId] && prayerTimeStr === timeStr) {
          handleAzanTrigger();
          lastPlayedTime.current = timeStr;
          showNotification(t[prayerId], t.current);
        }

        const [pTime, pModifier] = prayerTimeStr.split(' ');
        let [pHours, pMins] = pTime.split(':').map(Number);
        if (pModifier === 'PM' && pHours < 12) pHours += 12;
        if (pModifier === 'AM' && pHours === 12) pHours = 0;
        const prayerMinutes = pHours * 60 + pMins;
        
        const reminderMinutes = prayerMinutes - prefs.reminders.offsetMinutes;
        const eventId = `${String(prayerId)}-${now.toDateString()}`;
        
        if (lastNotifiedTime.current !== eventId && prefs.reminders.enabled[prayerId] && currentMinutes === reminderMinutes) {
          showNotification(t[prayerId], t.reminderMsg.replace('{time}', prefs.reminders.offsetMinutes.toString()));
          lastNotifiedTime.current = eventId;
        }
      };

      checkEvents('fajr', times.fajr);
      checkEvents('dhuhr', times.dhuhr);
      checkEvents('asr', times.asr);
      checkEvents('maghrib', times.maghrib);
      checkEvents('isha', times.isha);

    }, 1000);
    return () => clearInterval(timer);
  }, [prefs, handleAzanTrigger]);

  const prayerTimes = useMemo(() => {
    return computePrayerTimes(currentTime, prefs.coordinates, prefs.method, prefs.madhab, prefs.adjustments);
  }, [currentTime, prefs.coordinates, prefs.method, prefs.madhab, prefs.adjustments]);

  const t = TRANSLATIONS[prefs.language];
  const hijri = useMemo(() => getHijriDate(currentTime, prefs.hijriOffset), [currentTime, prefs.hijriOffset]);
  const qiblaAngle = useMemo(() => calculateQibla(prefs.coordinates), [prefs.coordinates]);

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPrefs(prev => ({
          ...prev,
          coordinates: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          locationName: 'Detected Location'
        }));
      }, (err) => {
        alert("Permission denied or location unavailable.");
      });
    }
  };

  if (!isReady) return <div className="min-h-screen flex items-center justify-center bg-stone-50"><i className="fa-solid fa-spinner fa-spin text-emerald-600 text-3xl"></i></div>;

  return (
    <div className={`min-h-screen flex flex-col ${prefs.isDarkMode ? 'bg-slate-900 text-white' : 'bg-stone-50 text-slate-900'}`}>
      <main className="flex-1 pb-24 overflow-y-auto">
        <Header prefs={prefs} t={t} hijri={hijri} currentTime={currentTime} />
        <div className="px-4 max-w-lg mx-auto w-full mt-4">
          {activeTab === 'home' && (
            <PrayerList 
              prayerTimes={prayerTimes} 
              t={t} 
              prefs={prefs} 
              currentTime={currentTime}
              journal={journal}
              onToggleJournal={togglePrayerStatus}
            />
          )}
          {activeTab === 'qibla' && <Compass qiblaAngle={qiblaAngle} t={t} prefs={prefs} />}
          {activeTab === 'calendar' && <Calendar prefs={prefs} t={t} currentTime={currentTime} />}
          {activeTab === 'settings' && (
            <Settings 
              prefs={prefs} 
              setPrefs={setPrefs} 
              t={t} 
              handleDetectLocation={handleDetectLocation} 
              onTestAzan={handleAzanTrigger} 
            />
          )}
        </div>
      </main>

      <nav className={`fixed bottom-0 left-0 right-0 border-t ${prefs.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-100 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]'} px-4 py-4 flex justify-around items-center z-50`}>
        {[
          { id: 'home', icon: 'fa-mosque' },
          { id: 'qibla', icon: 'fa-compass' },
          { id: 'calendar', icon: 'fa-calendar-days' },
          { id: 'settings', icon: 'fa-gear' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === tab.id ? 'text-emerald-600 scale-110' : 'text-slate-400'}`}
          >
            <i className={`fa-solid ${tab.icon} text-lg`}></i>
            <span className="text-[10px] font-bold uppercase tracking-widest">{t[tab.id === 'home' ? 'current' : tab.id]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
