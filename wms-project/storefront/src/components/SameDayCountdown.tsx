import React, { useState, useEffect } from 'react';
import { Truck, Clock } from 'lucide-react';

export default function SameDayCountdown() {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isToday: true });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutOffHour = 16; // Same-day shipping cut-off at 16:00 (4:00 PM)
      
      let targetDate = new Date();
      targetDate.setHours(cutOffHour, 0, 0, 0);

      let isToday = true;
      if (now.getHours() >= cutOffHour) {
        // Cut-off passed for today, target is 16:00 tomorrow
        targetDate.setDate(targetDate.getDate() + 1);
        isToday = false;
      }

      const diffMs = targetDate.getTime() - now.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isToday });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 p-3.5 flex items-center justify-between text-[11px] font-mono select-none">
      <div className="flex items-center gap-2">
        <Truck className="w-4 h-4 text-amber-500 animate-pulse" />
        <div className="space-y-0.5 text-left">
          <span className="font-bold text-zinc-200 block">
            {timeLeft.isToday ? 'Wysyłka dzisiaj!' : 'Wysyłka jutro!'}
          </span>
          <span className="text-[10px] text-zinc-500 block">
            Gwarantowane nadanie paczki
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 border border-zinc-800">
        <Clock className="w-3.5 h-3.5 text-zinc-500" />
        <span className="font-bold text-white tracking-wide font-mono">
          {formatNumber(timeLeft.hours)}h {formatNumber(timeLeft.minutes)}m {formatNumber(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  );
}
