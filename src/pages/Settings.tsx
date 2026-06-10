import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_THRESHOLDS,
  getThresholds,
  saveThresholds,
  resetThresholds,
  type ThresholdKey,
} from "@/lib/thresholds";

const SIM_KEY = "doundeul:simulation-enabled";

const LABELS: Record<ThresholdKey, { title: string; desc: string }> = {
  temperature: { title: "Température", desc: "Vigilance et seuil critique (°C)" },
  humidite:    { title: "Humidité", desc: "Vigilance et seuil critique (%)" },
  fumee:       { title: "Fumée / incendie", desc: "Vigilance et seuil critique (ppm)" },
  batterie:    { title: "Batterie faible", desc: "Vigilance et seuil critique (%) — alerte quand la charge est inférieure" },
  porte:       { title: "Porte ouverte", desc: "Vigilance et seuil critique (min)" },
};

const ORDER: ThresholdKey[] = ["temperature", "humidite", "fumee", "batterie", "porte"];

type Form = Record<ThresholdKey, { warning: number; critical: number }>;

function readForm(): Form {
  const t = getThresholds();
  return ORDER.reduce((acc, k) => {
    acc[k] = { warning: t[k].warning, critical: t[k].critical };
    return acc;
  }, {} as Form);
}

export default function Settings() {
  const [sim, setSim] = useState(true);
  const [form, setForm] = useState<Form>(() => readForm());

  useEffect(() => {
    document.title = "Paramètres · Doundeul Récolte";
    setSim(localStorage.getItem(SIM_KEY) !== "false");
  }, []);

  const saveSim = () => {
    localStorage.setItem(SIM_KEY, String(sim));
    toast.success("Préférences enregistrées. Rechargez pour appliquer.");
  };

  const updateField = (k: ThresholdKey, field: "warning" | "critical", v: string) => {
    const n = Number(v);
    setForm((p) => ({ ...p, [k]: { ...p[k], [field]: Number.isFinite(n) ? n : 0 } }));
  };

  const saveAll = () => {
    // validation : pour op "gt", critical > warning ; pour "lt", critical < warning
    for (const k of ORDER) {
      const op = DEFAULT_THRESHOLDS[k].op;
      const { warning, critical } = form[k];
      if (op === "gt" && critical <= warning) {
        toast.error(`${LABELS[k].title} : le seuil critique doit être supérieur à la vigilance.`);
        return;
      }
      if (op === "lt" && critical >= warning) {
        toast.error(`${LABELS[k].title} : le seuil critique doit être inférieur à la vigilance.`);
        return;
      }
    }
    saveThresholds(form);
    toast.success("Seuils enregistrés — appliqués immédiatement.");
  };

  const resetAll = () => {
    resetThresholds();
    setForm(readForm());
    toast.success("Seuils réinitialisés aux valeurs par défaut.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Préférences de l'application et seuils d'alerte</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Les seuils définis ici sont appliqués côté application (sonnerie, badges, alertes générées par la simulation).
          La fonction d'ingestion serveur conserve ses propres seuils.
        </AlertDescription>
      </Alert>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Source des données</CardTitle>
          <CardDescription>Active la simulation locale des capteurs IoT.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="sim" className="text-base">Simulation des capteurs</Label>
              <p className="text-sm text-muted-foreground">Génère des mesures réalistes toutes les 8 secondes</p>
            </div>
            <Switch id="sim" checked={sim} onCheckedChange={setSim} />
          </div>
          <Button onClick={saveSim}>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">Seuils d'alerte (BF-06)</CardTitle>
          <CardDescription>
            Définissez le niveau de vigilance (orange) et le niveau critique (rouge, alerte + email).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {ORDER.map((k) => {
            const def = DEFAULT_THRESHOLDS[k];
            return (
              <div key={k} className="rounded-lg border p-4 space-y-3">
                <div>
                  <div className="font-medium">{LABELS[k].title}</div>
                  <div className="text-xs text-muted-foreground">{LABELS[k].desc}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Vigilance ({def.unit})</Label>
                    <Input
                      type="number"
                      step="any"
                      value={form[k].warning}
                      onChange={(e) => updateField(k, "warning", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Critique ({def.unit})</Label>
                    <Input
                      type="number"
                      step="any"
                      value={form[k].critical}
                      onChange={(e) => updateField(k, "critical", e.target.value)}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Défaut : vigilance {def.warning} {def.unit}, critique {def.critical} {def.unit}
                  {def.op === "lt" ? " (alerte si valeur inférieure)" : ""}
                </div>
              </div>
            );
          })}
          <div className="flex gap-2">
            <Button onClick={saveAll}>Enregistrer les seuils</Button>
            <Button variant="outline" onClick={resetAll}>Réinitialiser</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
