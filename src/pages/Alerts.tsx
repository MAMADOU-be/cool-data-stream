import { useEffect, useMemo, useState } from "react";
import { useFridgeData } from "@/hooks/useFridgeData";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Alerts() {
  const { alerts, toggleAlertRead } = useFridgeData();

  useEffect(() => {
    document.title = "Alertes · Solar Fridge";
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
        <p className="text-muted-foreground">
          {alerts.length} alerte{alerts.length > 1 ? "s" : ""} au total
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historique</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Aucune alerte enregistrée
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Lu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Badge variant={a.type.includes("high") || a.type.includes("low") ? "destructive" : "secondary"}>
                          {a.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">{a.message}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={a.is_read}
                          onCheckedChange={() => toggleAlertRead(a.id, a.is_read)}
                          aria-label="Marquer comme lu"
                        />
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
