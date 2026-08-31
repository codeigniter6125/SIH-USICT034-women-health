import "./globals.css";

export const metadata = {
  title: "She Care — Women's Health Companion",
  description: "Bilingual, culturally grounded AI women's health companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="bg-background text-on-surface font-body-base antialiased min-h-screen selection:bg-primary-container selection:text-primary">
        {children}
      </body>
    </html>
  );
}
