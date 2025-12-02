import { Button } from '@/components/atoms/button';
import { mockApplications } from '@/types/application';
import { createAuthGuard } from '@/utils/auth.guards';
import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/applications/')({
  beforeLoad: createAuthGuard('/applications'),
  component: ApplicationsList,
});

/**
 * Applications list page
 *
 * Displays all job applications with their status and details.
 */
function ApplicationsList() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Applications</h2>
      </div>
      <div className="flex gap-4">
        {mockApplications.map((application) => (
          <Link key={application.id} to={`/applications/${application.id}`}>
            <Button variant="contained" color="accent">
              {application.companyName}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
