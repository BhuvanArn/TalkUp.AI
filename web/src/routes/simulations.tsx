import { SimulationWorkspace } from '@/components/organisms/simulation-workspace';
import { createAuthGuard } from '@/utils/auth.guards';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/simulations')({
  beforeLoad: createAuthGuard('/simulations'),
  component: Simulations,
});

function Simulations() {
  return <SimulationWorkspace />;
}
