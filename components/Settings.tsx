
import React from 'react';
import { UserPreferences, Language, CalculationMethod, Madhab, AzanNotificationMode } from '../types';
import { METHOD_NAMES, AZAN_SOUNDS } from '../constants';

interface SettingsProps {
  prefs: UserPreferences;
  setPrefs: React.Dispatch<React.SetStateAction<UserPreferences>>;
  t: any;
  handleDetectLocation: () => void;
  onTestAzan: () => void;
}

const Settings: React.FC<SettingsProps> = ({ prefs, setPrefs, t, handleDetectLocation, onTestAzan }) => {
  const updatePref = (key: keyof UserPreferences, value: any) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const updateAzanToggle = (prayerId: keyof typeof prefs.azan.enabled) => {
    setPrefs(prev => ({
      ...prev,
      azan: {
        ...prev.azan,
        enabled: {
          ...prev.azan.enabled,
          [prayerId]: !prev.azan.enabled[prayerId]
        }
      }
    }));
  };

  const updateAzanMode = (mode: AzanNotificationMode) => {
    setPrefs(prev => ({
      ...prev,
      azan: {
        ...prev.azan,
        mode
      }
    }));
  };

  const updateReminderToggle = (prayerId: keyof typeof prefs.reminders.enabled) => {
    setPrefs(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        enabled: {
          ...prev.reminders.enabled,
          [prayerId]: !prev.reminders.enabled[prayerId]
        }
      }
    }));
  };

  const selectAzanSound = (soundId: string) => {
    setPrefs(prev => ({
      ...prev,
      azan: {
        ...prev.azan,
        selectedSoundId: soundId
      }
    }));
  };

  const updateAzanPitch = (pitch: number) => {
    setPrefs(prev => ({
      ...prev,
      azan: {
        ...prev.azan,
        pitch: pitch
      }
    }));
  };

  const updateAdjustment = (prayer: keyof typeof prefs.adjustments, delta: number) => {
    setPrefs(prev => ({
      ...prev,
      adjustments: {
        ...prev.adjustments,
        [prayer]: prev.adjustments[prayer] + delta
      }
    }));
  };

  const previewSound = (url: string) => {
    const audio = new Audio(url);
    audio.playbackRate = prefs.azan.pitch || 1.0;
    audio.play().catch(e => console.error("Preview failed:", e));
  };

  const isRtl = prefs.language === Language.ARABIC;

  const PRAYER_IDS: (keyof typeof prefs.azan.enabled)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const ADJUSTMENT_IDS: (keyof typeof prefs.adjustments)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div className="space-y-6 py-6 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Theme Toggle */}
      <div className={`p-4 rounded-2xl flex items-center justify-between ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}>
        <div className="flex items-center gap-3">
          <i className="fa-solid fa-moon text-emerald-600 text-lg"></i>
          <span className="font-semibold">Dark Mode</span>
        </div>
        <button 
          onClick={() => updatePref('isDarkMode', !prefs.isDarkMode)}
          className={`w-14 h-7 rounded-full transition-colors relative ${prefs.isDarkMode ? 'bg-emerald-600' : 'bg-slate-200'}`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${prefs.isDarkMode ? 'translate-x-8' : 'translate-x-1'}`}></div>
        </button>
      </div>

      {/* Hijri Adjustment */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">Hijri Adjustment</h3>
        <div className={`p-4 rounded-2xl flex items-center justify-between ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}>
          <div className="flex items-center gap-3">
             <i className="fa-solid fa-calendar-days text-emerald-600 text-lg"></i>
             <span className="text-sm font-semibold">Day Correction</span>
          </div>
          <div className="flex items-center gap-4">
             <button 
                onClick={() => updatePref('hijriOffset', prefs.hijriOffset - 1)}
                className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all shadow-sm"
             >
                <i className="fa-solid fa-minus"></i>
             </button>
             <span className="w-8 text-center font-bold text-xl">{prefs.hijriOffset > 0 ? `+${prefs.hijriOffset}` : prefs.hijriOffset}</span>
             <button 
                onClick={() => updatePref('hijriOffset', prefs.hijriOffset + 1)}
                className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all shadow-sm"
             >
                <i className="fa-solid fa-plus"></i>
             </button>
          </div>
        </div>
      </section>

      {/* Manual Adjustments */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.adjust}</h3>
        <div className={`p-4 rounded-2xl space-y-4 ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}>
          {ADJUSTMENT_IDS.map((prayer) => (
            <div key={prayer} className="flex items-center justify-between">
              <span className="text-base font-semibold capitalize">{t[prayer] || prayer}</span>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateAdjustment(prayer, -1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <span className="w-12 text-center font-mono font-bold text-base">
                  {prefs.adjustments[prayer] > 0 ? `+${prefs.adjustments[prayer]}` : prefs.adjustments[prayer]}m
                </span>
                <button 
                  onClick={() => updateAdjustment(prayer, 1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-emerald-100 active:scale-90 transition-all shadow-sm"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Azan Settings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.azanSettings}</h3>
        <div className={`p-5 rounded-3xl space-y-6 ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}>
          
          {/* Notification Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wide px-1">{t.notificationMode}</label>
            <div className={`flex p-1 rounded-2xl ${prefs.isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              {(['sound', 'vibrate', 'silent'] as AzanNotificationMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => updateAzanMode(m)}
                  className={`flex-1 py-3 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                    prefs.azan.mode === m 
                      ? 'bg-emerald-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <i className={`fa-solid ${m === 'sound' ? 'fa-volume-high' : m === 'vibrate' ? 'fa-vibration' : 'fa-bell-slash'}`}></i>
                  <span className="hidden sm:inline">{t[`mode${m.charAt(0).toUpperCase() + m.slice(1)}`]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Toggles - Elder friendly large buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PRAYER_IDS.map((p) => (
              <button
                key={p}
                onClick={() => updateAzanToggle(p)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                  prefs.azan.enabled[p]
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-200/50'
                    : prefs.isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}
              >
                <i className={`fa-solid ${prefs.azan.enabled[p] ? 'fa-bell' : 'fa-bell-slash'} text-xl`}></i>
                <div className="flex flex-col items-start">
                  <span className="text-xs uppercase font-bold opacity-70 tracking-tighter">Azan Notification</span>
                  <span className="text-base font-bold capitalize">{t[p]}</span>
                </div>
              </button>
            ))}
          </div>
          
          {prefs.azan.mode === 'sound' && (
            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="text-sm font-bold text-slate-400 mb-3 block uppercase tracking-wide">{t.azanSound}</label>
                <div className="grid grid-cols-1 gap-3">
                  {AZAN_SOUNDS.map(sound => {
                    const isSelected = prefs.azan.selectedSoundId === sound.id;
                    return (
                      <div 
                        key={sound.id}
                        onClick={() => selectAzanSound(sound.id)}
                        className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500' 
                            : prefs.isDarkMode ? 'border-slate-700 bg-slate-700/50' : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${isSelected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
                          <span className={`text-base font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>{sound.name}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            previewSound(sound.url);
                          }}
                          className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all shadow-md"
                        >
                          <i className="fa-solid fa-play text-sm"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">{t.azanPitch}</label>
                  <span className="text-lg font-mono text-emerald-600 font-extrabold">{prefs.azan.pitch.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="1.5" 
                  step="0.1" 
                  value={prefs.azan.pitch} 
                  onChange={(e) => updateAzanPitch(parseFloat(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-2 uppercase font-extrabold px-1 tracking-tight">
                  <span>Slow / Deep</span>
                  <span>Normal</span>
                  <span>Fast / Sharp</span>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={onTestAzan}
            className={`w-full p-4 rounded-2xl border-2 border-dashed font-bold transition-all ${
              prefs.isDarkMode ? 'border-slate-700 text-slate-400 hover:bg-slate-700/30' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-vial mr-2"></i>
            {t.testAzan}
          </button>
        </div>
      </section>

      {/* Reminder Settings */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.reminders}</h3>
        <div className={`p-4 rounded-2xl space-y-6 ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PRAYER_IDS.map((p) => (
              <button
                key={p}
                onClick={() => updateReminderToggle(p)}
                className={`flex items-center gap-3 p-4 rounded-2xl transition-all border ${
                  prefs.reminders.enabled[p]
                    ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-200/50'
                    : prefs.isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'
                }`}
              >
                <i className={`fa-solid ${prefs.reminders.enabled[p] ? 'fa-clock' : 'fa-clock-rotate-left'} text-xl`}></i>
                <div className="flex flex-col items-start">
                  <span className="text-xs uppercase font-bold opacity-70 tracking-tighter">Reminder</span>
                  <span className="text-base font-bold capitalize">{t[p]}</span>
                </div>
              </button>
            ))}
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-400 mb-2 block uppercase tracking-wide">{t.reminderTime}</label>
            <div className="flex gap-3">
              {[5, 10, 15, 30].map(minutes => (
                <button
                  key={minutes}
                  onClick={() => setPrefs(prev => ({ ...prev, reminders: { ...prev.reminders, offsetMinutes: minutes } }))}
                  className={`flex-1 p-3 rounded-xl border text-base font-bold transition-all shadow-sm ${
                    prefs.reminders.offsetMinutes === minutes
                      ? 'bg-amber-100 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                      : prefs.isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  {minutes}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Language */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.language}</h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(Language).map((lang) => (
            <button
              key={lang}
              onClick={() => updatePref('language', lang)}
              className={`p-4 rounded-2xl border text-base font-bold transition-all shadow-sm ${
                prefs.language === lang 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200/50' 
                  : prefs.isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      {/* Calculation Method */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.method}</h3>
        <div className="relative">
          <select 
            value={prefs.method}
            onChange={(e) => updatePref('method', e.target.value)}
            className={`w-full p-5 rounded-2xl border appearance-none font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/20 ${
              prefs.isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'
            }`}
          >
            {Object.entries(METHOD_NAMES).map(([key, name]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
          <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-slate-400`}>
            <i className="fa-solid fa-chevron-down"></i>
          </div>
        </div>
      </section>

      {/* Asr Madhab */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.madhab}</h3>
        <div className="flex gap-3">
          {[Madhab.SHAFI, Madhab.HANAFI].map((m) => (
            <button
              key={m}
              onClick={() => updatePref('madhab', m)}
              className={`flex-1 p-4 rounded-2xl border text-base font-bold transition-all shadow-sm ${
                prefs.madhab === m 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200/50' 
                  : prefs.isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              {m === Madhab.SHAFI ? t.shafi : t.hanafi}
            </button>
          ))}
        </div>
      </section>

      {/* Location Detection */}
      <section>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 px-2">{t.location}</h3>
        <button 
          onClick={handleDetectLocation}
          className="w-full p-5 rounded-2xl bg-emerald-600 text-white font-extrabold text-lg flex items-center justify-center gap-4 active:scale-95 transition-transform shadow-xl shadow-emerald-200/50"
        >
          <i className="fa-solid fa-location-crosshairs"></i>
          {t.detectLocation}
        </button>
        <div className="mt-4 p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col items-center">
           <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Current Coordinates</span>
           <span className="text-sm text-slate-600 dark:text-slate-400 font-mono font-bold">{prefs.coordinates.latitude.toFixed(4)}, {prefs.coordinates.longitude.toFixed(4)}</span>
        </div>
        <p className="text-xs text-center mt-6 text-slate-400 italic px-4 leading-relaxed">
          {t.privacyNote}
        </p>
      </section>
    </div>
  );
};

export default Settings;
