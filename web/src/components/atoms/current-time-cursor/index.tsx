/**
 * CurrentTimeCursor component.
 * Displays a red line to indicate the current time on the calendar.
 * Its position is determined by the parent component.
 */
const CurrentTimeCursor = () => {
  return (
    <div
      className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
      style={{
        top: 'calc(50% - 2px)',
      }}
    >
      {/* Le point rouge sur le côté gauche */}
      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500 border border-white"></div>
    </div>
  );
};

export default CurrentTimeCursor;
