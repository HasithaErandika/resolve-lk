// Mirrors backend/src/validation/issues.js and backend/src/lib/nic.js —
// keep both in sync if the rules change.

const NIC_REGEX = /^([0-9]{9}[VvXx]|[0-9]{12})$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidNic(nic: string) {
  return NIC_REGEX.test(nic.trim())
}

export function isValidEmail(email: string) {
  return EMAIL_REGEX.test(email.trim())
}

export interface ReportFormValues {
  nic: string
  email: string
  category: string
  ward: string
  landmark: string
  description: string
}

export type ReportFormErrors = Partial<Record<keyof ReportFormValues, string>>

export function validateReportForm(values: ReportFormValues): ReportFormErrors {
  const errors: ReportFormErrors = {}

  if (!values.nic || !isValidNic(values.nic)) {
    errors.nic = 'Please enter a valid NIC number — either 9 digits followed by V/X, or 12 digits.'
  }
  if (!values.email || !isValidEmail(values.email)) {
    errors.email = 'Please enter a valid email address — we use it to set up your account.'
  }
  if (!values.category) {
    errors.category = 'Please select a category.'
  }
  if (!values.ward.trim()) {
    errors.ward = 'Please select a ward/zone.'
  }
  if (!values.landmark.trim()) {
    errors.landmark = 'Please describe the nearest landmark so crews can find the location.'
  }
  if (!values.description.trim() || values.description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters so engineers have enough detail.'
  }

  return errors
}
