
import React, { useState, useMemo, useEffect } from 'react';
import { UserPreferences, Language } from '../types';
import { HIJRI_MONTHS, ISLAMIC_EVENTS } from '../constants';
import { getHijriDate, hijriToGregorian } from '../utils/astronomy';
import { db } from '../services/db';

interface CalendarProps {
  prefs: UserPreferences;
  t: any;
  currentTime: Date;
}

const Calendar: React.FC<CalendarProps> = ({ prefs, t, currentTime }) => {
  const isRtl = prefs.language === Language.ARABIC;
  const currentHijri = useMemo(() => getHijriDate(currentTime, prefs.hijriOffset), [currentTime, prefs.hijriOffset]);
  
  const [viewMonth, setViewMonth] = useState(currentHijri.monthIndex);
  const [viewYear, setViewYear] = useState(currentHijri.year);
  const [history, setHistory] = useState<Record<string, Record<string, boolean>>>({});

  // ডাটাবেজ থেকে সব ইতিহাস লোড করা
  useEffect(() => {
    const loadHistory = async () => {
      const data = await db.getAllJournalEntries();
      setHistory(data);
    };
    loadHistory();
  }, [currentTime]);

  const daysInMonth = useMemo(() => {
    const isLeap = (11 * viewYear + 14) % 30 < 11;
    if (viewMonth === 12) return isLeap ? 30 : 29;
    return viewMonth % 2 === 1 ? 30 : 29;
  }, [viewMonth, viewYear]);

  const monthData = useMemo(() => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const gDate = hijriToGregorian(viewYear, viewMonth, i, prefs.hijriOffset);
      const dateId = gDate.toISOString().split('T')[0];
      const prayers = history[dateId] || {};
      const completedCount = Object.values(prayers).filter(Boolean).length;

      days.push({
        hDay: i,
        gDate: gDate,
        dateId,
        isToday: viewYear === currentHijri.year && viewMonth === currentHijri.monthIndex && i === currentHijri.day,
        events: ISLAMIC_EVENTS.filter(e => e.day === i && e.monthIndex === viewMonth),
        completedCount
      });
    }
    return days;
  }, [viewMonth, viewYear, currentHijri, daysInMonth, prefs.hijriOffset, history]);

  const handlePrev = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const handleNext = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const dayNames = isRtl 
    ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'স'] 
    : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const startDayOfWeek = monthData[0].gDate.getDay();

  return (
    <div className="py-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Month Selector */}
      <div className={`p-4 rounded-3xl flex items-center justify-between shadow-sm ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50'}`}>
        <button onClick={handlePrev} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-50 text-emerald-600 transition-colors">
          <i className={`fa-solid ${isRtl ? 'fa-chevron-right' : 'fa-chevron-left'}`}></i>
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-emerald-600">{HIJRI_MONTHS[viewMonth - 1]}</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{viewYear} AH</p>
        </div>
        <button onClick={handleNext} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-50 text-emerald-600 transition-colors">
          <i className={`fa-solid ${isRtl ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={`p-6 rounded-3xl shadow-sm ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50'}`}>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {dayNames.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10"></div>
          ))}
          {monthData.map(day => (
            <div 
              key={day.hDay} 
              className={`relative h-14 flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all ${
                day.isToday 
                  ? 'bg-emerald-600 text-white shadow-lg' 
                  : day.events.length > 0
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : prefs.isDarkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-emerald-50 text-slate-600'
              }`}
            >
              <span>{day.hDay}</span>
              <span className={`text-[8px] opacity-60 font-mono -mt-1 ${day.isToday ? 'text-white' : 'text-slate-400'}`}>
                {day.gDate.getDate()}
              </span>
              
              {/* সালাত আদায়ের প্রগ্রেস ডট */}
              <div className="flex gap-0.5 mt-1">
                {Array.from({ length: day.completedCount }).map((_, i) => (
                  <div key={i} className={`w-1 h-1 rounded-full ${day.isToday ? 'bg-white' : 'bg-emerald-500'}`}></div>
                ))}
              </div>

              {day.events.length > 0 && !day.isToday && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Events List */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center gap-2">
          <i className="fa-solid fa-star text-amber-500"></i>
          {t.holidays}
        </h3>
        <div className="space-y-3">
          {ISLAMIC_EVENTS.filter(e => e.monthIndex === viewMonth).map((event, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-amber-500 ${prefs.isDarkMode ? 'bg-slate-800' : 'bg-white border border-emerald-50 shadow-sm'}`}
            >
              <div className="flex flex-col">
                <span className="font-bold text-slate-700 dark:text-slate-200">{t[event.translationKey]}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {event.day} {HIJRI_MONTHS[event.monthIndex - 1]}
                </span>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                {hijriToGregorian(viewYear, event.monthIndex, event.day, prefs.hijriOffset).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Calendar;
