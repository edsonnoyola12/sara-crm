import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Users } from 'lucide-react'
import PageHeader from '../PageHeader'

describe('PageHeader', () => {
  it('renders title', () => {
    render(<PageHeader icon={Users} title="Leads" />)
    expect(screen.getByText('Leads')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<PageHeader icon={Users} title="Leads" subtitle="Gestion de prospectos" />)
    expect(screen.getByText('Gestion de prospectos')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<PageHeader icon={Users} title="Leads" badge={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders actions', () => {
    render(<PageHeader icon={Users} title="Leads" actions={<button>Add</button>} />)
    expect(screen.getByText('Add')).toBeInTheDocument()
  })
})
