import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/cv-analysis')({
  beforeLoad: createAuthGuard('/cv-analysis'),
  component: CV,
});

/**
 * Curriculum Vitae page
 *
 * Allows users to manage and analyze their CV.
 */
function CV() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle">Curriculum Vitae</h2>
      </div>
    </div>
  );
}
