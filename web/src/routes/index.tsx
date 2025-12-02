import ThemeToggle from '@/components/molecules/theme-toggle';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-h4 text-idle mb-2">Home</h2>
        <ThemeToggle />
      </div>
    </div>
  );
}
