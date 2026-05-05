import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bell, Settings, LogOut, Sun, History, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFridgeData } from "@/hooks/useFridgeData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut, user, role, isAdmin } = useAuth();
  const { alerts } = useFridgeData();
  const actives = alerts.filter((a) => a.etat === "creee" || a.etat === "active").length;

  const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/historique", label: "Historique", icon: History },
    { to: "/alerts", label: "Alertes", icon: Bell, badge: actives },
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Users }] : []),
    { to: "/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg"
                 style={{ background: "var(--gradient-solar)" }}>
              <Sun className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Doundeul Récolte</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map(({ to, label, icon: Icon, badge }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}>
                  <Button variant={active ? "secondary" : "ghost"} size="sm"
                          className={cn("gap-2", active && "font-medium")}>
                    <Icon className="h-4 w-4" />
                    {label}
                    {badge ? (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{badge}</Badge>
                    ) : null}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium">{user?.email}</div>
              <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                <Badge variant={isAdmin ? "default" : "secondary"} className="h-5 px-1.5 text-[10px] capitalize">
                  {role ?? "user"}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex overflow-x-auto border-t lg:hidden">
          {navItems.map(({ to, label, icon: Icon, badge }) => {
            const active = location.pathname === to;
            return (
              <Link key={to} to={to}
                    className={cn("flex flex-1 min-w-[80px] items-center justify-center gap-1.5 py-3 text-xs",
                      active ? "bg-secondary font-medium" : "text-muted-foreground")}>
                <Icon className="h-4 w-4" />
                {label}
                {badge ? <Badge variant="destructive" className="h-4 px-1 text-[10px]">{badge}</Badge> : null}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
