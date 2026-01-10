import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const IntroPage = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div
        className={`text-center max-w-2xl relative z-10 transition-all duration-1000 ${
          isVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10"
        }`}
      >
        {/* Logo/Brand */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-accent/20 rounded-full mb-6 animate-pulse">
            <span className="font-display text-3xl font-bold text-accent">
              JST
            </span>
          </div>
        </div>

        {/* Business Name */}
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-4">
          Jay Shree Traders
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-primary-foreground/80 mb-2 font-display">
          Premium Pocketing Fabrics
        </p>

        {/* Experience Badge */}
        <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
          <span className="text-accent text-sm font-semibold">★</span>
          <span className="text-primary-foreground/90 text-sm">
            Serving since 30+ years
          </span>
        </div>

        {/* Description */}
        <p className="text-primary-foreground/70 text-lg mb-10 max-w-md mx-auto leading-relaxed">
          Your trusted wholesale partner for quality pocketing fabrics in
          Indore. Competitive prices from ₹20 to ₹100 per meter.
        </p>

        {/* CTA */}
        <Link to="/">
          <Button
            variant="gold"
            size="xl"
            className="group shadow-gold"
          >
            Enter Website
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>

        {/* Address hint */}
        <p className="text-primary-foreground/50 text-sm mt-8">
          📍 Rajwada, Indore | GST: 23IOYPD7178E1ZG
        </p>
      </div>

      {/* Animated border */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent animate-shimmer" 
        style={{ backgroundSize: "200% 100%" }} 
      />
    </div>
  );
};

export default IntroPage;
