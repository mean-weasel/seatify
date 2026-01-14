'use client';

/**
 * Compatibility layer for migrating from react-router-dom to Next.js navigation
 * This allows existing components to work with minimal changes during migration
 */

import { useRouter, usePathname, useParams, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, forwardRef } from 'react';
import NextLink from 'next/link';

/**
 * Link component that supports both react-router's `to` prop and Next.js's `href` prop
 */
interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string;
  href?: string;
  children: React.ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, href, children, ...props },
  ref
) {
  const destination = to || href || '/';
  return (
    <NextLink href={destination} ref={ref} {...props}>
      {children}
    </NextLink>
  );
});

/**
 * Hook that mimics react-router-dom's useNavigate
 */
export function useNavigate() {
  const router = useRouter();

  return useCallback((to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') {
      // Handle history navigation (back/forward)
      if (to === -1) {
        router.back();
      } else {
        // For other numbers, just go back (simplified)
        router.back();
      }
    } else {
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
    }
  }, [router]);
}

/**
 * Hook that mimics react-router-dom's useLocation
 */
export function useLocation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => ({
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
    state: null, // Next.js doesn't support location state in the same way
    key: 'default',
  }), [pathname, searchParams]);
}

/**
 * Re-export useParams from Next.js (API is compatible)
 */
export { useParams };

/**
 * Hook that mimics react-router-dom's useSearchParams
 * Returns a tuple-like object for compatibility
 */
export function useSearchParamsCompat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback((params: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams)) => {
    const newParams = typeof params === 'function'
      ? params(new URLSearchParams(searchParams?.toString() || ''))
      : params;
    router.push(`${pathname}?${newParams.toString()}`);
  }, [router, pathname, searchParams]);

  return [searchParams, setSearchParams] as const;
}

/**
 * NavLink component that works like react-router-dom's NavLink
 */
export function NavLink({
  to,
  children,
  className,
  activeClassName,
  ...props
}: {
  to: string;
  children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
  className?: string | ((props: { isActive: boolean }) => string);
  activeClassName?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'>) {
  const pathname = usePathname();
  const isActive = pathname === to || pathname?.startsWith(to + '/');

  const computedClassName = typeof className === 'function'
    ? className({ isActive })
    : `${className || ''} ${isActive && activeClassName ? activeClassName : ''}`.trim();

  return (
    <a href={to} className={computedClassName} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
}
