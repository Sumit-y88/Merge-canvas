import Script from "next/script";
import "../src/index.css";
import Providers from "./providers";

export const metadata = {
  title: "MergeCanvas — Collaborative Whiteboard",
  description: "Create, collaborate, and merge ideas in real time with MergeCanvas.",
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
