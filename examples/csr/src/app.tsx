import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { BasicPage } from './pages/basic'
import { PaginationPage } from './pages/pagination'
import { DependentPage } from './pages/dependent'
import { PlaceholderPage } from './pages/placeholder'
import { PollingPage } from './pages/polling'
import { InfinitePage } from './pages/infinite'
import { SuspensePage } from './pages/suspense'
import { MutationPage } from './pages/mutation'
import { OptimisticPage } from './pages/optimistic'
import { MutateWithPage } from './pages/mutate-with'

const NAV: Array<{ to: string; label: string }> = [
  { to: '/basic', label: 'Basic query' },
  { to: '/pagination', label: 'Reactive key (pagination)' },
  { to: '/dependent', label: 'Dependent queries' },
  { to: '/placeholder', label: 'placeholderData' },
  { to: '/polling', label: 'Polling' },
  { to: '/infinite', label: 'Infinite query' },
  { to: '/suspense', label: 'Suspense' },
  { to: '/mutation', label: 'Mutation + invalidate' },
  { to: '/optimistic', label: 'Optimistic update' },
  { to: '/mutate-with', label: 'mutateWith (per-call cb)' },
]

export function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>effector-tanstack-query</h1>
        <nav>
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to="/basic" replace />} />
          <Route path="/basic" element={<BasicPage />} />
          <Route path="/pagination" element={<PaginationPage />} />
          <Route path="/dependent" element={<DependentPage />} />
          <Route path="/placeholder" element={<PlaceholderPage />} />
          <Route path="/polling" element={<PollingPage />} />
          <Route path="/infinite" element={<InfinitePage />} />
          <Route path="/suspense" element={<SuspensePage />} />
          <Route path="/mutation" element={<MutationPage />} />
          <Route path="/optimistic" element={<OptimisticPage />} />
          <Route path="/mutate-with" element={<MutateWithPage />} />
        </Routes>
      </main>
    </div>
  )
}
