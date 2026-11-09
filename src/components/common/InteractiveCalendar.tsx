import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Sparkles } from 'lucide-react';

interface InteractiveCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  blockedDates?: string[]; // dates that are blocked by doctor
  highlightSaturdays?: boolean;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
  blockedDates = [],
  highlightSaturdays = true,
}) => {
  // Current viewed month/year
  const initialDateObj = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(initialDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDateObj.getMonth()); // 0-11

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : today;
  const maxDateObj = maxDate ? new Date(maxDate + 'T23:59:59') : (() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d;
  })();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  const dayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build grid days
  // First day of month (0 = Sun, 1 = Mon ... 6 = Sat)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Convert to Mon=0 ... Sun=6
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Helper for formatting YYYY-MM-DD
  const formatIsoDate = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Quick jump presets
  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    // If target is Sunday, move to Monday
    if (target.getDay() === 0) {
      target.setDate(target.getDate() + 1);
    }
    const iso = formatIsoDate(target.getFullYear(), target.getMonth(), target.getDate());
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onSelectDate(iso);
  };

  const handleNextSaturday = () => {
    const target = new Date();
    const day = target.getDay();
    const diff = (6 - day + 7) % 7 || 7; // Next Saturday
    target.setDate(target.getDate() + diff);
    const iso = formatIsoDate(target.getFullYear(), target.getMonth(), target.getDate());
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onSelectDate(iso);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Quick Jump Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5 text-[#244A86]" />
          Acceso rápido:
        </span>
        <button
          type="button"
          onClick={() => handleQuickPreset(1)}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#244A86] border border-slate-200/60 text-slate-700 transition-colors"
        >
          Mañana
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset(3)}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-[#244A86] border border-slate-200/60 text-slate-700 transition-colors"
        >
          En 3 días
        </button>
        <button
          type="button"
          onClick={handleNextSaturday}
          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors flex items-center gap-1"
        >
          <span>Próx. Sábado</span>
          <span className="text-[10px] font-mono opacity-80">(Anexo)</span>
        </button>
      </div>

      {/* Header Month / Year Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <h4 className="font-bold text-slate-900 text-sm capitalize">
            {monthNames[viewMonth]} {viewYear}
          </h4>
          <span className="text-[11px] text-slate-500">
            Reserva disponible de 2 horas a 60 días antes
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day of Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((d, i) => (
          <div
            key={d}
            className={`text-[11px] font-bold py-1 ${
              i === 5 ? 'text-amber-800' : i === 6 ? 'text-rose-500' : 'text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading blank slots */}
        {Array.from({ length: startDayOfWeek }).map((_, idx) => (
          <div key={`blank-${idx}`} className="h-9 sm:h-10" />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNumber = idx + 1;
          const isoDate = formatIsoDate(viewYear, viewMonth, dayNumber);
          const dateObj = new Date(viewYear, viewMonth, dayNumber);
          dateObj.setHours(12, 0, 0, 0);

          const dayOfWeek = dateObj.getDay(); // 0 = Sun, 6 = Sat
          const isSunday = dayOfWeek === 0;
          const isSaturday = dayOfWeek === 6;

          const isPast = dateObj < minDateObj;
          const isTooFar = dateObj > maxDateObj;
          const isBlocked = blockedDates.includes(isoDate);
          const isDisabled = isPast || isTooFar || isSunday || isBlocked;

          const isSelected = selectedDate === isoDate;
          const isToday =
            today.getDate() === dayNumber &&
            today.getMonth() === viewMonth &&
            today.getFullYear() === viewYear;

          return (
            <button
              key={isoDate}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(isoDate)}
              className={`h-9 sm:h-10 rounded-xl text-xs font-semibold relative flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? 'bg-[#244A86] text-white shadow-md ring-2 ring-blue-300 scale-102 z-10'
                  : isDisabled
                  ? 'bg-slate-50/70 text-slate-300 cursor-not-allowed'
                  : isSaturday && highlightSaturdays
                  ? 'bg-amber-50/60 text-amber-900 border border-amber-200/70 hover:bg-amber-100 hover:border-amber-300'
                  : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-100 hover:border-blue-200'
              }`}
              title={
                isSunday
                  ? 'Domingo: Clínica cerrada'
                  : isBlocked
                  ? 'Fecha bloqueada por el profesional'
                  : isSaturday
                  ? 'Sábado: Edificio Anexo de 12:00 p. m. a 5:00 p. m.'
                  : `${dayNumber} de ${monthNames[viewMonth]}`
              }
            >
              <span>{dayNumber}</span>

              {/* Badges / Dots */}
              {isToday && !isSelected && (
                <span className="w-1 h-1 rounded-full bg-[#244A86] mt-0.5" />
              )}
              {isSaturday && !isSelected && !isDisabled && (
                <span className="text-[9px] font-bold text-amber-700 leading-none -mt-0.5">
                  Anexo
                </span>
              )}
              {isBlocked && (
                <span className="text-[8px] text-rose-500 font-bold -mt-0.5">
                  Bloq
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Date Summary & Legend */}
      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#244A86]" />
            <span>Seleccionado</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300" />
            <span>Sábado Anexo</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-100" />
            <span>Cerrado</span>
          </div>
        </div>

        {selectedDate && (
          <div className="font-semibold text-[#244A86] bg-blue-50 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-SV', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}
      </div>
    </div>
  );
};
