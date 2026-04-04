"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Settings, 
  Database, 
  Shield, 
  RefreshCw, 
  Save, 
  Server,
  BellRing
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SystemConfig() {
  const [syncUrl, setSyncUrl] = useState("https://api.screensense.cloud/v1");
  const [heartbeat, setHeartbeat] = useState("60");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Configuration Saved",
        description: "System parameters updated successfully.",
      });
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <Settings className="w-8 h-8 text-accent" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">Core platform settings and backend orchestration parameters.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-accent" />
              Backend Connectivity
            </CardTitle>
            <CardDescription>Configure how devices communicate with the orchestration server.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cloud Sync Endpoint</Label>
              <Input value={syncUrl} onChange={e => setSyncUrl(e.target.value)} />
              <p className="text-[10px] text-muted-foreground italic">Target URL for real-time asset synchronization and logging.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Device Heartbeat (Seconds)</Label>
                <Input type="number" value={heartbeat} onChange={e => setHeartbeat(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Admin Session Timeout (Minutes)</Label>
                <Input type="number" value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" />
              Security & Access
            </CardTitle>
            <CardDescription>Global authentication policies for the ScreenSense network.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Require hardware key or mobile OTP for screen pairing.</p>
              </div>
              <Button variant="outline" size="sm">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-semibold text-sm">Automated Node Blacklisting</p>
                <p className="text-xs text-muted-foreground">Sever connection if a device misses 3 consecutive heartbeats.</p>
              </div>
              <Button variant="outline" size="sm" className="text-emerald-600 border-emerald-200">Active</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="ghost">Discard Changes</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
            Apply Global Config
          </Button>
        </div>
      </div>
    </div>
  );
}
