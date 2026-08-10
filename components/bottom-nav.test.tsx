import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './bottom-nav'
import AppLayout from '@/app/(app)/layout'

vi.mock('next/navigation', () => ({ usePathname: () => '/accounts' }))

describe('BottomNav', () => {
  it('renders all navigation items in order', () => {
    render(<BottomNav />)
    const labels = screen.getAllByRole('link').map((l) => l.textContent)
    expect(labels).toEqual(['Home', 'Accounts', 'Add', 'Bills', 'Profile'])
  })

  it('marks the tab matching the current path as current', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('aria-current', 'page')
  })

  it('does not mark non-matching tabs as current', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('gives every tab an accessible name, including the icon-only Add button', () => {
    render(<BottomNav />)
    for (const name of ['Home', 'Accounts', 'Add', 'Bills', 'Profile']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })

  it('stays viewport-fixed outside the filtered app surface', () => {
    const { container } = render(
      <AppLayout params={Promise.resolve({})}>
        <p>Screen content</p>
      </AppLayout>
    )

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav).toHaveClass('bottom-nav-fixed')
    expect(container.querySelector('.app-surface nav')).toBeNull()
  })
})
