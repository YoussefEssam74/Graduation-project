import Link from 'next/link';
import { Bot, TrendingUp, Users } from 'lucide-react';
import HomeNavbar from '@/components/public/HomeNavbar';
import AppLogo from '@/components/ui/AppLogo';

export default function HomeLanding() {
  const partnerMarks = ['IRONHUB', 'NOVA FITNESS', 'CORELAB', 'PULSE CLUB', 'LIFTWORKS'];

  const specs = [
    {
      title: 'Real-Time Responsiveness',
      value: '<120ms',
      description: 'Fast interface feedback for booking, tracking, and daily member actions.',
    },
    {
      title: 'Operational Reliability',
      value: '99.9%',
      description: 'Designed for stable gym operations across reception, coaching, and member flows.',
    },
    {
      title: 'Role-Aware Experience',
      value: '3 Profiles',
      description: 'Member, Coach, and Reception interfaces tuned for each daily workflow.',
    },
    {
      title: 'AI Guidance Depth',
      value: '24/7',
      description: 'Always-available support for fitness decisions, progress pacing, and motivation.',
    },
  ];

  const testimonials = [
    {
      quote:
        'The AI coach pushed me past my plateau in weeks. It understood my limits and still moved me forward.',
      author: 'Sara Jenkins',
      role: 'Member since 2022',
    },
    {
      quote:
        'Booking equipment before I arrive changed everything. No more awkward waiting around in peak hours.',
      author: 'Marcus Thompson',
      role: 'Pro Member',
    },
    {
      quote:
        'I actually look forward to cardio now because the app gives me visible progress and clear goals.',
      author: 'Elena Rodriguez',
      role: 'Token Enthusiast',
    },
  ];

  return (
    <div className="min-h-screen bg-[#eef2f8] text-[#0a1325]">
      <HomeNavbar />

      <section className="mx-auto w-full max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-3xl border border-[#1a2e4f]/40 shadow-[0_24px_80px_rgba(9,23,48,0.35)]"
          style={{
            backgroundImage:
              "linear-gradient(106deg, rgba(4,11,25,0.90) 22%, rgba(6,17,37,0.78) 54%, rgba(13,74,193,0.52) 100%), url('/images/gym-hero.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(61,152,255,0.42),transparent_38%)]" />

          <div className="relative z-10 grid min-h-[620px] gap-10 p-8 text-white md:grid-cols-[1.1fr_0.9fr] md:p-12">
            <div className="self-center">
              <p className="mb-5 inline-flex rounded-full border border-[#70b6ff]/45 bg-[#3d98ff]/20 px-4 py-1 text-xs font-semibold tracking-[0.16em] text-[#d0e9ff]">
                NEW AI ENGINE, NOW LIVE
              </p>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Ai-powered Fitness
                <span className="block text-[#53a7ff]">Human-Centered Results</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
                IntelliFit is the operating system for modern gyms, designed to align every member journey with real coaching impact and measurable momentum.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="rounded-xl bg-[#0b4fd4] px-8 py-3 text-sm font-bold text-white transition hover:bg-[#1f63e5]"
                >
                  Join IntelliFit
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-white/35 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Watch Demo
                </Link>
              </div>
            </div>

            <div className="flex items-end justify-end">
              <div className="w-full max-w-[290px] rounded-2xl border border-white/20 bg-[#071226]/78 p-5 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.15em] text-[#9ac8ff]">Today&apos;s Goal</p>
                <p className="mt-3 text-4xl font-bold">850</p>
                <p className="mt-1 text-sm text-white/75">Active Calories</p>
                <div className="mt-4 h-2 w-full rounded-full bg-white/15">
                  <div className="h-full w-3/4 rounded-full bg-[#3d98ff]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="mx-auto w-full max-w-6xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-4xl font-bold text-[#111a2b]">Results</h2>
          <p className="mt-2 text-[#6b778d]">A quick snapshot of measurable impact across the IntelliFit ecosystem.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-[#e1e6ef] bg-[#f6f8fc] p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0ff] text-[#2f73ec]">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#6f7d94]">Active Members</p>
            </div>
            <p className="mt-4 text-5xl font-bold text-[#111a2b]">12k+</p>
            <div className="mt-5 h-1 rounded bg-[#dde4ee]">
              <div className="h-full w-4/5 rounded bg-[#2f73ec]" />
            </div>
          </div>
          <div className="rounded-3xl border border-[#e1e6ef] bg-[#f6f8fc] p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e2f7f0] text-[#17a97c]">
                <Bot className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#6f7d94]">AI Plans Created</p>
            </div>
            <p className="mt-4 text-5xl font-bold text-[#111a2b]">58k+</p>
            <div className="mt-5 h-1 rounded bg-[#dde4ee]">
              <div className="h-full w-11/12 rounded bg-[#17a97c]" />
            </div>
          </div>
          <div className="rounded-3xl border border-[#e1e6ef] bg-[#f6f8fc] p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1e4] text-[#f27a2a]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#6f7d94]">Goal Success Rate</p>
            </div>
            <p className="mt-4 text-5xl font-bold text-[#111a2b]">99%</p>
            <div className="mt-5 h-1 rounded bg-[#dde4ee]">
              <div className="h-full w-full rounded bg-[#f27a2a]" />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d5e3fb] bg-white px-6 py-5">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#6d7f9a]">
            Trusted By Ambitious Fitness Teams
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {partnerMarks.map((name) => (
              <div
                key={name}
                className="rounded-xl border border-[#dce8ff] bg-[#f7fbff] px-4 py-3 text-center text-xs font-bold tracking-[0.14em] text-[#2452a7]"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-bold text-[#111a2b]">Smarter Fitness Features</h2>
            <p className="mt-3 max-w-2xl text-[#6b778d]">
              IntelliFit helps your gym become faster, more connected, and easier to scale without losing the human coaching edge.
            </p>
          </div>
          <a href="#pricing" className="rounded-full border border-[#d0def8] bg-white px-5 py-2 text-sm font-semibold text-[#1f4fad]">
            Explore All Features
          </a>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="overflow-hidden rounded-3xl border border-[#d4e4ff] bg-white lg:col-span-2">
            <div
              className="min-h-[260px] p-6 text-white"
              style={{
                backgroundImage:
                  "linear-gradient(96deg, rgba(4,11,25,0.88), rgba(4,11,25,0.52)), url('/images/gym-training.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <h3 className="text-3xl font-bold">AI Personal Coach</h3>
              <p className="mt-3 max-w-lg text-white/85">
                Real-time recommendations that adapt your training rhythm, recovery pace, and daily consistency.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-[#d4e4ff] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div
              className="mb-4 h-28 rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-equipment.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <h3 className="text-2xl font-bold text-[#0f2342]">Smart Booking</h3>
            <p className="mt-3 text-sm text-[#66738b]">
              Reserve key equipment before arrival and reduce gym-floor friction during peak time.
            </p>
          </div>
          <div className="rounded-3xl border border-[#1a2e4f] bg-[#0a1325] p-6 text-white transition hover:-translate-y-1 hover:shadow-2xl">
            <div
              className="mb-4 h-28 rounded-2xl"
              style={{
                backgroundImage: "linear-gradient(120deg, rgba(6,18,39,0.65), rgba(6,18,39,0.35)), url('/images/gym-community.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <h3 className="text-2xl font-bold">Token Economy</h3>
            <p className="mt-3 text-sm text-white/70">Progress turns into rewards that keep members engaged and committed.</p>
            <p className="mt-10 text-sm font-semibold text-[#8dbfff]">+500 PTS</p>
          </div>
          <div className="rounded-3xl border border-[#d4e4ff] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div
              className="mb-4 h-28 rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-coach.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <h3 className="text-2xl font-bold text-[#0f2342]">Hyper-Detailed Analytics</h3>
            <p className="mt-3 text-sm text-[#66738b]">
              Actionable insight for coaches and staff, from member adherence to growth patterns.
            </p>
          </div>
          <div className="rounded-3xl border border-[#d4e4ff] bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg">
            <div className="rounded-2xl border border-[#d4e4ff] bg-[linear-gradient(160deg,#eef5ff,#ffffff)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5d78a0]">Monthly Progress</p>
                <span className="rounded-full bg-[#e1edff] px-2 py-1 text-[10px] font-bold text-[#2f73ec]">+18%</span>
              </div>

              <div className="relative h-24 overflow-hidden rounded-xl border border-[#d7e6ff] bg-white p-2">
                <div className="absolute inset-x-0 top-1/2 h-px bg-[#edf3ff]" />
                <div className="absolute inset-x-0 top-1/4 h-px bg-[#f3f7ff]" />
                <div className="absolute inset-x-0 top-3/4 h-px bg-[#f3f7ff]" />

                <svg viewBox="0 0 240 88" className="h-full w-full">
                  <polyline
                    fill="none"
                    stroke="#94bdfd"
                    strokeWidth="2"
                    points="0,70 30,66 60,64 90,58 120,53 150,50 180,44 210,38 240,34"
                  />
                  <polyline
                    fill="none"
                    stroke="#2f73ec"
                    strokeWidth="3"
                    points="0,74 30,72 60,68 90,62 120,54 150,48 180,42 210,31 240,24"
                  />
                  <circle cx="240" cy="24" r="4" fill="#2f73ec" />
                </svg>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[#5f718d]">
                <div className="rounded-lg bg-[#f4f8ff] px-2 py-1.5 text-center">Strength</div>
                <div className="rounded-lg bg-[#f4f8ff] px-2 py-1.5 text-center">Endurance</div>
                <div className="rounded-lg bg-[#f4f8ff] px-2 py-1.5 text-center">Recovery</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#d5e3fb] bg-[linear-gradient(145deg,#ffffff,#f5f9ff)] p-7">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-3xl font-bold text-[#0f2342]">Built With Performance Specs</h3>
              <p className="mt-2 text-sm text-[#677791]">Every layer is tuned to keep your gym flow smooth, measurable, and reliable.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {specs.map((spec) => (
              <article key={spec.title} className="rounded-2xl border border-[#d7e5ff] bg-white p-5 transition hover:shadow-md">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5e769c]">{spec.title}</p>
                <p className="mt-3 text-4xl font-extrabold text-[#0b4fd4]">{spec.value}</p>
                <p className="mt-2 text-sm text-[#5e6e88]">{spec.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-56 rounded-3xl border border-[#d4e4ff] bg-white p-2">
            <div
              className="h-full w-full rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-training.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
          <div className="h-56 rounded-3xl border border-[#d4e4ff] bg-white p-2">
            <div
              className="h-full w-full rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-coach.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
          <div className="h-56 rounded-3xl border border-[#d4e4ff] bg-white p-2">
            <div
              className="h-full w-full rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-equipment.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
          <div className="h-56 rounded-3xl border border-[#d4e4ff] bg-white p-2">
            <div
              className="h-full w-full rounded-2xl"
              style={{
                backgroundImage: "url('/images/gym-community.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-5xl font-bold text-[#111a2b]">Simple, Transparent Pricing</h2>
          <p className="mt-3 text-[#6b778d]">Choose the plan that fits your fitness journey.</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-[#d4e4ff] bg-white p-7">
            <p className="text-sm font-semibold text-[#6b778d]">Starter</p>
            <p className="mt-3 text-5xl font-bold">$29<span className="text-base font-medium text-[#7e8ca2]">/mo</span></p>
            <p className="mt-4 text-sm text-[#6b778d]">Perfect for beginners starting their journey.</p>
          </div>

          <div className="rounded-3xl border border-[#14346f] bg-[#081327] p-7 text-white shadow-xl">
            <p className="inline-block rounded-full bg-[#2f73ec] px-3 py-1 text-xs font-bold uppercase">Most Popular</p>
            <p className="mt-4 text-sm font-semibold text-[#9dc4ff]">Pro Athlete</p>
            <p className="mt-2 text-5xl font-bold">$59<span className="text-base font-medium text-white/70">/mo</span></p>
            <p className="mt-4 text-sm text-white/70">Unlock the full power of AI coaching and analytics.</p>
            <button className="mt-7 w-full rounded-xl bg-[#2f73ec] px-5 py-3 text-sm font-semibold">Start Free Trial</button>
          </div>

          <div className="rounded-3xl border border-[#d4e4ff] bg-white p-7">
            <p className="text-sm font-semibold text-[#6b778d]">Elite</p>
            <p className="mt-3 text-5xl font-bold">$99<span className="text-base font-medium text-[#7e8ca2]">/mo</span></p>
            <p className="mt-4 text-sm text-[#6b778d]">For dedicated athletes and private coaching workflows.</p>
          </div>
        </div>
      </section>

      <section id="stories" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-[#111a2b]">Community Wins</h2>
        <div className="mt-7 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <article key={item.author} className="rounded-2xl border border-[#d4e4ff] bg-white p-6">
              <div className="mb-3 flex items-center gap-1 text-[#f5b301]" aria-label="5 star rating">
                <span>&#9733;</span>
                <span>&#9733;</span>
                <span>&#9733;</span>
                <span>&#9733;</span>
                <span>&#9733;</span>
              </div>
              <p className="text-[#1b2a41]">&quot;{item.quote}&quot;</p>
              <p className="mt-5 font-bold text-[#0f2342]">{item.author}</p>
              <p className="text-sm text-[#6e7b91]">{item.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#0f2b63] bg-[linear-gradient(120deg,#081327,#0b2f72)] p-8 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9fc7ff]">Ready To Launch</p>
            <h3 className="mt-2 text-3xl font-bold">Turn your gym into a high-performance digital experience.</h3>
            <p className="mt-2 text-white/80">Start with IntelliFit and give your members a smarter, cleaner journey from day one.</p>
          </div>
          <div className="mt-6 flex gap-3 md:mt-0">
            <Link href="/register" className="rounded-xl bg-[#2f73ec] px-6 py-3 text-sm font-bold text-white hover:bg-[#4180ef]">
              Create Account
            </Link>
            <Link href="/login" className="rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Log In
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-8 border-t border-[#d1ddf2] bg-[#f6f9ff]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div>
            <AppLogo textClassName="text-2xl text-[#102746]" />
            <p className="mt-3 text-sm text-[#64748b]">AI-powered gym management for modern fitness communities.</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#102746]">Product</h4>
            <ul className="mt-3 space-y-2 text-sm text-[#64748b]">
              <li>Features</li>
              <li>Pricing</li>
              <li>Download App</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#102746]">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-[#64748b]">
              <li>About Us</li>
              <li>Careers</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#102746]">Stay Updated</h4>
            <p className="mt-3 text-sm text-[#64748b]">Get product updates and fitness insights.</p>
            <div className="mt-4 flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full border border-[#c8d9f9] bg-white px-4 py-2 text-sm outline-none"
              />
              <button className="rounded-full bg-[#0b4fd4] px-5 py-2 text-sm font-semibold text-white">Subscribe</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
