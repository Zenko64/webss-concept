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

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
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
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              Login with Google
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
