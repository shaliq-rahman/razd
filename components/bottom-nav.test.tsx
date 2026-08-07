import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BottomNav } from './bottom-nav'

vi.mock('next/navigation', () => ({ usePathname: () => '/accounts' }))

describe('BottomNav', () => {
  it('renders all five tabs in order', () => {
    render(<BottomNav />)
    const labels = screen.getAllByRole('link').map((l) => l.textContent)
    expect(labels).toEqual(['Home', 'Accounts', 'Add', 'Stats', 'Profile'])
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
    for (const name of ['Home', 'Accounts', 'Add', 'Stats', 'Profile']) {
      expect(screen.getByRole('link', { name })).toBeInTheDocument()
    }
  })
})
