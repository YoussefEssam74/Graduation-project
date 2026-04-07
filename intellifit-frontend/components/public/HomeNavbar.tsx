import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';

export default function HomeNavbar() {
  return (
    <header className="w-full border-b border-[#dfe5f0] bg-[#f8faff] backdrop-blur-xl">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex">
          <AppLogo
            textClassName="text-2xl text-[#111a2b]"
            iconWrapClassName="border-[#dce7fb] bg-[#eef4ff]"
            iconClassName="text-[#2f73ec]"
          />
        </Link>

        <div className="hidden items-center gap-8 text-sm text-[#1f2b40] md:flex">
          <a href="#features" className="transition hover:text-[#0b4fd4]">Features</a>
          <a href="#results" className="transition hover:text-[#0b4fd4]">Results</a>
          <a href="#pricing" className="transition hover:text-[#0b4fd4]">Pricing</a>
          <a href="#stories" className="transition hover:text-[#0b4fd4]">Stories</a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#2f73ec] transition hover:text-[#1f63e5]"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-[#0b4fd4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1f63e5]"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
