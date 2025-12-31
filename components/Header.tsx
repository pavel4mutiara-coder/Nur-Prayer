
import React from 'react';
import { UserPreferences, Language } from '../types';

interface HeaderProps {
  prefs: UserPreferences;
  t: any;
  hijri: { day: number, month: string, year: number };
  currentTime: Date;
}

const Header: React.FC<HeaderProps> = ({ prefs, t, hijri, currentTime }) => {
  const isRtl = prefs.language === Language.ARABIC;

  return (
    <div className={`relative overflow-hidden pt-12 pb-10 px-6 text-white ${prefs.isDarkMode ? 'bg-emerald-950' : 'bg-emerald-800'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Decorative SVG Pattern */}
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none translate-x-1/4 -translate-y-1/4">
        <svg width="300" height="300" viewBox="0 0 100 100">
           <path d="M50 0 L100 50 L50 100 L0 50 Z" fill="currentColor" />
           <circle cx="50" cy="50" r="40" stroke="currentColor" fill="none" strokeWidth="2" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-2xl font-bold mb-1 arabic-text tracking-wider opacity-90">
          {isRtl ? 'بسم الله الرحمن الرحيم' : 'Nur Prayer'}
        </h1>
        <div className="flex items-center gap-2 text-emerald-100 opacity-80 mb-6">
          <i className="fa-solid fa-location-dot text-xs"></i>
          <span className="text-xs font-medium uppercase tracking-widest">{prefs.locationName}</span>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 w-full max-w-sm border border-white/20 shadow-2xl">
          <div className="text-5xl font-light mb-4 tracking-tighter">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
            <span className="text-xl ml-1 opacity-60 font-medium">
               {currentTime.toLocaleTimeString([], { second: '2-digit' })}
            </span>
          </div>
          
          <div className="inline-flex items-center bg-white/20 px-4 py-1.5 rounded-full mb-3 border border-white/10">
            <i className="fa-solid fa-moon text-[10px] mr-2 text-emerald-300"></i>
            <span className="text-sm font-bold tracking-wide">
              {hijri.day} {hijri.month} {hijri.year} AH
            </span>
          </div>

          <div className="text-xs uppercase tracking-[0.2em] opacity-70 font-bold">
            {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
