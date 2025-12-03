import SignUpForm from '@/components/molecules/auth/sign-up-form';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup')({
  component: SignUp,
});

function SignUp() {
  return (
    <div className="flex flex-col items-center w-full gap-4 p-2">
      <SignUpForm />
    </div>
  );
}
