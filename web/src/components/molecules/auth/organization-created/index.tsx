import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { buildAdminUsername } from '@/utils/buildAdminUsername';
import { Link, useNavigate } from '@tanstack/react-router';

type OrganizationCreatedProps = {
  organizationName: string;
  email: string;
};

/**
 * F12: post-signup acknowledgement for self-serve organization creation.
 * Confirms the org was created, surfaces the generated admin username, and
 * directs the user to verify the admin email before they can manage the org.
 * The admin username is derived from the organization name because the
 * signup endpoint returns no body data (202 + verification mail only); the
 * derivation mirrors the backend's `buildAdminUsername` exactly (strip
 * non-alphanumerics, append an `admin` suffix, clamp to 20 chars) so the
 * page shows the real, loginable username rather than a lookalike.
 */
export const OrganizationCreated = ({
  organizationName,
  email,
}: OrganizationCreatedProps) => {
  const navigate = useNavigate();

  const orgNameTrimmed = organizationName.trim();
  const emailTrimmed = email.trim();
  const hasContext = orgNameTrimmed.length > 0 && emailTrimmed.length > 0;
  const adminUsername = orgNameTrimmed
    ? buildAdminUsername(orgNameTrimmed)
    : '';

  if (!hasContext) {
    return (
      <div className="flex flex-col w-full gap-4 max-w-96">
        <header className="flex flex-col gap-1 items-start">
          <h2 className="text-h3 text-idle">Organization created</h2>
          <p className="text-body-l text-idle">
            Your organization was created. To manage it, verify the admin email
            and sign in.
          </p>
        </header>
        <Link
          to="/login"
          className="underline text-label-m text-idle hover:text-active cursor-pointer"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-5 max-w-96">
      <header className="flex flex-col gap-1 items-start">
        <h2 className="text-h3 text-idle">Organization created</h2>
        <p className="text-body-l text-idle">
          <span className="font-medium text-active">{orgNameTrimmed}</span> is
          ready. We&apos;ve created an administrator account for it.
        </p>
      </header>

      <dl className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <dt className="text-label-m text-text-weak">Admin username</dt>
          <dd className="text-body-l font-medium text-text break-all">
            {adminUsername}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-label-m text-text-weak">Admin email</dt>
          <dd className="text-body-l font-medium text-text break-all">
            {emailTrimmed}
          </dd>
        </div>
      </dl>

      <p className="text-body-m text-idle">
        To manage{' '}
        <span className="font-medium text-active">{orgNameTrimmed}</span>,
        verify the admin email and sign in as this administrator. A verification
        code was sent to{' '}
        <span className="font-medium text-active">{emailTrimmed}</span>.
      </p>

      <div className="flex flex-col gap-2">
        <Button
          color="accent"
          type="button"
          onClick={() =>
            navigate({
              to: '/verify-email',
              search: { email: emailTrimmed, redirect: '/organization' },
            })
          }
        >
          <Icon icon="arrow-right" color="white" />
          Verify admin email & continue
        </Button>
        <Link
          to="/login"
          className="text-center underline text-label-m text-idle hover:text-active cursor-pointer"
        >
          I&apos;ll verify later — back to login
        </Link>
      </div>
    </div>
  );
};

export default OrganizationCreated;
