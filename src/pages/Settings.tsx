import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const TEMP_THRESHOLD_KEY = "solar-fridge:temp-threshold";
const NOTIF_KEY = "solar-fridge:notifications";

export default function Settings() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [threshold, setThreshold] = useState<string>("5");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    document.title = "Paramètres · Solar Fridge";
    const t = localStorage.getItem(TEMP_THRESHOLD_KEY);
    if (t) setThreshold(t);
    const n = localStorage.getItem(NOTIF_KEY);
    if (n !== null) setNotifications(n === "true");
  }, []);

  const handleSave = () => {
    if (!isAdmin) {
      toast.error("Réservé aux administrateurs");
      return;
    }
    const v = parseFloat(threshold);
    if (!Number.isFinite(v)) {
      toast.error("Seuil de température invalide");
      return;
    }
    localStorage.setItem(TEMP_THRESHOLD_KEY, String(v));
    localStorage.setItem(NOTIF_KEY, String(notifications));
    toast.success("Paramètres enregistrés");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Configurez vos seuils et préférences</p>
      </div>

      {!isAdmin && (
        <Alert>
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            Seuls les administrateurs peuvent modifier ces paramètres. Vue en lecture seule.
          </AlertDescription>
        </Alert>
      )}

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Seuils d'alerte</CardTitle>
          <CardDescription>
            Une alerte est créée lorsque la température dépasse ce seuil.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="threshold">Seuil de température (°C)</Label>
            <Input
              id="threshold"
              type="number"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="max-w-xs"
              disabled={!isAdmin}
            />
            <p className="text-xs text-muted-foreground">Par défaut : 5 °C</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="notif" className="text-base">Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des alertes visuelles dans l'application
              </p>
            </div>
            <Switch
              id="notif"
              checked={notifications}
              onCheckedChange={setNotifications}
              disabled={!isAdmin}
            />
          </div>

          <Button onClick={handleSave} disabled={!isAdmin}>Enregistrer</Button>
        </CardContent>
      </Card>
    </div>
  );
}
