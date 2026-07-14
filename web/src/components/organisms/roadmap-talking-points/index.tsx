import { iconMap } from '@/components/atoms/icon/icon-map';
import type { RoadmapTalkingPoint } from '@/services/applications/types';

const PointIcon = iconMap['arrow-right'];

interface RoadmapTalkingPointsProps {
  points: RoadmapTalkingPoint[];
}

/**
 * "Bring these to your interview" — forward-looking talking points built from
 * the offer's missions, each paired with the candidate's CV-grounded angle.
 * Distinct from the gap timeline: this is what you'd *do* in the role and how
 * you'd approach it, framed as points to raise in the interview.
 *
 * Renders nothing when there are no points (offer without missions, or a
 * roadmap cached before this field existed), so callers can mount it
 * unconditionally. Token-only styling; theme-flips with the palette.
 */
export const RoadmapTalkingPoints = ({ points }: RoadmapTalkingPointsProps) => {
  if (points.length === 0) return null;

  return (
    <section
      aria-labelledby="talking-points-heading"
      className="flex flex-col gap-3"
    >
      <div>
        <h2 id="talking-points-heading" className="text-h5 text-text">
          Bring these to your interview
        </h2>
        <p className="text-body-s text-text-weak mt-1">
          Talking points from the role's responsibilities, matched to your
          experience.
        </p>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {points.map((point, index) => (
          <li
            key={`${index}-${point.mission}`}
            className="bg-surface-raised border-border flex flex-col gap-1.5 rounded-2xl border p-4"
          >
            <div className="flex items-start gap-2">
              <PointIcon
                size={16}
                aria-hidden="true"
                className="text-accent mt-0.5 shrink-0"
              />
              <h3 className="text-h6 text-text">{point.mission}</h3>
            </div>
            <p className="text-body-s text-text-weak">{point.angle}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default RoadmapTalkingPoints;
