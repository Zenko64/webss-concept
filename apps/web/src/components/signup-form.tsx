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
import { useSignupForm } from "@/hooks/forms/auth";
import { useNavigate } from "react-router";

export function SignupForm({ className }: { className?: string }) {
  const { form, submit } = useSignupForm();
  const {
    register,
    formState: { errors, isSubmitting, isValid },
  } = form;

  const handleGoogleSignup = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  const navigate = useNavigate();

  return (
    <Card className="w-full max-w-md p-5">
      <form className={cn("flex flex-col gap-6", className)} onSubmit={submit}>
        <FieldGroup>
          <CardHeader className="flex flex-col gap-1.25 items-center">
            <CardTitle className="text-3xl font-bold">Sign Up</CardTitle>
            <CardDescription>
              <p className="text-xs text-muted-foreground">
                Create an account to get started with WebSS!
              </p>
            </CardDescription>
          </CardHeader>

          {errors.root && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errors.root.message}
            </div>
          )}

          <Field>
            <FieldLabel htmlFor="name">Full Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError errors={errors.name ? [errors.name] : []} />
          </Field>

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
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            <FieldError
              errors={errors.confirmPassword ? [errors.confirmPassword] : []}
            />
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting || !isValid}>
              {isSubmitting ? "Creating account..." : "Create Account"}
            </Button>
          </Field>

          <FieldSeparator>Or continue with</FieldSeparator>

          <Field>
            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleSignup}
              disabled={isSubmitting}
            >
              Sign up with Google
            </Button>
            <FieldDescription className="text-center">
              Already have an account?{" "}
              <a
                onClick={() => navigate("/login")}
                className="underline underline-offset-4 cursor-pointer"
              >
                Sign in
              </a>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </Card>
  );
}
