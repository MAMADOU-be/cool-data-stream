import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { THRESHOLDS } from "@/lib/thresholds";

export default function Admin() {
  useEffect(() => { document.title = "Admin · Doundeul Récolte"; }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Configuration système & documentation API</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          🔓 Gestion des utilisateurs/rôles désactivée — l'authentification est temporairement coupée.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoint d'ingestion IoT</CardTitle>
          <CardDescription>
            Pour brancher un capteur réel ou un pont MQTT, envoyez un POST :
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">
{`POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-sensor
Content-Type: application/json
apikey: <publishable_key>

{
  "capteur_id": "<uuid du capteur>",
  "type": "temperature" | "humidite" | "porte" | "fumee",
  "valeur": 4.2
}`}
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            Alternative : fournir <code>chambre_id</code>, <code>type</code> et <code>emplacement</code> pour résoudre automatiquement le capteur.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Réponse : <code>{`{ ok, niveau: "ok"|"warning"|"critical", alerte, seuils }`}</code>. Une alerte BDD est créée automatiquement uniquement au niveau <strong>critical</strong>.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seuils métiers (source unique)</CardTitle>
          <CardDescription>
            Identiques côté front (<code>src/lib/thresholds.ts</code>), edge function (<code>ingest-sensor</code>) et règles d'alerte de la simulation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grandeur</TableHead>
                <TableHead>Vigilance</TableHead>
                <TableHead>Critique</TableHead>
                <TableHead>Comparaison</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.entries(THRESHOLDS) as [string, typeof THRESHOLDS[keyof typeof THRESHOLDS]][]).map(([k, t]) => (
                <TableRow key={k}>
                  <TableCell className="font-medium capitalize">{k}</TableCell>
                  <TableCell>{t.op === "gt" ? `> ${t.warning}` : `< ${t.warning}`} {t.unit}</TableCell>
                  <TableCell className="text-destructive font-semibold">
                    {t.op === "gt" ? `> ${t.critical}` : `< ${t.critical}`} {t.unit}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{t.op === "gt" ? "supérieur à" : "inférieur à"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
