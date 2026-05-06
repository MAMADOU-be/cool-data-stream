import { useEffect, useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { THRESHOLDS } from "@/lib/thresholds";

interface UserLine {
  id: string;
  full_name: string | null;
  roles: AppRole[];
}

const ROLES: AppRole[] = ["admin", "operateur", "agriculteur", "user"];

export default function Admin() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<UserLine[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name"),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    const map = new Map<string, AppRole[]>();
    for (const r of (roles as any[]) ?? []) {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role);
      map.set(r.user_id, arr);
    }
    setUsers(((profiles as any[]) ?? []).map((p) => ({
      id: p.id, full_name: p.full_name, roles: map.get(p.id) ?? [],
    })));
    setLoading(false);
  }, []);

  useEffect(() => { document.title = "Admin · Doundeul Récolte"; load(); }, [load]);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const addRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) { toast.error(error.message); return; }
    toast.success(`Rôle ${role} ajouté`);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground">Gestion des utilisateurs et rôles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisateurs</CardTitle>
          <CardDescription>
            Rôles disponibles : agriculteur (lecture), opérateur (contrôle + alertes), admin (tout)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Rôles</TableHead>
                  <TableHead className="text-right">Ajouter un rôle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{u.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0
                          ? <span className="text-xs text-muted-foreground">Aucun</span>
                          : u.roles.map((r) => <Badge key={r} variant="secondary" className="capitalize">{r}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select onValueChange={(v) => addRole(u.id, v as AppRole)}>
                        <SelectTrigger className="h-8 w-[140px] ml-auto"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                        <SelectContent>
                          {ROLES.filter((r) => !u.roles.includes(r)).map((r) => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
        </CardContent>
      </Card>
    </div>
  );
}
