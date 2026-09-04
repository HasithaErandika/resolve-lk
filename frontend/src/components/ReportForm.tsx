import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { CATEGORIES } from '../types/issue'
import { WARDS } from '../data/wards'
import { validateReportForm, type ReportFormErrors, type ReportFormValues } from '../lib/validation'
import { SearchableSelect } from './SearchableSelect'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'

const INITIAL_VALUES: ReportFormValues = {
  nic: '',
  email: '',
  category: '',
  ward: '',
  landmark: '',
  description: '',
}

type SubmitState = 'idle' | 'submitting' | 'success'
type LocationStatus = 'idle' | 'locating' | 'tagged' | 'error'

interface Coordinates {
  lat: number
  lng: number
}

export function ReportForm() {
  const [values, setValues] = useState<ReportFormValues>(INITIAL_VALUES)
  const [otherWard, setOtherWard] = useState('')
  const [errors, setErrors] = useState<ReportFormErrors>({})
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [state, setState] = useState<SubmitState>('idle')
  const [points, setPoints] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [location, setLocation] = useState<Coordinates | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [locationError, setLocationError] = useState<string | null>(null)

  function handleChange(field: keyof ReportFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
    }
  }

  function setField(field: keyof ReportFormValues) {
    return (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }))
      if (field === 'ward' && value !== 'Other') setOtherWard('')
    }
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoName(file?.name ?? null)
  }

  function tagCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationError('Location services are not available in this browser.')
      return
    }

    setLocationStatus('locating')
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setLocationStatus('tagged')
      },
      (error) => {
        setLocationStatus('error')
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location access was denied. You can still submit without it.')
        } else if (error.code === error.TIMEOUT) {
          setLocationError('Could not get a location fix in time. Please try again.')
        } else {
          setLocationError('Could not determine your location. Please try again.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  function clearLocation() {
    setLocation(null)
    setLocationStatus('idle')
    setLocationError(null)
  }

  function effectiveWard() {
    return values.ward === 'Other' ? otherWard.trim() : values.ward
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const candidate: ReportFormValues = { ...values, ward: effectiveWard() }
    const validationErrors = validateReportForm(candidate)
    if (values.ward === 'Other' && !otherWard.trim()) {
      validationErrors.ward = 'Please specify your ward/zone.'
    }
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitError(null)
    setState('submitting')

    const formData = new FormData()
    formData.append('nic', values.nic.trim())
    formData.append('email', values.email.trim())
    formData.append('category', values.category)
    formData.append('ward', candidate.ward)
    formData.append('landmark', values.landmark)
    formData.append('description', values.description)
    if (photoFile) formData.append('photo', photoFile)
    if (location) {
      formData.append('latitude', String(location.lat))
      formData.append('longitude', String(location.lng))
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/issues`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.errors) setErrors(data.errors)
        setSubmitError(data.error || 'Could not submit your report. Please check the form and try again.')
        setState('idle')
        return
      }

      setPoints(data.contributor_points ?? 0)
      setState('success')
    } catch {
      setSubmitError('Could not reach the server. Please check your connection and try again.')
      setState('idle')
    }
  }

  function reportAnother() {
    setValues(INITIAL_VALUES)
    setOtherWard('')
    setErrors({})
    setPhotoName(null)
    setPhotoFile(null)
    setSubmitError(null)
    clearLocation()
    setState('idle')
  }

  if (state === 'success') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center rounded-3xl border border-bark/10 bg-white px-6 py-14 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-fern/15 text-fern">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <h3 className="mt-5 text-xl font-bold text-bark">Report submitted</h3>
        <p className="mt-2 text-sm text-bark/60">
          Your report has been triaged and added to the public queue. You earned{' '}
          <span className="font-semibold text-pumpkin">+10 contribution points</span>. Total:{' '}
          <span className="font-semibold text-bark">{points}</span>.
        </p>
        <button
          type="button"
          onClick={reportAnother}
          className="mt-8 rounded-lg border border-bark/15 bg-white px-5 py-2.5 text-sm font-semibold text-bark hover:bg-bark/5"
        >
          Report another issue
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <form onSubmit={handleSubmit} noValidate className="space-y-5 lg:col-span-2">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="NIC number" htmlFor="nic" error={errors.nic}>
            <input
              id="nic"
              value={values.nic}
              onChange={handleChange('nic')}
              type="text"
              placeholder="200112345678 or 720890283V"
              className={inputClass(Boolean(errors.nic))}
            />
            <p className="mt-1 text-xs text-bark/40">Old format: 9 digits + V/X (720890283V). New format: 12 digits (200112345678).</p>
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email}>
            <input
              id="email"
              value={values.email}
              onChange={handleChange('email')}
              type="email"
              placeholder="you@example.com"
              className={inputClass(Boolean(errors.email))}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <SearchableSelect
              id="category"
              value={values.category}
              onChange={setField('category')}
              options={CATEGORIES}
              placeholder="Select a category"
              hasError={Boolean(errors.category)}
            />
          </Field>
          <Field label="Ward / Zone" htmlFor="ward" error={values.ward !== 'Other' ? errors.ward : undefined}>
            <SearchableSelect
              id="ward"
              value={values.ward}
              onChange={setField('ward')}
              options={WARDS}
              placeholder="Select a ward/zone"
              hasError={Boolean(errors.ward)}
            />
            {values.ward === 'Other' && (
              <div className="mt-2">
                <input
                  value={otherWard}
                  onChange={(e) => setOtherWard(e.target.value)}
                  type="text"
                  placeholder="Type your ward/zone"
                  className={inputClass(Boolean(errors.ward))}
                />
                {errors.ward && <p className="mt-1 text-xs font-medium text-maple">{errors.ward}</p>}
              </div>
            )}
          </Field>
        </div>

        <Field label="Nearest landmark" htmlFor="landmark" error={errors.landmark}>
          <input
            id="landmark"
            value={values.landmark}
            onChange={handleChange('landmark')}
            type="text"
            placeholder="e.g. Opposite the bus stand"
            className={inputClass(Boolean(errors.landmark))}
          />
        </Field>

        <div>
          <label className="block text-sm font-medium text-bark">GPS location (optional)</label>
          <div className="mt-1">
            {locationStatus === 'tagged' && location ? (
              <div className="flex items-center justify-between rounded-lg border border-fern/30 bg-fern/5 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-fern">
                  <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Location tagged ({location.lat.toFixed(5)}, {location.lng.toFixed(5)})
                </span>
                <button type="button" onClick={clearLocation} className="text-xs font-semibold text-bark/50 hover:text-maple">
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={tagCurrentLocation}
                disabled={locationStatus === 'locating'}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-bark/20 bg-white px-4 py-3 text-sm font-medium text-bark/70 transition hover:border-pumpkin/40 hover:text-pumpkin disabled:opacity-60"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                    clipRule="evenodd"
                  />
                </svg>
                {locationStatus === 'locating' ? 'Getting your location…' : 'Tag my current location'}
              </button>
            )}
            {locationError && <p className="mt-1.5 text-xs font-medium text-maple">{locationError}</p>}
            <p className="mt-1.5 text-xs text-bark/40">
              Helps crews pinpoint the exact spot. Never required — the ward and landmark are enough on their own.
            </p>
          </div>
        </div>

        <Field label="Description" htmlFor="description" error={errors.description}>
          <textarea
            id="description"
            value={values.description}
            onChange={handleChange('description')}
            rows={4}
            placeholder="At least 20 characters. The more detail, the faster it can be triaged."
            className={inputClass(Boolean(errors.description))}
          />
          <p className="mt-1 text-xs text-bark/40">{values.description.trim().length}/20 characters minimum</p>
        </Field>

        <Field label="Photo (optional)" htmlFor="photo">
          <label
            htmlFor="photo"
            className="flex cursor-pointer items-center justify-between rounded-lg border border-dashed border-bark/20 bg-white px-4 py-3 text-sm text-bark/60 hover:border-pumpkin/40"
          >
            <span>{photoName ?? 'Choose a photo…'}</span>
            <span className="font-semibold text-pumpkin">Browse</span>
          </label>
          <input id="photo" type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </Field>

        {submitError && (
          <p className="rounded-lg bg-maple/10 px-3 py-2 text-sm font-medium text-maple">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={state === 'submitting'}
          className="w-full rounded-lg bg-pumpkin px-5 py-3 text-sm font-semibold text-birch shadow-sm shadow-pumpkin/30 transition hover:bg-pumpkin/90 disabled:cursor-wait disabled:opacity-70"
        >
          {state === 'submitting' ? 'Submitting…' : 'Submit report'}
        </button>
      </form>

      <aside className="space-y-6">
        <div className="rounded-2xl border border-bark/10 bg-white p-5">
          <h3 className="text-sm font-semibold text-bark">What happens next</h3>
          <ol className="mt-3 space-y-3 text-sm text-bark/60">
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pumpkin/15 text-xs font-bold text-pumpkin">1</span>
              Gemini reads your report and assigns a priority + department.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pumpkin/15 text-xs font-bold text-pumpkin">2</span>
              It appears on the public feed and the council&apos;s dashboard.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pumpkin/15 text-xs font-bold text-pumpkin">3</span>
              You earn +10 points now, +15 more when it&apos;s resolved.
            </li>
          </ol>
        </div>
        <div className="rounded-2xl bg-bark/5 p-5 text-xs leading-relaxed text-bark/50">
          Your NIC is only used to identify your reports and stop duplicate/fake accounts. It
          is not shown publicly on the feed.
        </div>
      </aside>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border bg-white px-3 py-2 text-sm text-bark outline-none transition focus:ring-2 ${
    hasError
      ? 'border-maple/50 focus:border-maple focus:ring-maple/20'
      : 'border-bark/15 focus:border-pumpkin focus:ring-pumpkin/20'
  }`
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-bark">
        {label}
      </label>
      <div className="mt-1">{children}</div>
      {error && <p className="mt-1 text-xs font-medium text-maple">{error}</p>}
    </div>
  )
}
