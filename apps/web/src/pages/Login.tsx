import { LoginForm } from "@/components/login-form";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { useEffect } from "react";

export default function Login() {
  const { data } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (data?.user) {
      navigate("/");
    }
  }, [data?.user, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}
