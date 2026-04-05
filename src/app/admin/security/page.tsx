
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  RefreshCw, 
  History,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function SecurityManagement() {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("••••••");
  const [isSaving, setIsSaving] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);
  const { toast } = useToast();

  const handleSaveSecurity = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Security Updated",
        description: "Credentials and access policies synchronized.",
      });
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Shield className="w-8 h-8 text-accent" />
          Security & Access Governance
        </h1>
        <p className="text-muted-foreground mt-2">Manage PIN credentials and platform-wide security protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="shadow-lg border-primary/10">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="w-5 h-5 text-accent" />
                Master Access PIN
              </CardTitle>
              <CardDescription>Required for screen decommissioning and emergency resets.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Current System PIN</Label>
                <div className="relative">
                  <Input 
                    id="pin" 
                    type={showPin ? "text" : "password"} 
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="pr-12 text-2xl tracking-[0.5em] font-black h-14 text-center"
                    maxLength={6}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-2 top-2"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic text-center">Must be exactly 6 numeric digits.</p>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t py-3">
              <Button onClick={handleSaveSecurity} disabled={isSaving} className="w-full gap-2">
                {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
                Rotate System PIN
              </Button>
            </CardFooter>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-accent" />
                Recent Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {[
                  { event: "PIN Rotate", time: "2h ago", user: "Admin", status: "Success" },
                  { event: "Login Failure", time: "5h ago", user: "Unknown", status: "Blocked" },
                  { event: "Config Push", time: "Yesterday", user: "Staff-12", status: "Success" },
                ].map((log, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="font-bold text-primary">{log.event}</span>
                      <span className="text-muted-foreground font-mono">{log.time} • {log.user}</span>
                    </div>
                    <Badge variant={log.status === "Success" ? "secondary" : "destructive"} className="text-[9px]">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-lg border-accent/20 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Lock className="w-5 h-5" />
                Platform Hardening
              </CardTitle>
              <CardDescription>Global authentication policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Multi-Factor Authentication</Label>
                  <p className="text-[10px] text-muted-foreground">Require mobile verification for admin logins.</p>
                </div>
                <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Session Hijack Protection</Label>
                  <p className="text-[10px] text-muted-foreground">Invalidate tokens on IP change.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automated Log Rotation</Label>
                  <p className="text-[10px] text-muted-foreground">Clear security logs every 30 days.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-red-50 border border-red-200 rounded-xl flex gap-4 items-start shadow-sm">
            <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-900 leading-none">Panic Lockout Mode</p>
              <p className="text-[11px] text-red-700 leading-tight">
                Enabling this will instantly sever all administrative sessions and lock signage screens to a blacked-out state. Use only in event of physical security breach.
              </p>
              <Button variant="destructive" size="sm" className="mt-3 font-bold text-[10px] uppercase tracking-widest px-6 h-8">
                Initiate Global Lockout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
