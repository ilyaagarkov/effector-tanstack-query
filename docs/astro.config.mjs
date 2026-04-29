// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  // Update if hosted under a subpath; for username.github.io/effector-tanstack-query/
  site: 'https://ilyaagarkov.github.io',
  base: '/effector-tanstack-query',

  integrations: [
    starlight({
      title: 'effector-tanstack-query',
      description:
        'Effector bindings for TanStack Query — reactive data fetching with effector stores, SSR, and Suspense.',
      social: {
        github: 'https://github.com/ilyaagarkov/effector-tanstack-query',
      },
      editLink: {
        baseUrl:
          'https://github.com/ilyaagarkov/effector-tanstack-query/edit/master/docs/',
      },
      lastUpdated: true,
      sidebar: [
        {
          label: 'Introduction',
          items: [
            { label: 'Overview', slug: 'introduction/overview' },
            { label: 'Installation', slug: 'introduction/installation' },
            { label: 'Quick start', slug: 'introduction/quick-start' },
          ],
        },
        {
          label: 'Guides',
          items: [
            { label: 'Queries', slug: 'guides/queries' },
            { label: 'Mutations', slug: 'guides/mutations' },
            { label: 'Infinite queries', slug: 'guides/infinite-queries' },
            { label: 'SSR', slug: 'guides/ssr' },
            { label: 'Suspense', slug: 'guides/suspense' },
            { label: 'Naming & SIDs', slug: 'guides/naming-and-sids' },
          ],
        },
        {
          label: 'React',
          items: [
            { label: 'useQuery', slug: 'react/use-query' },
            { label: 'useMutation', slug: 'react/use-mutation' },
            { label: 'useInfiniteQuery', slug: 'react/use-infinite-query' },
            { label: 'useSuspenseQuery', slug: 'react/use-suspense-query' },
            {
              label: 'useSuspenseInfiniteQuery',
              slug: 'react/use-suspense-infinite-query',
            },
          ],
        },
        {
          label: 'API reference',
          items: [
            { label: 'createQuery', slug: 'api/create-query' },
            { label: 'createMutation', slug: 'api/create-mutation' },
            { label: 'createInfiniteQuery', slug: 'api/create-infinite-query' },
          ],
        },
      ],
    }),
  ],
})
