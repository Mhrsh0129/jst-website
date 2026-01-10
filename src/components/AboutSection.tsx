import { CheckCircle, Users, Package, TrendingUp } from "lucide-react";
import fabricTexture from "@/assets/fabric-texture.jpg";

const AboutSection = () => {
  const stats = [
    { number: "30+", label: "Years Experience", icon: TrendingUp },
    { number: "500+", label: "Happy Clients", icon: Users },
    { number: "1000+", label: "Products", icon: Package },
  ];

  const features = [
    "Premium quality pocketing fabrics",
    "Competitive wholesale pricing",
    "Wide range from ₹20 to ₹100/meter",
    "Bulk orders welcome",
    "GST registered business",
    "Trusted by generations of tailors",
  ];

  return (
    <section id="about" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Image Side */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-medium">
              <img
                src={fabricTexture}
                alt="Premium pocketing fabric"
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
            </div>
            
            {/* Floating Card */}
            <div className="absolute -bottom-6 -right-6 md:right-8 bg-card rounded-xl shadow-medium p-6 max-w-xs animate-float">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-foreground">30+</p>
                  <p className="text-sm text-muted-foreground">Years of Trust</p>
                </div>
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="space-y-6">
            <div>
              <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-2">
                About Us
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                A Legacy of Quality & Trust
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Jay Shree Traders</strong> has been a 
                cornerstone of the textile wholesale industry in Indore for over three 
                decades. Specializing in premium pocketing fabrics, we've built our 
                reputation on quality, reliability, and fair pricing.
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              Located in the heart of Rajwada, our showroom showcases an extensive 
              range of pocketing materials suitable for all garment types. From budget-friendly 
              options starting at ₹20 to premium varieties up to ₹100 per meter, we cater 
              to businesses of all sizes.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {stat.number}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
