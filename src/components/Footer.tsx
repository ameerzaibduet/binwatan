// components/Footer.tsx
import { FaFacebookF, FaInstagram, FaTiktok, FaWhatsapp } from "react-icons/fa"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* Brand Info */}
        <div>
          <h2 className="text-3xl font-extrabold tracking-wide text-white mb-3">
            Bin Watan
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Premium quality Pakistani-made products — crafted with care, built to last.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="/" className="hover:text-white transition">Home</a></li>
            <li><a href="/shop" className="hover:text-white transition">Shop</a></li>
            <li><a href="/about" className="hover:text-white transition">About Us</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contact</a></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <span className="font-medium text-gray-300">Phone:</span> 03483016937
            </li>
            <li>
              <span className="font-medium text-gray-300">Email:</span> binwatan@gmail.com
            </li>
            <li>
              <span className="font-medium text-gray-300">Location:</span> Karachi, Pakistan
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
          <div className="flex space-x-5 text-gray-400 text-2xl">
            <a
              href="#"
              aria-label="Facebook"
              className="hover:text-white transition transform hover:scale-110"
            >
              <FaFacebookF />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="hover:text-white transition transform hover:scale-110"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              aria-label="TikTok"
              className="hover:text-white transition transform hover:scale-110"
            >
              <FaTiktok />
            </a>
            <a
              href="#"
              aria-label="WhatsApp"
              className="hover:text-white transition transform hover:scale-110"
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} <span className="text-white font-semibold">Bin Watan</span>. All rights reserved.  
        <span className="block md:inline md:ml-2 text-gray-600">
          Made with ❤️ in Pakistan.
        </span>
      </div>
    </footer>
  )
}
