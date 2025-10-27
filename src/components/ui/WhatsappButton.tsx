"use client";

import React from "react";
import { FaWhatsapp } from "react-icons/fa";

const WhatsAppButton: React.FC = () => {
  const phoneNumber = "+923196674871"; // Your number
  const message = "Hello! I want to Know More about your product."; // Default message

  const whatsappLink = `https://wa.me/${phoneNumber.replace(
    /[^\d]/g,
    ""
  )}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-5 bottom-10 z-50 flex items-center justify-center w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all"
    >
      <FaWhatsapp size={28} />
    </a>
  );
};

export default WhatsAppButton;
