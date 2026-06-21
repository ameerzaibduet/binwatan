"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa";
import { Products } from "@/lib/products";

const WhatsAppButton: React.FC = () => {
  const pathname = usePathname();
  const phoneNumber = "+923172017176"; // Your number
  const productMatch = pathname.match(/^\/products\/([^/]+)/);
  const categoryMatch = pathname.match(/^\/category\/([^/]+)/);

  const product = productMatch
    ? Products.find((item) => item.id === decodeURIComponent(productMatch[1]))
    : undefined;

  const category = product
    ? product.category
    : categoryMatch
      ? decodeURIComponent(categoryMatch[1])
      : "";

  const message = product
    ? `Hello! I want to know more about this product: ${product.name}. Category: ${product.category}.`
    : category
      ? `Hello! I want to know more about products in this category: ${category}.`
      : "Hello! I want to know more about your products.";

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
