"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc, addDoc, collection } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, Unlock, Key, Delete, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function PinShield() {
  const [isLocked, setIsLocked] = useState(false);
  const [masterPin, setMasterPin] = useState("884422"); // Fallback
  const [inputPin, setInputPin] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setIsLocked(d.isPanicLocked || false);
        if (d.masterPin) setMasterPin(d.masterPin);
      }
    });
    return unsub;
  }, []);

  const handleKeypadPress = (val: string) => {
    if (inputPin.length < 6) {
      setInputPin(prev => prev + val);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setInputPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleVerify = async () => {
    if (inputPin === masterPin) {
      setIsVerifying(true);
      
      // Log successful unlock
      await addDoc(collection(db, "auditLogs"), {
        event: "Panic Lockout Terminated",
        timestamp: new Date().toISOString(),
        status: "Success",
        details: "Manual PIN override successful. System restored."
      });

      // Clear global lockout
      await setDoc(doc(db, "settings", "global"), { isPanicLocked: false }, { merge: true });
      
      setTimeout(() => {
        setIsVerifying(false);
        setInputPin("");
        toast({
          title: "System Restored",
          description: "Operational integrity has been re-established.",
        });
      }, 1000);
    } else {
      setError(true);
      setInputPin("");
      // Log failed attempt
      await addDoc(collection(db, "auditLogs"), {
        event: "Unlock Attempt Failed",
        timestamp: new Date().toISOString(),
        status: "Blocked",
        details: "Invalid PIN entered during Panic Lockout."
      });
      toast({
        title: "Access Denied",
        description: "Invalid Master PIN. Entry logged.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (inputPin.length === 6) {
      handleVerify();
    }
  }, [inputPin]);

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white text-center select-none"
      >
        <div className="max-w-md w-full space-y-8 flex flex-col items-center">
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="p-6 rounded-3xl bg-red-600/20 border border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.3)]"
          >
            <ShieldAlert className="w-16 h-16 text-red-600" />
          </motion.div>

          <div className="space-y-2">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-red-600">Panic Lockout</h1>
            <p className="text-zinc-400 text-sm font-medium">System operations are currently severed. Enter Master Access PIN to restore authorization.</p>
          </div>

          <div className="flex gap-3 my-8">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-3xl font-black transition-all duration-300",
                  inputPin.length > i ? "bg-white text-zinc-950 border-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.5)]" : "bg-transparent border-zinc-800 text-zinc-800",
                  error && "border-red-600 text-red-600 animate-shake"
                )}
              >
                {inputPin.length > i ? "•" : ""}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 w-full max-w-[320px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeypadPress(num.toString())}
                className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all text-2xl font-black border border-white/5"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handleKeypadPress("0")}
              className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-700 active:scale-95 transition-all text-2xl font-black border border-white/5"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="h-16 rounded-2xl bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white active:scale-95 transition-all flex items-center justify-center border border-red-600/20"
            >
              <Delete className="w-8 h-8" />
            </button>
          </div>

          {isVerifying && (
            <div className="flex items-center gap-3 text-emerald-500 font-bold uppercase tracking-widest text-xs animate-pulse pt-4">
              <RefreshCw className="w-4 h-4 animate-spin" /> Authenticating...
            </div>
          )}

          <div className="pt-8 flex items-center gap-4 text-[10px] font-mono opacity-20 uppercase tracking-widest">
            <span>Security Layer: Active</span>
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
            <span>Encrypted Node</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
