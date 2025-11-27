export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="flex min-h-screen items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0b4fd4 0%, #000 100%)'
      }}
    >
      <div className="w-full max-w-[400px] rounded-[20px] bg-white p-10 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            {/* Logo placeholder - add your logo image here */}
            <div className="h-16 w-16 rounded-full bg-[#0b4fd4] flex items-center justify-center text-white text-2xl font-bold">
              IF
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0b4fd4]">IntelliFit</h1>
          <p className="text-sm text-gray-600 mt-1">Smart Gym Management System</p>
        </div>
        {children}
      </div>
    </div>
  );
}
