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
    <footer className="mt-auto py-6 bg-white dark:bg-neutral-800/50 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700">
      <div className="container mx-auto px-4">
        <div className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          <p>Poslední deploy: {formatDate(buildTime)}</p>
        </div>
      </div>
    </footer>
  );
}
