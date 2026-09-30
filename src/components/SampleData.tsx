import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, meQuery } from '#/lib/api'
import { toISODate } from '#/lib/dates'
import { toast } from '#/lib/store'
import { Button } from '#/ui/zen'

/**
 * "Load sample data" fills the app in one click so it can be seen full; "Clear sample data"
 * goes back to the empty state and removes only what was loaded.
 */
export function SampleDataButton({
  size = 'md',
  variant = 'secondary',
}: {
  size?: 'sm' | 'md'
  variant?: 'secondary' | 'outline'
}) {
  const qc = useQueryClient()
  const { data: me } = useQuery(meQuery)
  const loaded = !!me?.sampleLoaded
  const run = useMutation({
    mutationFn: () =>
      loaded
        ? api('/me/sample', { method: 'DELETE' })
        : api('/me/sample', {
            method: 'POST',
            json: { today: toISODate(new Date()) },
          }),
    onSuccess: () => {
      void qc.invalidateQueries()
      toast({
        icon: loaded ? 'trash' : 'check',
        message: loaded ? 'Sample data cleared' : 'Sample data loaded',
        detail: loaded
          ? 'Back to how you started.'
          : 'Tasks, notes and habits to look around. Clear it any time in Profile.',
      })
    },
    onError: (e) =>
      toast({ tone: 'error', icon: 'alert', message: e.message, duration: 0 }),
  })
  if (!me) return null
  return (
    <Button
      size={size}
      variant={variant}
      icon={loaded ? 'trash' : 'plus'}
      loading={run.isPending}
      onClick={() => run.mutate()}
    >
      {loaded ? 'Clear sample data' : 'Load sample data'}
    </Button>
  )
}
