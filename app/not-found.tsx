export default function NotFound() {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-white bg-dukes-bg-main">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h1 className="text-4xl font-black mb-4">404 - NOT FOUND</h1>
          <p className="text-tertiary">The requested resource could not be found.</p>
          <a href="/dashboard" className="mt-8 px-6 py-3 bg-primary rounded-xl font-black uppercase tracking-widest text-xs">
            Return to Dashboard
          </a>
        </div>
      </body>
    </html>
  );
}
