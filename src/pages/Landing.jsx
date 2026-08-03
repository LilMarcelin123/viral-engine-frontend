import LandingHero from "@/components/landing/LandingHero";
import LandingHowItWorks from "@/components/landing/LandingHowItWorks";
import LandingFeatures from "@/components/landing/LandingFeatures";
import LandingGrowth from "@/components/landing/LandingGrowth";
import LandingStats from "@/components/landing/LandingStats";
import LandingCTA from "@/components/landing/LandingCTA";
import { useAuth } from "@/lib/AuthContext";

export default function Landing() {
  const { navigateToLogin } = useAuth();
  return (
    <div className="min-h-screen bg-[#f6f8fd] overflow-x-hidden">
      <div className="bg-animated">
        <div className="bg-orb-1" style={{ background: "radial-gradient(circle at center, rgba(31,71,161,0.15) 0%, rgba(20,58,140,0.06) 40%, transparent 70%)" }} />
        <div className="bg-orb-2" style={{ background: "radial-gradient(circle at center, rgba(27,61,150,0.12) 0%, rgba(13,42,107,0.04) 45%, transparent 70%)" }} />
        <div className="bg-orb-3" style={{ background: "radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, transparent 65%)" }} />
        <div className="bg-scanlines" />
      </div>
      <div className="relative z-10">
        <LandingHero onLogin={navigateToLogin} />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingGrowth />
        <LandingStats />
        <LandingCTA onLogin={navigateToLogin} />
      </div>
    </div>
  );
}