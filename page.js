import Link from 'next/link';

const features = [
  { name: 'Courses', text: 'Video and written lessons, modules, lessons that unlock on a schedule, and progress tracking for every student.', ready: true },
  { name: 'Community', text: 'A discussion feed where your students post, comment, and encourage each other.', ready: true },
  { name: 'Your own brand', text: 'Each workspace has its own name, color, and invite link.', ready: true },
  { name: 'Payments', text: 'Sell courses and memberships, with money going straight to you.', ready: false },
  { name: 'Email', text: 'Welcome sequences and announcements to your whole list.', ready: false },
  { name: 'AI helpers', text: 'A course tutor and community helper trained on your own lessons.', ready: false },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-serif text-2xl font-semibold text-vine">Abundra</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn btn-quiet">Sign in</Link>
          <Link href="/login?mode=signup" className="btn btn-primary">Create your workspace</Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-24">
          <h1 className="max-w-4xl font-serif text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-7xl">
            Teach what you have been given, and gather the people who need it.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-stone">
            Abundra gives pastors, coaches, and schools one place to run courses and build a community around them.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/login?mode=signup" className="btn btn-primary px-6 py-3 text-base">Create your workspace</Link>
          </div>
        </section>

        <section className="border-t border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-x-12 gap-y-10 px-6 py-16 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.name} className={f.ready ? '' : 'opacity-70'}>
                <h2 className="font-serif text-xl font-semibold">{f.name}</h2>
                <p className="mt-2 leading-relaxed text-stone">{f.text}</p>
                {!f.ready && <p className="mt-2 text-sm font-medium text-harvest">Coming soon</p>}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-stone">
        © {new Date().getFullYear()} Abundra
      </footer>
    </div>
  );
}
