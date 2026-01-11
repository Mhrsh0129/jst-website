import { Phone, MapPin, Mail, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-maroon dark:bg-gray-900 text-cream">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold">
              Jay Shree Traders
            </h3>
            <p className="text-cream/80 text-sm leading-relaxed">
              Trusted wholesale supplier of premium pocketing fabrics for over 30 years. 
              Quality, trust, and excellence in every thread.
            </p>
            <div className="flex items-center gap-2 text-sm text-cream/70">
              <span className="bg-gold/20 px-2 py-1 rounded text-xs font-medium text-gold">
                GST: 23IOYPD7178E1ZG
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#about" className="text-cream/80 hover:text-gold transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#products" className="text-cream/80 hover:text-gold transition-colors">
                  Our Products
                </a>
              </li>
              <li>
                <a href="#contact" className="text-cream/80 hover:text-gold transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/auth" className="text-cream/80 hover:text-gold transition-colors">
                  Login / Register
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 text-gold flex-shrink-0" />
                <span className="text-cream/80">
                  Ground Floor Shree Nath Palace, 54 - Shiv Vilas Place, 
                  Subhash Chowk Power House Gali, Opp. Bohra Masjid, 
                  Rajwada, Indore
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold" />
                <span className="text-cream/80">Contact for details</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold" />
                <span className="text-cream/80">info@jayshreetraders.com</span>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div className="space-y-4">
            <h4 className="font-display text-lg font-semibold">Business Hours</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gold" />
                <div>
                  <p className="text-cream/80">Monday - Saturday</p>
                  <p className="text-cream/60 text-xs">10:00 AM - 8:00 PM</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gold opacity-50" />
                <div>
                  <p className="text-cream/80">Sunday</p>
                  <p className="text-cream/60 text-xs">Closed</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-cream/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cream/60">
            <p>© 2024 Jay Shree Traders. All rights reserved.</p>
            <p>Serving the textile industry since 30+ years</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
