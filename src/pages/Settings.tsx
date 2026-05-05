import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const SIM_KEY = "doundeul:simulation-enabled";

export default function Settings() {
  const { role, user } = useAuth();
  const [sim, setSim] = useState(true);

  useEffect(() => {
    document.title = "Paramètres · Doundeul Récolte";
    setSim(localStorage.getItem(SIM_KEY) !== "false");
  }, []);

  const save = () => {
    localStorage.setItem(SIM_KEY, String(sim));
    toast.success("Préférences enregistrées. Rechargez pour appliquer.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Préférences de l'application</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Connecté en tant que <strong>{user?.email}</strong> · rôle : <strong className="capitalize">{role}</strong>
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Source des données</CardTitle>
          <CardDescription>
            Active la simulation locale des capteurs IoT (utile pour la démonstration en attendant le matériel réel).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="sim" className="text-base">Simulation des capteurs</Label>
              <p className="text-sm text-muted-foreground">Génère des mesures réalistes toutes les 8 secondes</p>
            </div>
            <Switch id="sim" checked={sim} onCheckedChange={setSim} />
          </div>
          <Button onClick={save}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Seuils d'alerte (BF-06)</CardTitle>
          <CardDescription>Définis dans le système</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between border-b pb-2"><span>Température maximale</span><strong>4 °C</strong></li>
            <li className="flex justify-between border-b pb-2"><span>Niveau batterie minimum</span><strong>20 %</strong></li>
            <li className="flex justify-between"><span>Porte ouverte (durée max)</span><strong>5 min</strong></li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
