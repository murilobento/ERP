import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DatePicker } from './date-picker'

function renderPicker(
  props: Partial<React.ComponentProps<typeof DatePicker>> = {}
) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <DatePicker selected={undefined} onSelect={vi.fn()} {...props} />
    </QueryClientProvider>
  )
}

function dayButtons() {
  return Array.from(
    document.body.querySelectorAll<HTMLButtonElement>('button[data-day]')
  )
}

describe('DatePicker', () => {
  it('opens the calendar when the trigger is clicked', async () => {
    await renderPicker()

    await userEvent.click(document.body.querySelector('button')!)

    expect(dayButtons().length).toBeGreaterThan(0)
  })

  it('shows the selected date as dd/mm/aaaa', async () => {
    await renderPicker({ selected: new Date(2026, 0, 5) })

    const trigger = document.body.querySelector('button')!
    expect(trigger.textContent).toContain('05/01/2026')
  })

  it('closes the calendar after selecting a date', async () => {
    const onSelect = vi.fn()
    await renderPicker({ onSelect })

    await userEvent.click(document.body.querySelector('button')!)
    const day = dayButtons().find(
      (b) => b.parentElement?.getAttribute('data-today') === 'true'
    )
    expect(day).toBeTruthy()
    await userEvent.click(day!)

    expect(onSelect).toHaveBeenCalledWith(expect.any(Date))
    expect(dayButtons().length).toBe(0)
  })
})
