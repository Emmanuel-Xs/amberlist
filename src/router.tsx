import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { QueryClient } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'

/** First path segment: /tasks/abc and /tasks are the same page, so picking a task doesn't animate the whole page. */
const section = (path: string) => path.split('/')[1] ?? ''

export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: (n, err) =>
          n < 2 &&
          (err as { status?: number }).status !== 401 &&
          (err as { status?: number }).status !== 404,
      },
    },
  })
  const router = createTanStackRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) =>
        fromLocation &&
        section(fromLocation.pathname) === section(toLocation.pathname)
          ? false
          : ['page'],
    },
  })
  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
