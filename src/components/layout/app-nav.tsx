'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Briefcase, FileText, LogOut, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Job Hunt', icon: Briefcase },
  { href: '/documents', label: 'Documents', icon: FileText, protected: true },
];

export function AppNav() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();

  return (
    <header className="bg-white border-b border-[var(--color-border)] sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Navigation */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              if (item.protected && !user) return null;
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary-50)] text-[var(--color-primary)]'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Auth */}
          <div className="flex items-center gap-3">
            {loading ? null : user ? (
              <>
                <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">
                  {user.email}
                </span>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button variant="secondary" size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
