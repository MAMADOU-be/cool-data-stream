import { useEffect } from "react";
import { useFridgeData } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Thermometer, Droplets, Battery, Sun, Snowflake, AlertTriangle, DoorOpen, Zap, Power, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { THRESHOLDS, levelOf } from "@/lib/thresholds";

function StatCard({ icon: Icon, label, value, unit, tone = "default", sub, accent }: any) {
  const tones: Record<string, { text: string; ring: string; bg: string }> = {
    default: { text: "text-primary", ring: "ring-primary/20", bg: "bg-primary/10" },
    success: { text: "text-success", ring: "ring-success/20", bg: "bg-success/10" },
    warning: { text: "text-warning", ring: "ring-warning/20", bg: "bg-warning/10" },
    danger:  { text: "text-destructive", ring: "ring-destructive/30", bg: "bg-destructive/10" },
  };
  const t = tones[tone];
  return (
    <Card className="group hover-lift">
      <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent", tone === "danger" ? "via-destructive/60" : tone === "warning" ? "via-warning/60" : tone === "success" ? "via-success/60" : "via-primary/60")} />
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", t.bg, t.ring)}>
          <Icon className={cn("h-4 w-4", t.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1.5">
          <span className={cn("font-display text-3xl font-bold tabular-nums tracking-tight", t.text)}>{value}</span>
          <span className="text-sm font-medium text-muted-foreground">{unit}</span>
        </div>
        {sub && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const {
    chambre, capteurs, latestByCapteur, groupes, panneaux, batterie,
    tempMoyenne, humiditeMoyenne, porteOuverte, fumeeMax,
    productionTotale, consommationTotale, alerts, toggleGroupe,
    porteManuelle, togglePorte,
  } = useFridgeData();
  const { isOperateur } = useAuth();

  useEffect(() => { document.title = "Dashboard · Doundeul Récolte"; }, []);

  const actives = alerts.filter((a) => a.etat === "creee" || a.etat === "active");

  const toneMap = { ok: "success", warning: "warning", critical: "danger" } as const;
  const tempTone = toneMap[levelOf("temperature", tempMoyenne)];
  const battTone = toneMap[levelOf("batterie", batterie?.pourcentage ?? null)];
  const fumeeTone = toneMap[levelOf("fumee", fumeeMax)];
  const tempCapteurs = capteurs.filter((c) => c.type === "temperature");
  const humidCapteurs = capteurs.filter((c) => c.type === "humidite");
  const fumeeCapteurs = capteurs.filter((c) => c.type === "fumee");

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 shadow-card backdrop-blur-xl sm:p-8">
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-primary opacity-20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-gradient-solar opacity-15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              Système en ligne · temps réel
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="text-gradient-primary">Tableau de bord</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {chambre ? `${chambre.nom} · ${chambre.localisation}` : "Chargement..."}
            </p>
          </div>
          {actives.length > 0 && (
            <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1.5 text-sm shadow-elegant animate-pulse-glow">
              <AlertTriangle className="h-4 w-4" />
              {actives.length} alerte{actives.length > 1 ? "s" : ""} active{actives.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard icon={Thermometer} label="Température moyenne" tone={tempTone}
                  value={tempMoyenne !== null ? tempMoyenne.toFixed(1) : "—"} unit="°C"
                  sub={`Vigilance > ${THRESHOLDS.temperature.warning}°C · Critique > ${THRESHOLDS.temperature.critical}°C · ${tempCapteurs.length} capteurs`} />
        <StatCard icon={Droplets} label="Humidité moyenne"
                  value={humiditeMoyenne !== null ? humiditeMoyenne.toFixed(0) : "—"} unit="%"
                  sub={`${humidCapteurs.length} capteurs muraux`} />
        <StatCard icon={Battery} label="Batterie solaire" tone={battTone}
                  value={batterie ? batterie.pourcentage.toFixed(0) : "—"} unit="%"
                  sub={batterie ? `${batterie.voltage.toFixed(1)} V · vigilance < ${THRESHOLDS.batterie.warning}% · critique < ${THRESHOLDS.batterie.critical}%` : "—"} />
        <StatCard icon={Sun} label="Production solaire" tone="warning"
                  value={(productionTotale / 1000).toFixed(2)} unit="kW"
                  sub={`${panneaux.length} panneaux · 4 kWc installés`} />
        <StatCard icon={Flame} label="Détection fumée" tone={fumeeTone}
                  value={fumeeMax !== null ? fumeeMax.toFixed(0) : "—"} unit="ppm"
                  sub={`Vigilance > ${THRESHOLDS.fumee.warning} ppm · Critique > ${THRESHOLDS.fumee.critical} ppm · ${fumeeCapteurs.length} détecteurs`} />
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
              const danger = v !== undefined && v > THRESHOLDS.temperature.critical;
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

      {/* Capteurs humidité + porte + fumée */}
      <div className="grid gap-4 lg:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sécurité incendie</CardTitle>
            <CardDescription>
              Détecteurs de fumée — vigilance &gt; {THRESHOLDS.fumee.warning} ppm, critique &gt; {THRESHOLDS.fumee.critical} ppm
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {fumeeCapteurs.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun détecteur installé.</p>
            )}
            {fumeeCapteurs.map((c) => {
              const v = latestByCapteur[c.id]?.valeur;
              const lvl = levelOf("fumee", v);
              const danger = lvl === "critical";
              const warn = lvl === "warning";
              return (
                <div key={c.id} className={cn(
                  "flex items-center justify-between rounded-lg border p-3",
                  danger && "border-destructive/40 bg-destructive/5",
                  warn && "border-warning/40 bg-warning/10",
                )}>
                  <div className="flex items-center gap-2">
                    <Flame className={cn("h-4 w-4",
                      danger ? "text-destructive" : warn ? "text-warning" : "text-muted-foreground")} />
                    <span className="text-sm">{c.emplacement}</span>
                  </div>
                  <span className={cn("font-semibold",
                    danger ? "text-destructive" : warn ? "text-warning" : "text-foreground")}>
                    {v !== undefined ? `${v.toFixed(0)} ppm` : "—"}
                  </span>
                </div>
              );
            })}
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
