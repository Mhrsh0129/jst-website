import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Received!",
      description: "We'll get back to you within 24 hours.",
    });
    setFormData({ name: "", phone: "", message: "" });
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-block text-accent font-semibold text-sm uppercase tracking-wider mb-2">
            Contact Us
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Visit Our Showroom
          </h2>
          <p className="text-muted-foreground">
            Located in the heart of Indore's textile hub, we welcome you to 
            explore our collection in person.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-card rounded-2xl p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    Our Address
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Ground Floor Shree Nath Palace,<br />
                    54 - Shiv Vilas Place,<br />
                    Subhash Chowk Power House Gali,<br />
                    Opp. Bohra Masjid, Rajwada,<br />
                    Indore, Madhya Pradesh
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Business Hours
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Mon - Sat: 10 AM - 8 PM
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      Get in Touch
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Call or WhatsApp
                    </p>
                    <p className="text-muted-foreground text-sm">
                      for inquiries
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* GST Info */}
            <div className="bg-primary/5 border border-primary/10 rounded-2xl p-6">
              <h3 className="font-semibold text-foreground mb-2">
                Business Registration
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                We are a GST registered wholesale business
              </p>
              <div className="inline-flex items-center gap-2 bg-background px-4 py-2 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground">GST:</span>
                <span className="font-mono text-sm font-semibold text-foreground">
                  23IOYPD7178E1ZG
                </span>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-card rounded-2xl p-6 lg:p-8 shadow-soft">
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">
              Send an Inquiry
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Fill out the form below and we'll get back to you shortly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all resize-none"
                  placeholder="Tell us about your requirements..."
                />
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full group">
                Send Inquiry
                <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
