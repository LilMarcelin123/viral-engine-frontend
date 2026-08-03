import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Music2, RefreshCw, Loader2, AlertCircle, CheckCircle, Users, Eye, TrendingUp, Trash2, X, SlidersHorizontal, Hash } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import ArtistSelector from "@/components/profiles/ArtistSelector";
import ScrapeSettingsModal from "@/components/profiles/ScrapeSettingsModal";

const platformConfig = {
  instagram: { Icon: Instagram, color: "from-purple-500 to-pink-500", label: "Instagram" },
  facebook: { Icon: Facebook, color: "from-blue-600 to-blue-400", label: "Facebook" },
  tiktok: { Icon: Music2, color: "from-gray-900 to-gray-700", label: "TikTok" }
};

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-[#7BA5F0] text-yellow-700", Icon: null },
  scraping: { label: "Scrapeando...", color: "bg-blue-100 text-blue-700", Icon: Loader2, spin: true },
  done: { label: "Listo", color: "bg-green-100 text-green-700", Icon: CheckCircle },
  error: { label: "Error", color: "bg-red-100 text-red-700", Icon: AlertCircle }
};

function fmt(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

export default function ProfileCard({ profile, onScrape, onDelete, onUpdated }) {
  const [showError, setShowError] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const { Icon: PlatformIcon, color } = platformConfig[profile.platform] || platformConfig.instagram;
  const status = statusConfig[profile.scrape_status] || statusConfig.pending;
  const StatusIcon = status.Icon;

  return (
    <>
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
      onClick={() => profile.scrape_status === "done" && navigate(`/profiles/${profile.id}`)}
    >
      <div className={cn("h-2 bg-gradient-to-r", color)} />
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", color)}>
              {profile.profile_pic_url
                ? <img src={profile.profile_pic_url} alt="" className="w-11 h-11 rounded-2xl object-cover" />
                : <PlatformIcon className="w-5 h-5 text-white" />
              }
            </div>
            <div>
              <p className="font-semibold text-foreground font-space">@{profile.username}</p>
              {profile.full_name && <p className="text-xs text-muted-foreground">{profile.full_name}</p>}
            </div>
          </div>
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", status.color)}>
            {StatusIcon && <StatusIcon className={cn("w-3 h-3", status.spin && "animate-spin")} />}
            {status.label}
          </span>
        </div>

        {profile.scrape_status === "done" && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
                <Users className="w-3 h-3" /> Seguidores
              </p>
              <p className="font-bold text-sm font-space">{fmt(profile.followers)}</p>
            </div>
            <div className="text-center bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
                <Eye className="w-3 h-3" /> Avg Views
              </p>
              <p className="font-bold text-sm font-space">{fmt(profile.avg_views)}</p>
            </div>
            <div className="text-center bg-muted/50 rounded-xl p-2">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3" /> Eng. %
              </p>
              <p className="font-bold text-sm font-space">{profile.avg_engagement_rate || 0}%</p>
            </div>
          </div>
        )}

        {profile.error_message && showError && (
          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-lg p-2 mb-3">
            <span className="flex-1">{profile.error_message}</span>
            <button
              onClick={(e) => { e.stopPropagation(); setShowError(false); }}
              className="flex-shrink-0 text-destructive/50 hover:text-destructive transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="mb-3">
          <ArtistSelector profile={profile} onUpdated={onUpdated} />
        </div>
        {profile.hashtag_filter?.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3 text-[11px] text-[#5B8DEF]/70">
            <Hash className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">Filtro: {profile.hashtag_filter.join(", ")}</span>
          </div>
        )}
        <div className="flex gap-2">
          {onScrape && (profile.scrape_status === "pending" || profile.scrape_status === "error" || profile.scrape_status === "done") && (
            <Button
              size="sm"
              variant="outline"
              onClick={e => { e.stopPropagation(); onScrape(profile); }}
              className="flex-1 gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {profile.scrape_status === "done" ? "Re-scrapear" : "Scrapear"}
            </Button>
          )}
          {profile.scrape_status === "done" && (
            <Button size="sm" className="flex-1" onClick={e => { e.stopPropagation(); navigate(`/profiles/${profile.id}`); }}>
              Ver análisis
            </Button>
          )}
          {onScrape && (
            <Button
              size="sm"
              variant="ghost"
              onClick={e => { e.stopPropagation(); setShowSettings(true); }}
              className="px-2 text-white/30 hover:text-[#5B8DEF] hover:bg-[#3B6FD4]/10"
              title="Ajustes de scraping"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={e => { e.stopPropagation(); onDelete(profile); }}
              className="px-2 text-white/30 hover:text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
    {showSettings && (
      <ScrapeSettingsModal
        profile={profile}
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={onUpdated}
      />
    )}
    </>
  );
}