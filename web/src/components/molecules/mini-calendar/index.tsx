// NOUVEAUX IMPORTS
import { Icon } from '@/components/atoms/icon';
import { useCalendarStore } from '@/components/molecules/calendar-option-bar/useCalendarStore';
import { MiniCalendarDay, getMiniCalendarDays } from '@/utils/calendarUtils';
import { useMemo, useState } from 'react';

// NOUVEL IMPORT UTILS

// Les interfaces MiniCalendarDay et MiniCalendarProps sont maintenant dans calendarUtils.ts
// J'ai renommé MiniCalendarProps pour la clarté :

interface MiniCalendarViewProps {
  // Aucune prop externe n'est nécessaire car tout est géré via le store et l'état interne
}

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * MiniCalendar component.
 * Displays a small, monthly calendar view used in the sidebar.
 * Gère sa propre navigation mensuelle (displayDate) et interagit avec le store (currentDate).
 */
export const MiniCalendar = ({}: MiniCalendarViewProps) => {
  // État local pour le mois que le MiniCalendar affiche (indépendant du store)
  const [displayDate, setDisplayDate] = useState(new Date());

  // État global du store (pour la navigation vers la semaine de la date cliquée)
  const { setCurrentDate, currentDate } = useCalendarStore();

  // Générer les jours à chaque changement de mois (Memoized)
  const days: MiniCalendarDay[] = useMemo(
    () => getMiniCalendarDays(displayDate),
    [displayDate],
  );

  // Formatage de l'en-tête (Ex: "Novembre 2025")
  const monthYear = displayDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // --- Fonctions de Navigation ---
  const handlePrevMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setDisplayDate((prevDate) => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + 1);
      return newDate;
    });
  };

  // --- Fonction de Clic sur le Jour ---
  const handleDayClick = (day: MiniCalendarDay) => {
    // 1. Mise à jour de la semaine principale affichée dans le store
    setCurrentDate(day.fullDate);

    // 2. Optionnel: Si le jour cliqué est dans un autre mois, on met à jour l'affichage
    if (day.isGray) {
      setDisplayDate(day.fullDate);
    }
  };

  // Déterminer la date de début de la semaine actuellement sélectionnée dans le store
  const currentWeekStart = new Date(currentDate);
  currentWeekStart.setHours(0, 0, 0, 0); // Le store assure que c'est le lundi 00:00:00

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      {/* Month header and navigation */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-base font-semibold text-gray-800">
          {monthYear}
        </span>
        <div className="flex space-x-2">
          <button
            onClick={handlePrevMonth}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Previous month"
          >
            <Icon icon="arrow-left" size="sm" />
          </button>
          <button
            onClick={handleNextMonth}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Next month"
          >
            <Icon icon="arrow-right" size="sm" />
          </button>
        </div>
      </div>

      {/* Days of the week header */}
      <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
        {daysOfWeek.map((day) => (
          <span key={day} className="h-6 flex items-center justify-center">
            {day}
          </span>
        ))}
      </div>

      {/* Dates grid */}
      <div className="grid grid-cols-7 text-center text-sm">
        {days.map((day, index) => {
          // Logique pour déterminer si ce jour fait partie de la semaine sélectionnée dans le store
          const isSelectedDayInWeek = (day: MiniCalendarDay) => {
            if (day.isGray) return false;

            const dayTime = day.fullDate.getTime();
            const weekStart = currentWeekStart.getTime();
            const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000; // 7 jours plus tard

            return dayTime >= weekStart && dayTime < weekEnd;
          };

          const isCurrentWeek = isSelectedDayInWeek(day);

          return (
            <div key={index} className="h-8 flex items-center justify-center">
              <button
                onClick={() => handleDayClick(day)}
                className={`w-8 h-6 flex items-center justify-center rounded-lg transition duration-150 ease-in-out
                    ${day.isGray ? 'text-gray-400' : 'text-gray-800 cursor-pointer hover:bg-gray-100'} 
                    ${day.isToday ? 'bg-blue-600 text-white font-bold hover:bg-blue-700' : ''}
                    ${isCurrentWeek && !day.isToday ? 'bg-blue-100 text-blue-700 font-semibold border border-blue-300' : ''}
                  `}
                // On désactive la navigation pour les jours gris pour un comportement plus simple
                disabled={
                  day.isGray &&
                  day.fullDate.getMonth() !== displayDate.getMonth()
                }
              >
                {day.date}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;
