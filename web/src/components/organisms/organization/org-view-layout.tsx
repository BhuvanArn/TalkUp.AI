import { Avatar } from '@/components/atoms/avatar';
import { useGetMyOrganization } from '@/hooks/organization/useServices';
import { ReactNode } from 'react';

/** Up to two initials from the org name, e.g. "Acme Corp" -> "AC". */
const orgInitials = (name: string) =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

/**
 * Shared shell for the organization-view sub-routes (members / invites /
 * settings). Owns the org fetch, the loading / not-affiliated states, and the
 * restrained org-view chrome (a token-based header strip that echoes the
 * shifted sidebar surface). Each sub-route renders its panel as children; the
 * `['organization', ...]` query cache is shared, so re-fetching per route is
 * effectively free.
 */
export function OrgViewLayout({ children }: { children: ReactNode }) {
  const { data: org, isLoading, isError } = useGetMyOrganization();

  if (isLoading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-body-m text-text-weaker">Loading organization…</p>
      </main>
    );
  }

  // A failed fetch is not the same as having no org — an affiliated manager
  // hitting a transient error must not be told they're unaffiliated.
  if (isError) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-body-m text-error">
          Couldn&apos;t load your organization. Please try again in a moment.
        </p>
      </main>
    );
  }

  if (!org) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-body-m text-text-weaker">
          You are not affiliated with an organization.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <header className="flex items-center gap-3 border-b border-border pb-4">
          <Avatar
            src={org.profile_picture ?? undefined}
            alt={`${org.organization_name} logo`}
            fallback={orgInitials(org.organization_name)}
            size="md"
            className="shrink-0 border border-border bg-accent-weak text-accent"
          />
          <div className="flex flex-col">
            <span className="text-label-s text-accent">Organization</span>
            <h2 className="text-h3 text-text">{org.organization_name}</h2>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export default OrgViewLayout;
