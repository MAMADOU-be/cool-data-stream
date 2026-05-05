import { useEffect } from "react";
import { useFridgeData } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Thermometer, Droplets, Battery, Sun, Snowflake, AlertTriangle, DoorOpen, Zap, Power
} from "lucide-react";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, unit, tone = "default", sub }: any) {
  const tones: Record<string, string> = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={cn("h-5 w-5", tones[tone])} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", tones[tone])}>
          {value} <span className="text-base font-normal text-muted-foreground">{unit}</span>
        </div>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const {
    chambre, capteurs, latestByCapteur, groupes, panneaux, batterie,
    tempMoyenne, humiditeMoyenne, porteOuverte,
    productionTotale, consommationTotale, alerts, toggleGroupe,
  } = useFridgeData();
  const { isOperateur } = useAuth();

  useEffect(() => { document.title = "Dashboard · Doundeul Récolte"; }, []);

  const actives = alerts.filter((a) => a.etat === "creee" || a.etat === "active");

  const tempTone = tempMoyenne === null ? "default" : tempMoyenne > 4 ? "danger" : tempMoyenne < 0 ? "default" : "success";
  const battTone = !batterie ? "default" : batterie.pourcentage < 20 ? "danger" : batterie.pourcentage < 50 ? "warning" : "success";
  const tempCapteurs = capteurs.filter((c) => c.type === "temperature");
  const humidCapteurs = capteurs.filter((c) => c.type === "humidite");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            {chambre ? `${chambre.nom} · ${chambre.localisation}` : "Chargement..."}
          </p>
        </div>
        {actives.length > 0 && (
          <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm">
            <AlertTriangle className="h-4 w-4" />
            {actives.length} alerte{actives.length > 1 ? "s" : ""} active{actives.length > 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Thermometer} label="Température moyenne" tone={tempTone}
                  value={tempMoyenne !== null ? tempMoyenne.toFixed(1) : "—"} unit="°C"
                  sub={`Seuil : 4°C · ${tempCapteurs.length} capteurs`} />
        <StatCard icon={Droplets} label="Humidité moyenne"
                  value={humiditeMoyenne !== null ? humiditeMoyenne.toFixed(0) : "—"} unit="%"
                  sub={`${humidCapteurs.length} capteurs muraux`} />
        <StatCard icon={Battery} label="Batterie solaire" tone={battTone}
                  value={batterie ? batterie.pourcentage.toFixed(0) : "—"} unit="%"
                  sub={batterie ? `${batterie.voltage.toFixed(1)} V · ${batterie.capacite_kwh} kWh` : "—"} />
        <StatCard icon={Sun} label="Production solaire" tone="warning"
                  value={(productionTotale / 1000).toFixed(2)} unit="kW"
                  sub={`${panneaux.length} panneaux · 4 kWc installés`} />
      </div>

      {/* Capteurs température détaillés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Capteurs de température</CardTitle>
          <CardDescription>Mesures par emplacement (haut, milieu, bas)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tempCapteurs.map((c) => {
              const m = latestByCapteur[c.id];
              const v = m?.valeur;
              const danger = v !== undefined && v > 4;
              return (
                <div key={c.id}
                     className={cn("flex items-center justify-between rounded-lg border p-3",
                       danger && "border-destructive/40 bg-destructive/5")}>
                  <div>
                    <div className="text-sm font-medium">{c.emplacement}</div>
                    <div className="text-xs text-muted-foreground">
                      {m ? new Date(m.timestamp).toLocaleTimeString() : "—"}
                    </div>
                  </div>
                  <div className={cn("text-xl font-bold", danger ? "text-destructive" : "text-foreground")}>
                    {v !== undefined ? `${v.toFixed(1)}°C` : "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Capteurs humidité + porte */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capteurs d'humidité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {humidCapteurs.map((c) => {
              const v = latestByCapteur[c.id]?.valeur;
              return (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-primary" />
                    <span className="text-sm">{c.emplacement}</span>
                  </div>
                  <span className="font-semibold">{v !== undefined ? `${v.toFixed(0)}%` : "—"}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Porte d'accès</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("flex items-center justify-between rounded-lg border p-4",
              porteOuverte === 1 && "border-warning/40 bg-warning/10")}>
              <div className="flex items-center gap-3">
                <DoorOpen className={cn("h-6 w-6", porteOuverte === 1 ? "text-warning" : "text-muted-foreground")} />
                <div>
                  <div className="font-medium">État de la porte</div>
                  <div className="text-xs text-muted-foreground">Seuil d'alerte : 5 minutes</div>
                </div>
              </div>
              <Badge variant={porteOuverte === 1 ? "destructive" : "secondary"}>
                {porteOuverte === null ? "—" : porteOuverte === 1 ? "Ouverte" : "Fermée"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groupes froids */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Groupes froids</CardTitle>
            <CardDescription>Unités de condensation XJQ10MBGR404</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <Zap className="h-3 w-3" />
            {(consommationTotale / 1000).toFixed(2)} kW consommés
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {groupes.map((g) => (
              <div key={g.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Snowflake className={cn("h-5 w-5", g.etat ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <div className="font-medium">{g.nom}</div>
                    <div className="text-xs text-muted-foreground">{g.consommation_w} W</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Power className={cn("h-4 w-4", g.etat ? "text-success" : "text-muted-foreground")} />
                  <Switch
                    checked={g.etat}
                    onCheckedChange={(v) => toggleGroupe(g.id, v)}
                    disabled={!isOperateur}
                    aria-label={`Activer ${g.nom}`}
                  />
                </div>
              </div>
            ))}
          </div>
          {!isOperateur && (
            <p className="mt-3 text-xs text-muted-foreground">
              Le contrôle à distance est réservé aux opérateurs et administrateurs.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alertes récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alertes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucune alerte</p>
          ) : (
            <ul className="space-y-2">
              {alerts.slice(0, 5).map((a) => (
                <li key={a.id}
                    className={cn("flex items-start gap-3 rounded-lg border p-3 text-sm",
                      (a.etat === "creee" || a.etat === "active") && "border-destructive/40 bg-destructive/5")}>
                  <AlertTriangle className={cn("mt-0.5 h-4 w-4 flex-shrink-0",
                    a.etat === "resolue" ? "text-success" : a.etat === "lue" ? "text-muted-foreground" : "text-destructive")} />
                  <div className="flex-1">
                    <div className="font-medium">{a.message}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()} · <span className="capitalize">{a.etat}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
