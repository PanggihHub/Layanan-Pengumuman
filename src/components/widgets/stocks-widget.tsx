"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

export function StocksWidget() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        // Using CoinGecko as a real-time free keyless source, mapped to look like a stock feed
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano&vs_currencies=usd&include_24hr_change=true"
        );
        const data = await res.json();
        
        const mapped: Asset[] = [
          { symbol: "BTC", name: "Bitcoin Core", price: data.bitcoin.usd, change: data.bitcoin.usd_24h_change },
          { symbol: "ETH", name: "Ethereum Net", price: data.ethereum.usd, change: data.ethereum.usd_24h_change },
          { symbol: "ADA", name: "Cardano Index", price: data.cardano.usd, change: data.cardano.usd_24h_change },
        ];
        setAssets(mapped);
      } catch (e) {
        console.error("Market fetch error", e);
      } finally {
        setLoading(false);
      }
    }

    fetchMarkets();
    const interval = setInterval(fetchMarkets, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full aspect-square bg-zinc-950 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl border border-white/5 text-white">
      <div className="flex flex-col gap-6 h-full justify-center">
        {loading ? (
          <div className="space-y-6 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-white/5 rounded-xl w-full" />
            ))}
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center justify-between group">
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-tight">{asset.symbol}</span>
                <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{asset.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-black tracking-tighter">
                  ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={cn(
                  "text-[9px] font-bold flex items-center justify-end gap-1 mt-0.5",
                  asset.change >= 0 ? "text-emerald-400" : "text-red-500"
                )}>
                  {asset.change >= 0 ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                  {asset.change.toFixed(2)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">Live Market Feed</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Connected</span>
        </div>
      </div>
    </div>
  );
}
