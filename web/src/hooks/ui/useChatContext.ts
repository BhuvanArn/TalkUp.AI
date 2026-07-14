import type { ChatContext } from '@/services/ai/types';
import { useRouterState } from '@tanstack/react-router';

/**
 * Derive the chatbot's page context from the current route so the app-wide
 * widget can ground its answers. Returns identifiers only (surface + owned
 * ids) — the server resolves the actual data under the user's ownership.
 *
 * Returns undefined on routes with no grounding surface (the widget then chats
 * generically).
 */
export const useChatContext = (): ChatContext | undefined => {
  const { pathname, search } = useRouterState({
    select: (s) => ({
      pathname: s.location.pathname,
      search: s.location.search as Record<string, unknown>,
    }),
  });

  // /applications/<id>/roadmap|simulations — the id is the second segment.
  const appMatch = pathname.match(
    /^\/applications\/([^/]+)\/(roadmap|simulations)/,
  );
  if (appMatch) {
    const applicationId = appMatch[1];
    return appMatch[2] === 'simulations'
      ? { surface: 'simulation', applicationId }
      : { surface: 'roadmap', applicationId };
  }

  if (pathname.startsWith('/agenda')) {
    return { surface: 'agenda' };
  }

  if (pathname.startsWith('/notes')) {
    const applicationId =
      typeof search.applicationId === 'string'
        ? search.applicationId
        : undefined;
    return { surface: 'notes', ...(applicationId ? { applicationId } : {}) };
  }

  if (pathname.startsWith('/cv-analysis')) {
    return { surface: 'cv' };
  }

  return undefined;
};
