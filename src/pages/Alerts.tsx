import { useEffect, useMemo, useState } from "react";
import { useFridgeData, AlertEtat } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, RotateCcw, Bell, BellOff, CheckCircle2, Clock, ShieldAlert } from "lucide-react";

const etatConfig: Record<AlertEtat, { label: string; variant: "destructive" | "secondary" | "outline" | "default"; icon: typeof AlertTriangle }> = {
  creee:   { label: "Créée",   variant: "destructive", icon: Bell },
  active:  { label: "Active",  variant: "destructive", icon: ShieldAlert },
  lue:     { label: "Lue",     variant: "secondary",     icon: CheckCircle2 },
  resolue: { label: "Résolue", variant: "outline",       icon: BellOff },
};

export default function Alerts() {
  const { alerts, setAlertState, resetAllAlerts } = useFridgeData();
  const { isOperateur } = useAuth();
  const [filter, setFilter] = useState<"all" | "active" | "resolue">("active");
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => { document.title = "Alertes · Doundeul Récolte"; }, []);

  const counts = useMemo(() => ({
    actives: alerts.filter((a) => a.etat === "creee" || a.etat === "active").length,
    resolues: alerts.filter((a) => a.etat === "resolue").length,
    total: alerts.length,
  }), [alerts]);

  const filtered = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "resolue") return alerts.filter((a) => a.etat === "resolue");
    return alerts.filter((a) => a.etat === "creee" || a.etat === "active");
  }, [alerts, filter]);

  const handleReset = async () => {
    if (!isOperateur) return;
    setIsResetting(true);
    await resetAllAlerts();
    setIsResetting(false);
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 shadow-card backdrop-blur-xl sm:p-8">
        <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-destructive opacity-20 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-gradient-warning opacity-15 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Clock className="h-3.5 w-3.5" />
              Historique complet · temps réel
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="text-gradient-destructive">Alertes</span>
            </h1>
            <p className="mt-1 text-muted-foreground">
              {counts.actives} active{counts.actives > 1 ? "s" : ""} · {counts.resolues} résolue{counts.resolues > 1 ? "s" : ""} · {counts.total} au total
            </p>
          </div>
          {counts.actives > 0 && (
            <Badge variant="destructive" className="gap-1.5 rounded-full px-3 py-1.5 text-sm shadow-elegant animate-pulse-glow">
              <AlertTriangle className="h-4 w-4" />
              {counts.actives} alerte{counts.actives > 1 ? "s" : ""} en cours
            </Badge>
          )}
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="group hover-lift border-l-4 border-l-destructive">
          <CardHeader className="flex-row items-center justify-between space-y-1 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Actives</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
              <ShieldAlert className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight text-destructive">{counts.actives}</span>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Nécessitent une action</p>
          </CardContent>
        </Card>
        <Card className="group hover-lift border-l-4 border-l-primary">
          <CardHeader className="flex-row items-center justify-between space-y-1 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Résolues</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight">{counts.resolues}</span>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Clôturées ce mois</p>
          </CardContent>
        </Card>
        <Card className="group hover-lift border-l-4 border-l-warning">
          <CardHeader className="flex-row items-center justify-between space-y-1 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</CardTitle>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/10 ring-1 ring-warning/20">
              <Bell className="h-4 w-4 text-warning" />
            </div>
          </CardHeader>
          <CardContent>
            <span className="font-display text-3xl font-bold tabular-nums tracking-tight">{counts.total}</span>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Depuis le déploiement</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-1">
          <div>
            <CardTitle className="text-base">Cycle de vie</CardTitle>
            <p className="text-xs text-muted-foreground">Créée → Active → Lue → Résolue</p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
              <TabsList className="glass">
                <TabsTrigger value="active">Actives ({counts.actives})</TabsTrigger>
                <TabsTrigger value="resolue">Résolues ({counts.resolues})</TabsTrigger>
                <TabsTrigger value="all">Toutes ({counts.total})</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 rounded-full shadow-elegant"
              onClick={handleReset}
              disabled={!isOperateur || counts.actives === 0 || isResetting}
            >
              <RotateCcw className={cn("h-4 w-4", isResetting && "animate-spin")} />
              {isResetting ? "Réinitialisation…" : "Tout résoudre"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 ring-1 ring-success/20">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Aucune alerte</p>
              <p className="text-xs text-muted-foreground/60">Tout est sous contrôle</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valeur / Seuil</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">État</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const cfg = etatConfig[a.etat];
                    const CfgIcon = cfg.icon;
                    return (
                      <TableRow key={a.id}
                                className={cn("transition-colors",
                                  (a.etat === "creee" || a.etat === "active") && "bg-destructive/[0.03] hover:bg-destructive/[0.06]")}>
                        <TableCell>
                          <Badge variant="outline" className="gap-1 font-medium">
                            {a.type === "fumee_detectee" && <Flame className="h-3 w-3 text-destructive" />}
                            {a.type === "temperature_high" && <AlertTriangle className="h-3 w-3 text-warning" />}
                            {a.type === "battery_low" && <Battery className="h-3 w-3 text-primary" />}
                            {a.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md text-sm font-medium leading-relaxed">{a.message}</TableCell>
                        <TableCell className="text-sm tabular-nums text-muted-foreground">
                          {a.valeur !== null && a.seuil !== null ? (
                            <span className="flex items-center gap-1">
                              <span className={cn(a.valeur > a.seuil && "text-destructive font-semibold")}>{a.valeur}</span>
                              <span className="text-muted-foreground/50">/</span>
                              <span>{a.seuil}</span>
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                          {new Date(a.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1 capitalize">
                            <CfgIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={a.etat}
                            onValueChange={(v) => setAlertState(a.id, v as AlertEtat)}
                            disabled={!isOperateur}
                          >
                            <SelectTrigger className="h-8 w-[130px] ml-auto text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="creee">Créée</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="lue">Lue</SelectItem>
                              <SelectItem value="resolue">Résolue</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
