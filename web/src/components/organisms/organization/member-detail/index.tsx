import type { OrganizationMemberDetail } from '@/services/organization/types';

const formatDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString() : '—';

/** F14: profile basics + stats + recent interviews for one member. */
export const MemberDetail = ({
  detail,
  isLoading,
}: {
  detail: OrganizationMemberDetail | undefined;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return <p className="text-body-m text-text-weaker">Loading member…</p>;
  }
  if (!detail) {
    return (
      <p className="text-body-m text-text-weaker">
        Select a member to see their activity.
      </p>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
      <header>
        <h3 className="text-h4 text-text">{detail.username}</h3>
        <p className="text-body-s text-text-weaker">
          {detail.user_role}
          {detail.email ? ` · ${detail.email}` : ''}
        </p>
      </header>
      <dl className="grid grid-cols-2 gap-3 text-body-s">
        <div>
          <dt className="text-text-weaker">Interviews</dt>
          <dd className="text-h5 text-text">{detail.stats.interviewCount}</dd>
        </div>
        <div>
          <dt className="text-text-weaker">Completed</dt>
          <dd className="text-h5 text-text">{detail.stats.completedCount}</dd>
        </div>
        <div>
          <dt className="text-text-weaker">Average score</dt>
          <dd className="text-h5 text-text">{detail.stats.avgScore ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-text-weaker">Last activity</dt>
          <dd className="text-h5 text-text">
            {formatDateTime(detail.stats.lastActivityAt)}
          </dd>
        </div>
      </dl>
      <section className="flex flex-col gap-2">
        <h4 className="text-body-s-strong text-text">Recent interviews</h4>
        {detail.recentInterviews.length === 0 ? (
          <p className="text-body-s text-text-weaker">No interviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-body-s">
            {detail.recentInterviews.map((iv) => (
              <li
                key={iv.interview_id}
                className="flex items-center justify-between border-t border-border py-1"
              >
                <span className="text-text">{iv.type}</span>
                <span className="text-text-weaker">{iv.status}</span>
                <span className="text-text">{iv.score ?? '—'}</span>
                <span className="text-text-weaker">
                  {formatDateTime(iv.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
};

export default MemberDetail;
