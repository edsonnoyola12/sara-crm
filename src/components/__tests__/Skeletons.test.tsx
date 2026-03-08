import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import {
  SkeletonDashboard,
  SkeletonTable,
  SkeletonCards,
  SkeletonCalendar,
  SkeletonGeneric,
} from '../Skeletons'

describe('Skeletons', () => {
  it('renders SkeletonDashboard without crashing', () => {
    const { container } = render(<SkeletonDashboard />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders SkeletonTable without crashing', () => {
    const { container } = render(<SkeletonTable />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders SkeletonCards without crashing', () => {
    const { container } = render(<SkeletonCards />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders SkeletonCalendar without crashing', () => {
    const { container } = render(<SkeletonCalendar />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })

  it('renders SkeletonGeneric without crashing', () => {
    const { container } = render(<SkeletonGeneric />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
  })
})
