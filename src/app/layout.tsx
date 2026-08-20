import "./globals.css"
import type { Metadata } from "next"
import Script from "next/script"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/context/CartContext"
import WhatsappButton from "@/components/ui/WhatsappButton"

export const metadata: Metadata = {
  title: "Bin Watan",
  description: "Premium Bike Seat Covers by Bin Watan",
  icons: {
    icon: "/binwatan.jpeg",
    shortcut: "/binwatan.jpeg",
    apple: "/binwatan.jpeg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* ✅ Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RV02FMCX7E"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RV02FMCX7E');
          `}
        </Script>

        {/* =====================================================
            ✅ META PIXEL - MULTIPLE PIXELS
            Existing Pixel: 1936525783744544
            New Pixel:      1050586157582710
        ====================================================== */}
        <Script id="meta-pixels" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;
            n.push=n;
            n.loaded=!0;
            n.version='2.0';
            n.queue=[];
            t=b.createElement(e);
            t.async=!0;
            t.src=v;
            s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
            }(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');

            // ✅ Existing Bin Watan Pixel
            fbq('init', '1936525783744544');

            // ✅ New Meta Pixel
            fbq('init', '1050586157582710');

            // ✅ PageView
            fbq('track', 'PageView');
          `}
        </Script>

        {/* =====================================================
            ✅ TikTok Pixel
        ====================================================== */}
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject = t;
              var ttq = w[t] = w[t] || [];

              ttq.methods = [
                "page",
                "track",
                "identify",
                "instances",
                "debug",
                "on",
                "off",
                "once",
                "ready",
                "alias",
                "group",
                "enableCookie",
                "disableCookie",
                "holdConsent",
                "revokeConsent",
                "grantConsent"
              ];

              ttq.setAndDefer = function(t, e) {
                t[e] = function() {
                  t.push([
                    e
                  ].concat(
                    Array.prototype.slice.call(arguments, 0)
                  ))
                }
              };

              for (var i = 0; i < ttq.methods.length; i++) {
                ttq.setAndDefer(ttq, ttq.methods[i]);
              }

              ttq.load = function(e) {
                var s = d.createElement("script");
                s.async = true;
                s.src =
                  "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" +
                  e;

                d.getElementsByTagName("head")[0]
                  .appendChild(s);
              };

              ttq.load('D4LFDTRC77U10O2JEKV0');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      </head>

      <body className="flex flex-col min-h-screen">
        {/* =====================================================
            ✅ META PIXEL NOSCRIPT
        ====================================================== */}
        <noscript>
          {/* Existing Pixel */}
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1936525783744544&ev=PageView&noscript=1"
          />

          {/* New Pixel */}
          <img
            height="1"
            width="1"
            alt=""
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1050586157582710&ev=PageView&noscript=1"
          />
        </noscript>

        <CartProvider>
          <Navbar />

          <main className="flex-grow">
            {children}
            <WhatsappButton />
          </main>

          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}