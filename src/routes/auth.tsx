import { createFileRoute } from "@tanstack/react-router";
import { AuthSignIn } from "@/components/site/AuthSignIn";
import { AuthSignUp } from "@/components/site/AuthSignUp";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    mode: s.mode === "signup" ? "signup" : "signin",
  }),
  head: () => ({ meta: [{ title: "Sign in — ListIQ" }] }),
  component: AuthComponent,
});

function AuthComponent() {
  const { mode } = Route.useSearch();
  return mode === "signup" ? <AuthSignUp /> : <AuthSignIn />;
}
