import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Award } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-fabric.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Premium textile fabrics"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/60" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm border border-accent/30 rounded-full px-4 py-2 mb-6 animate-fade-in">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-sm text-primary-foreground/90 font-medium">
              Trusted Since 30+ Years
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-primary-foreground leading-tight mb-6 animate-slide-up">
            Premium Pocketing{" "}
            <span className="text-gradient-gold">Fabrics</span> for Your
            Business
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl animate-slide-up delay-100">
            Jay Shree Traders - Your trusted wholesale partner in Indore for
            quality pocketing fabrics at competitive prices ranging from ₹20 to
            ₹100 per meter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-slide-up delay-200">
            <Link to="/auth">
              <Button variant="gold" size="xl" className="group">
                Get Wholesale Prices
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <a href="#contact">
              <Button variant="heroOutline" size="xl">
                Request Samples
              </Button>
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in delay-300">
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <Shield className="w-5 h-5 text-accent" />
              <div>
                <p className="text-primary-foreground font-medium text-sm">
                  GST Registered
                </p>
                <p className="text-primary-foreground/60 text-xs">
                  Verified Business
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <Clock className="w-5 h-5 text-accent" />
              <div>
                <p className="text-primary-foreground font-medium text-sm">
                  Quick Delivery
                </p>
                <p className="text-primary-foreground/60 text-xs">
                  Fast Processing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm rounded-lg px-4 py-3">
              <Award className="w-5 h-5 text-accent" />
              <div>
                <p className="text-primary-foreground font-medium text-sm">
                  Quality Assured
                </p>
                <p className="text-primary-foreground/60 text-xs">
                  Premium Fabrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-primary-foreground/50 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
