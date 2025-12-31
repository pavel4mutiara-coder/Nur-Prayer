
import React, { useState, useEffect, useMemo } from 'react';
import { UserPreferences, Language } from '../types';
import { calculateDistance } from '../utils/astronomy';
import { MAKKAH_COORDS } from '../constants';

interface CompassProps {
  qiblaAngle: number;
  t: any;
  prefs: UserPreferences;
}

const Compass: React.FC<CompassProps> = ({ qiblaAngle, t, prefs }) => {
  const [heading, setHeading] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading if available (iOS), otherwise alpha
      const currentHeading = (e as any).webkitCompassHeading || (360 - (e.alpha || 0));
      setHeading(currentHeading);
      setIsSupported(true);
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  const relativeQibla = (qiblaAngle - heading + 360) % 360;

  const distance = useMemo(() => {
    return calculateDistance(prefs.coordinates, { 
      latitude: MAKKAH_COORDS.lat, 
      longitude: MAKKAH_COORDS.lon 
    });
  }, [prefs.coordinates]);

  return (
    <div className="flex flex-col items-center py-8">
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Outer Ring */}
        <div className={`absolute inset-0 rounded-full border-4 ${prefs.isDarkMode ? 'border-slate-700' : 'border-emerald-100'}`}></div>
        
        {/* Cardinal Points */}
        <div className="absolute top-2 font-bold text-slate-400">N</div>
        <div className="absolute bottom-2 font-bold text-slate-400">S</div>
        <div className="absolute right-2 font-bold text-slate-400">E</div>
        <div className="absolute left-2 font-bold text-slate-400">W</div>

        {/* Compass Face */}
        <div 
          className="relative w-64 h-64 rounded-full flex items-center justify-center compass-arrow"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Degree Markers */}
          {[...Array(36)].map((_, i) => (
            <div 
              key={i} 
              className="absolute w-1 h-2 bg-slate-300"
              style={{ transform: `rotate(${i * 10}deg) translateY(-120px)` }}
            ></div>
          ))}

          {/* Qibla Marker (Kaaba) */}
          <div 
            className="absolute z-20"
            style={{ transform: `rotate(${qiblaAngle}deg) translateY(-110px)` }}
          >
             <div className="bg-emerald-600 text-white p-2 rounded-full shadow-lg">
                <i className="fa-solid fa-kaaba"></i>
             </div>
          </div>
        </div>

        {/* Pointer */}
        <div 
          className="absolute z-30 flex flex-col items-center pointer-events-none transition-transform duration-200"
          style={{ transform: `rotate(${relativeQibla}deg)` }}
        >
          <div className="w-1 h-24 bg-emerald-500 rounded-full shadow-lg relative">
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-emerald-500 rotate-45 rounded-sm"></div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <div className="text-4xl font-bold text-emerald-600 mb-2">{Math.round(qiblaAngle)}°</div>
        
        <div className={`mt-2 mb-4 px-4 py-2 rounded-xl border ${prefs.isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t.distanceToMakkah}</div>
          <div className={`text-lg font-bold ${prefs.isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
            {distance.toLocaleString(undefined, { maximumFractionDigits: 0 })} km
          </div>
        </div>

        <p className="text-slate-500 text-sm max-w-xs">{t.calibration}</p>
        
        {!isSupported && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-700 text-xs rounded-lg border border-amber-100 flex items-center gap-2">
            <i className="fa-solid fa-circle-info"></i>
            Sensors not detected. Using visual coordinates only.
          </div>
        )}
      </div>
    </div>
  );
};

export default Compass;
