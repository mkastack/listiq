import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Chrome, Apple, Facebook } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthSignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setIsLoading(false);
    } else if (data.user) {
      // In Supabase, usually a trigger handles profile creation, 
      // but we can also do it here if needed or just wait for them to confirm email.
      // Assuming profile is handled by trigger or will be created on first dashboard visit.
      alert("Registration successful! Please check your email for confirmation.");
      navigate({ to: "/auth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-h-[760px] bg-white rounded-[2rem] shadow-lg overflow-hidden flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-12 flex flex-col justify-center items-center bg-white">
            <h1 className="text-4xl font-bold text-foreground mb-8">Create Account</h1>

            <div className="flex gap-4 mb-6">
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors active:scale-95 duration-200">
                <Facebook className="w-5 h-5 text-foreground" />
              </button>
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors active:scale-95 duration-200">
                <Chrome className="w-5 h-5 text-foreground" />
              </button>
              <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors active:scale-95 duration-200">
                <Apple className="w-5 h-5 text-foreground" />
              </button>
            </div>

            <p className="text-sm font-medium text-muted-foreground mb-8">or use your email</p>

            <form className="w-full space-y-6" onSubmit={handleSignUp}>
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium border border-red-100">
                  {error}
                </div>
              )}
              <div className="w-full">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 px-6 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground font-base"
                />
              </div>
              <div className="w-full">
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 px-6 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground font-base"
                />
              </div>
              <div className="w-full">
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 px-6 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground font-base"
                />
              </div>
              <div className="w-full">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-14 px-6 bg-background border border-input rounded-2xl focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground font-base"
                />
              </div>
              <div className="pt-8 text-center">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="text-primary-foreground font-bold py-4 px-12 rounded-full uppercase tracking-wider transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
                  style={{
                    background: "var(--gradient-primary)",
                    boxShadow: "var(--shadow-glow)",
                  }}
                >
                  {isLoading ? "Signing Up..." : "Sign Up"}
                </button>
              </div>
            </form>
          </div>

          <div
            className="w-full md:w-1/2 p-12 flex flex-col justify-center items-center text-center text-brand-foreground relative overflow-hidden"
            style={{ background: "var(--gradient-hero)" }}
          >
            <h2 className="text-5xl font-bold mb-6 relative z-10">Welcome Back!</h2>
            <p className="text-lg font-medium mb-12 max-w-[280px] relative z-10">
              To keep connected with us please login with your personal info
            </p>
            <Link
              to="/auth"
              className="border-2 border-brand-foreground text-brand-foreground font-bold py-4 px-12 rounded-full uppercase tracking-wider hover:bg-white/10 transition-all active:scale-95 relative z-10 inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
