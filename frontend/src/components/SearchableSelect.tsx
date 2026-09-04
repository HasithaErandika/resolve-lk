import { useEffect, useRef, useState } from 'react'

interface SearchableSelectProps {
  id: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  hasError?: boolean
}

export function SearchableSelect({ id, value, onChange, options, placeholder, hasError }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
    : options

  function selectOption(option: string) {
    onChange(option)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left text-sm outline-none transition focus:ring-2 ${
          hasError
            ? 'border-maple/50 focus:border-maple focus:ring-maple/20'
            : 'border-bark/15 focus:border-pumpkin focus:ring-pumpkin/20'
        } ${value ? 'text-bark' : 'text-bark/40'}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-bark/40" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-bark/15 bg-white shadow-lg">
          <div className="border-b border-bark/10 p-2">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-md border border-bark/15 px-2.5 py-1.5 text-sm outline-none focus:border-pumpkin focus:ring-1 focus:ring-pumpkin/20"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-bark/40">No matches</li>
            ) : (
              filtered.map((option) => (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => selectOption(option)}
                    className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-pumpkin/5 ${
                      option === value ? 'bg-pumpkin/10 font-medium text-pumpkin' : 'text-bark'
                    }`}
                  >
                    {option}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
