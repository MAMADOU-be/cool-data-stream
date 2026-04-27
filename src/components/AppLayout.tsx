import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bell, Settings, LogOut, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFridgeData } from "@/hooks/useFridgeData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/alerts", label: "Alertes", icon: Bell },
  { to: "/settings", label: "Paramètres", icon: Settings },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { signOut, user, role } = useAuth();
  const { alerts } = useFridgeData();
  const unread = alerts.filter((a) => !a.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "var(--gradient-solar)" }}
            >
              <Sun className="h-5 w-5 text-secondary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">Solar Fridge</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => {
              const active = location.pathname === to;
              return (
                <Link key={to} to={to}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn("gap-2", active && "font-medium")}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                    {to === "/alerts" && unread > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                        {unread}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-medium">{user?.email}</div>
              <div className="flex items-center justify-end gap-1.5 text-muted-foreground capitalize">
                {role === "admin" && (
                  <Badge variant="default" className="h-5 px-1.5 text-[10px]">admin</Badge>
                )}
                {role !== "admin" && <span>{role ?? "user"}</span>}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="flex border-t md:hidden">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 py-3 text-sm",
                  active ? "bg-secondary font-medium" : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {to === "/alerts" && unread > 0 && (
                  <Badge variant="destructive" className="h-4 px-1 text-[10px]">
                    {unread}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
