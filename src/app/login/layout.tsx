

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900/20">
            {children}
        </div>
  );
}
