import { SignupForm } from "@/components/signup-form";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";

export default function Signup() {
  const { data } = authClient.useSession();

  if (data?.user) {
    useNavigate()("/");
    return;
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <SignupForm />
    </main>
  );
}
