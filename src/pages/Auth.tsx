import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import logoAsset from "@/assets/logo.png.asset.json";

const credentialsSchema = z.object({
  email: z.string().trim().email("Adresse email invalide").max(255),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères").max(72),
});

const signupSchema = credentialsSchema.extend({
  fullName: z.string().trim().min(2, "Nom requis").max(100),
});

export default function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    document.title = "Connexion · Doundeul Récolte";
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (user) {
    const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = credentialsSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect"
        : error.message);
      return;
    }
    toast.success("Connecté");
    navigate("/dashboard", { replace: true });
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({
      email: signupEmail, password: signupPassword, fullName: signupName,
    });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message.includes("already")
        ? "Un compte existe déjà avec cet email"
        : error.message);
      return;
    }
    toast.success("Compte créé — vous êtes inscrit en tant qu'Agriculteur.");
    navigate("/dashboard", { replace: true });
  };

  const onGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (res.error) {
      toast.error("Connexion Google impossible : " + (res.error as Error).message);
      setBusy(false);
      return;
    }
    if (!res.redirected) {
      toast.success("Connecté avec Google");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[40vh] bg-gradient-aurora blur-3xl opacity-70" />
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-background/60 ring-1 ring-border/50">
            <img src={logoAsset.url} alt="Doundeul Récolte" className="h-full w-full object-contain p-1" />
          </div>
          <CardTitle className="font-display text-2xl">Doundeul Récolte</CardTitle>
          <CardDescription>Chaîne du froid solaire — accès sécurisé</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 pt-4">
              <form onSubmit={onLogin} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" autoComplete="email" required
                    value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-pass">Mot de passe</Label>
                  <Input id="login-pass" type="password" autoComplete="current-password" required
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Se connecter
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 pt-4">
              <form onSubmit={onSignup} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">Nom complet</Label>
                  <Input id="signup-name" required value={signupName}
                    onChange={(e) => setSignupName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" autoComplete="email" required
                    value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-pass">Mot de passe</Label>
                  <Input id="signup-pass" type="password" autoComplete="new-password" required
                    value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Les nouveaux comptes sont créés en tant qu'<strong>Agriculteur</strong> (lecture seule).
                  Un administrateur peut ensuite élever votre rôle.
                </p>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer mon compte
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={busy}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
              <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84Z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
            </svg>
            Continuer avec Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
