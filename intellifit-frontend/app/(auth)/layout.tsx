import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4 relative"
      style={{
        background: 'linear-gradient(135deg, #0b4fd4 0%, #000 100%)'
      }}
    >
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] rounded-[20px] bg-white dark:bg-gray-900 p-10 shadow-xl transition-colors duration-300">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {/* Logo placeholder - add your logo image here */}
            <div className="h-16 w-16 rounded-full bg-[#0b4fd4] dark:bg-[#18cef2] flex items-center justify-center text-white dark:text-gray-900 text-2xl font-bold">
              IF
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0b4fd4] dark:text-[#18cef2]">IntelliFit</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Smart Gym Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
