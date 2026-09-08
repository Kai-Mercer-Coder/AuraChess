/**
 * Root layout.
 *
 * Loads the three fonts used across the app (Inter = body, Playfair Display =
 * headings via `font-display`, Material Symbols = icons), applies global
 * Tailwind styles, and mounts the app-wide toast container.
 */
import type { Metadata } from "next";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuraChess — Free Game Review",
  description:
    "100% free, in-browser chess game review powered by local Stockfish. Paste a PGN and get every move classified.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastContainer
          position="bottom-center"
          hideProgressBar
          newestOnTop
          theme="dark"
          toastClassName="!bg-neutral-900 !border !border-white/10 !rounded-xl !text-white !text-sm !font-semibold !shadow-2xl !px-5 !py-3"
        />
      </body>
    </html>
  );
}
