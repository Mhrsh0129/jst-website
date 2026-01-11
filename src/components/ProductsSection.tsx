import { Button } from "@/components/ui/button";
import { ArrowRight, IndianRupee } from "lucide-react";
import { Link } from "react-router-dom";

const ProductsSection = () => {
  const products = [
    {
      name: "Economy Pocketing",
      priceRange: "₹20 - ₹30",
      description: "Budget-friendly options perfect for everyday garments",
      features: ["Durable", "Light Weight", "Basic Finish"],
      gradient: "from-muted to-muted/50",
    },
    {
      name: "Standard Pocketing",
      priceRange: "₹30 - ₹50",
      description: "Quality fabrics suitable for most garment types",
      features: ["Premium Quality", "Soft Touch", "Multiple Colors"],
      gradient: "from-secondary to-secondary/50",
      popular: true,
    },
    {
      name: "Premium Pocketing",
      priceRange: "₹50 - ₹100",
      description: "High-end fabrics for luxury and designer garments",
      features: ["Superior Finish", "Long Lasting", "Exclusive Range"],
      gradient: "from-accent/20 to-accent/10",
    },
  ];

  return (
    <section id="products" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-2">
            Our Products
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Pocketing Fabrics for Every Need
          </h2>
          <p className="text-muted-foreground">
            Browse our extensive collection of wholesale pocketing fabrics. 
            Login to view detailed pricing and place orders.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <div
              key={index}
              className={`relative bg-card rounded-2xl p-6 lg:p-8 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 ${
                product.popular ? "ring-2 ring-accent" : ""
              }`}
            >
              {product.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              {/* Gradient Header */}
              <div
                className={`h-24 rounded-xl bg-gradient-to-br ${product.gradient} mb-6 flex items-center justify-center`}
              >
                <IndianRupee className="w-10 h-10 text-foreground/30" />
              </div>

              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {product.name}
              </h3>
              <p className="text-2xl font-bold text-primary mb-3">
                {product.priceRange}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}/ meter
                </span>
              </p>
              <p className="text-muted-foreground text-sm mb-6">
                {product.description}
              </p>

              <ul className="space-y-2 mb-6">
                {product.features.map((feature, fIndex) => (
                  <li
                    key={fIndex}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/auth" className="block">
                <Button
                  variant={product.popular ? "gold" : "outline"}
                  className="w-full"
                >
                  View Details
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Login to access complete catalog with exact prices and place orders
          </p>
          <Link to="/auth">
            <Button variant="hero" size="lg" className="group">
              Login for Wholesale Prices
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;
