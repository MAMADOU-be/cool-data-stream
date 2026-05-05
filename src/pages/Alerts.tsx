import { useEffect, useMemo, useState } from "react";
import { useFridgeData, AlertEtat } from "@/hooks/useFridgeData";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const etatColors: Record<AlertEtat, "destructive" | "secondary" | "outline" | "default"> = {
  creee: "destructive",
  active: "destructive",
  lue: "secondary",
  resolue: "outline",
};

export default function Alerts() {
  const { alerts, setAlertState } = useFridgeData();
  const { isOperateur } = useAuth();
  const [filter, setFilter] = useState<"all" | "active" | "resolue">("active");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          {counts.actives} active{counts.actives > 1 ? "s" : ""} · {counts.resolues} résolue{counts.resolues > 1 ? "s" : ""} · {counts.total} au total
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="text-base">Cycle de vie : Créée → Active → Lue → Résolue</CardTitle>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="active">Actives ({counts.actives})</TabsTrigger>
              <TabsTrigger value="resolue">Résolues ({counts.resolues})</TabsTrigger>
              <TabsTrigger value="all">Toutes ({counts.total})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune alerte</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Valeur / Seuil</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => (
                    <TableRow key={a.id}
                              className={cn((a.etat === "creee" || a.etat === "active") && "bg-destructive/5")}>
                      <TableCell><Badge variant="outline">{a.type}</Badge></TableCell>
                      <TableCell className="max-w-md">{a.message}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.valeur !== null && a.seuil !== null ? `${a.valeur} / ${a.seuil}` : "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={etatColors[a.etat]} className="capitalize">{a.etat}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={a.etat}
                          onValueChange={(v) => setAlertState(a.id, v as AlertEtat)}
                          disabled={!isOperateur}
                        >
                          <SelectTrigger className="h-8 w-[130px] ml-auto">
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
