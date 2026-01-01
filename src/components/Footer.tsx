// components/Footer.tsx
import Link from "next/link"; // Use Next.js Link for better performance
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker } from "react-icons/hi";

export default function Footer() {
  return (
    <footer className="relative bg-[#0a0a0a] text-gray-400 pt-16 pb-8 overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          
          {/* Brand Section - Takes up 4 columns */}
          <div className="lg:col-span-4 space-y-6">
            <h2 className="text-2xl font-bold text-white tracking-tighter">
              BIN<span className="text-orange-400">WATAN</span>
            </h2>
            <p className="text-sm leading-relaxed max-w-sm">
              Redefining Pakistani craftsmanship. We bring you premium quality goods 
              that bridge the gap between tradition and modern durability.
            </p>
            <div className="flex items-center space-x-4">
              {[
                { icon: <FaFacebookF />, href: "#", label: "Facebook" },
                { icon: <FaInstagram />, href: "#", label: "Instagram" },
                { icon: <FaTiktok />, href: "#", label: "TikTok" },
                { icon: <FaWhatsapp />, href: "#", label: "WhatsApp" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-orange-400 hover:text-white transition-all duration-300 border border-white/10"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Section - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Explore</h3>
            <ul className="space-y-4 text-sm">
              {['Home', 'Shop', 'About Us', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href={`/${item.toLowerCase().replace(' ', '')}`} className="hover:text-orange-400 transition-colors duration-200">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Get in Touch</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <HiOutlinePhone className="text-orange-400 text-lg shrink-0" />
                <span>0348 3016937</span>
              </li>
              <li className="flex items-start space-x-3">
                <HiOutlineMail className="text-orange-400 text-lg shrink-0" />
                <span>binwatan@gmail.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <HiOutlineLocationMarker className="text-orange-400 text-lg shrink-0" />
                <span>Karachi, Pakistan</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Section - Takes up 3 columns */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Newsletter</h3>
            <p className="text-xs mb-4">Subscribe for exclusive offers and launches.</p>
            <form className="flex group">
              <input 
                type="email" 
                placeholder="Your email" 
                className="bg-white/5 border border-white/10 rounded-l-md px-4 py-2 text-sm w-full focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button className="bg-orange-400 hover:bg-white text-white hover:text-orange-400 px-4 py-2 rounded-r-md text-sm font-medium transition-colors">
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} Bin Watan. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-[10px] uppercase tracking-widest font-medium">
            <a href="#" className="hover:text-white transition">Privacy Policy</a>
            <a href="#" className="hover:text-white transition">Terms of Service</a>
            <span className="text-gray-600">Made with ❤️ in Pakistan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}