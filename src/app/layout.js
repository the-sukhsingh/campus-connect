import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import Navbar from "@/components/Navbar";
import ClientNotifications from "@/components/ClientNotifications";
import FirebaseInitializer from "@/components/ClientApp";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Separate viewport export as required by Next.js 15+
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export const metadata = {
  title: "Campus Connect",
  description: "A comprehensive campus management system",
  manifest: "/manifest.json",
  
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Campus Connect",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Campus Connect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Campus Connect" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4f46e5" />
        
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />

        {/* Firebase configuration for browser */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Make Firebase config available to browser scripts
              window.FIREBASE_API_KEY = "${process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''}";
              window.FIREBASE_AUTH_DOMAIN = "${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ''}";
              window.FIREBASE_PROJECT_ID = "${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''}";
              window.FIREBASE_STORAGE_BUCKET = "${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''}";
              window.FIREBASE_MESSAGING_SENDER_ID = "${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ''}";
              window.FIREBASE_APP_ID = "${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''}";
              window.FIREBASE_VAPID_KEY = "${process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || ''}";
            `,
          }}
        />

        {/* Register service worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                      console.log('Service Worker registered with scope:', registration.scope);
                    })
                    .catch(function(error) {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <NotificationProvider>
            <FirebaseInitializer />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <ClientNotifications />
              <main className="flex-grow">
                {children}
              </main>
            </div>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
