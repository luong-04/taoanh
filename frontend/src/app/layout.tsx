import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POD Design Studio | State-Aware US Print-On-Demand Studio",
  description: "Local desktop studio for state-aware military & veteran apparel design and realistic mockup generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 min-h-screen selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}

