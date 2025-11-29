import "./globals.css"
import type { Metadata } from "next"
import Script from "next/script"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { CartProvider } from "@/context/CartContext"
import WhatsappButton from "@/components/ui/WhatsappButton"
import { FB_PIXEL_ID } from "@/lib/fpixel"

export const metadata: Metadata = {
  title: "Bin Watan",
  description: "Premium Bike Seat Covers by Bin Watan",
  icons: {
    icon: "/binwatan.jpeg",
    shortcut: "/binwatan.jpeg",
    apple: "/binwatan.jpeg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

        {/* ✅ Facebook Pixel */}
        <Script
          id="facebook-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>

        {/* ✅ TikTok Pixel */}
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                w.TiktokAnalyticsObject = t;
                var ttq = w[t] = w[t] || [];
                ttq.methods = [
                  "page","track","identify","instances","debug","on","off",
                  "once","ready","alias","group","enableCookie","disableCookie",
                  "holdConsent","revokeConsent","grantConsent"
                ];
                ttq.setAndDefer = function(t, e) {
                  t[e] = function() {
                    t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                  }
                };
                for (var i = 0; i < ttq.methods.length; i++) {
                  ttq.setAndDefer(ttq, ttq.methods[i]);
                }
                ttq.instance = function(t) {
                  for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
                    ttq.setAndDefer(e, ttq.methods[n]);
                  return e;
                };
                ttq.load = function(e, n) {
                  var r = "https://analytics.tiktok.com/i18n/pixel/events.js";
                  ttq._i = ttq._i || {};
                  ttq._i[e] = [];
                  ttq._i[e]._u = r;
                  ttq._t = ttq._t || {};
                  ttq._t[e] = +new Date;
                  ttq._o = ttq._o || {};
                  ttq._o[e] = n || {};
                  var s = d.createElement("script");
                  s.type = "text/javascript";
                  s.async = !0;
                  s.src = r + "?sdkid=D4LFDTRC77U10O2JEKV0&lib=" + t;
                  var a = d.getElementsByTagName("script")[0];
                  a.parentNode.insertBefore(s, a);
                };

                ttq.load('D4LFDTRC77U10O2JEKV0');
                ttq.page();
              }(window, document, 'ttq');
            `,
          }}
        />

      </head>

      <body className="flex flex-col min-h-screen">
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
