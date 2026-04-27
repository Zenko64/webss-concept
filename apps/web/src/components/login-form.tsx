import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useLoginForm } from "@/hooks/forms/auth";
import { useNavigate } from "react-router";
import { EyeOffIcon } from "lucide-react";

export function LoginForm({ className }: { className?: string }) {
  const { form, submit } = useLoginForm();
  const {
    register,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const handleGitHubLogin = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const handleAnonymousLogin = async () => {
    await authClient.signIn.anonymous();
  };

  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md p-5">
      <form className={cn("flex flex-col gap-6", className)} onSubmit={submit}>
        <FieldGroup>
          <CardHeader className="flex flex-col gap-1.25 items-center">
            <CardTitle className="text-3xl font-bold">Login</CardTitle>
            <CardDescription>
              <p className="text-xs text-muted-foreground">
                Login to get started with WebSS!
              </p>
            </CardDescription>
          </CardHeader>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              disabled={isSubmitting}
              {...register("email")}
            />
            <FieldError errors={errors.email ? [errors.email] : []} />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              disabled={isSubmitting}
              {...register("password")}
            />
            <FieldError errors={errors.password ? [errors.password] : []} />
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              onClick={handleGitHubLogin}
              disabled={isSubmitting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-4 h-4"
              >
                <path
                  d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                  fill="currentColor"
                />
              </svg>
              Login with GitHub
            </Button>
            <Button onClick={handleAnonymousLogin} variant="outline">
              <EyeOffIcon />
              Login Anonymously
            </Button>
            <FieldDescription className="text-center">
              Don&apos;t have an account?{" "}
              <a
                onClick={() => navigate("/signup")}
                className="underline underline-offset-4 cursor-pointer"
              >
                Sign up
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Card>
  );
}
