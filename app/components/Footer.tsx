export default function Footer() {
  // Build time is injected at build time via Next.js environment variables
  const buildTime = process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString();

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);

    // Czech locale formatting
    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    return date.toLocaleDateString('cs-CZ', options);
  };

  return (
    <footer className="mt-auto py-6 bg-white/50 backdrop-blur-sm border-t border-gray-200">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-gray-600">
          <p>Poslední deploy: {formatDate(buildTime)}</p>
        </div>
      </div>
    </footer>
  );
}
