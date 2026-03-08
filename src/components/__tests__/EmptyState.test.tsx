import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Users } from 'lucide-react'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Users} title="No hay datos" description="Agrega tu primer registro" />)
    expect(screen.getByText('No hay datos')).toBeInTheDocument()
    expect(screen.getByText('Agrega tu primer registro')).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const onAction = vi.fn()
    render(<EmptyState icon={Users} title="Test" description="Test" actionLabel="Agregar" onAction={onAction} />)
    const btn = screen.getByText('Agregar')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('does not render action button when not provided', () => {
    render(<EmptyState icon={Users} title="Test" description="Test" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
