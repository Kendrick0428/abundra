'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function WorkspaceNav({ slug, isStaff }) {
  const pathname = usePathname();
  const base = `/w/${slug}`;
  const items = [
    { href: base, label: 'Courses', active: pathname === base || pathname.startsWith(`${base}/courses`) },
    { href: `${base}/community`, label: 'Community', active: pathname.startsWith(`${base}/community`) },
  ];
  if (isStaff) items.push({ href: `${base}/manage`, label: 'Manage', active: pathname.startsWith(`${base}/manage`) });

  return (
    <nav className="flex gap-1 md:flex-col" aria-label="Workspace">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? 'page' : undefined}
          className={`rounded-md px-3 py-2 text-sm font-medium ${item.active ? 'bg-dew text-ink' : 'text-stone hover:text-ink'}`}
          style={item.active ? { boxShadow: 'inset 3px 0 0 var(--brand)' } : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
