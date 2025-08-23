import React from 'react'
import { render, screen } from '@testing-library/react'

// Simple test component
const TestComponent = () => <div data-testid="test-component">Test Component</div>

describe('Simple Test', () => {
  it('renders test component successfully', () => {
    render(<TestComponent />)
    expect(screen.getByTestId('test-component')).toBeInTheDocument()
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })

  it('performs basic assertion', () => {
    expect(2 + 2).toBe(4)
    expect('hello').toBe('hello')
    expect([1, 2, 3]).toEqual([1, 2, 3])
  })

  it('tests mock functions', () => {
    const mockFn = jest.fn()
    mockFn('test')
    expect(mockFn).toHaveBeenCalledWith('test')
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})