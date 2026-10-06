import Script from "next/script";
import "../src/index.css";
import Providers from "./providers";

export const metadata = {
  title: "MergeCanvas — Collaborative Whiteboard",
  description: "Create, collaborate, and merge ideas in real time with MergeCanvas.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
