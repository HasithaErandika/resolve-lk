import { isValidNic } from '../lib/nic.js';

const CATEGORIES = ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'];
const STATUSES = ['Submitted', 'Acknowledged', 'In Progress', 'Resolved', 'Verified', 'Reopened'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateNewIssue(body) {
  const errors = {};
  const { nic, contact_email: contactEmail, category, council_id: councilId, ward, landmark, description, latitude, longitude } = body;

  if (!nic || !isValidNic(nic)) {
    errors.nic = 'Please enter a valid NIC number: either 9 digits followed by V/X, or 12 digits.';
  }
  if (!contactEmail || !EMAIL_REGEX.test(contactEmail.trim())) {
    errors.contact_email = 'Please enter a valid email address - we use it to send you a one-time code if you check your report history.';
  }
  if (!councilId || !UUID_REGEX.test(councilId)) {
    errors.council_id = 'Please select the council responsible for this area.';
  }
  if (!category || !CATEGORIES.includes(category)) {
    errors.category = `Category must be one of: ${CATEGORIES.join(', ')}.`;
  }
  if (!ward || !ward.trim()) {
    errors.ward = 'Please enter a ward or area name.';
  }
  if (!landmark || !landmark.trim()) {
    errors.landmark = 'Please describe the nearest landmark so crews can find the location.';
  }
  if (!description || description.trim().length < 20) {
    errors.description = 'Description must be at least 20 characters so engineers have enough detail.';
  }
  if (latitude !== undefined && latitude !== '' && (isNaN(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90)) {
    errors.latitude = 'GPS latitude looks invalid. Please retag your location.';
  }
  if (longitude !== undefined && longitude !== '' && (isNaN(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
    errors.longitude = 'GPS longitude looks invalid. Please retag your location.';
  }

  return errors;
}

export function validateStatus(status) {
  if (!status || !STATUSES.includes(status)) {
    return `Status must be one of: ${STATUSES.join(', ')}.`;
  }
  return null;
}

export function validateNic(nic) {
  if (!nic || !isValidNic(nic)) {
    return 'Please enter a valid NIC number: either 9 digits followed by V/X, or 12 digits.';
  }
  return null;
}

export function validateOtpCode(code) {
  if (!code || !/^\d{6}$/.test(String(code).trim())) {
    return 'Please enter the 6-digit code sent to your email.';
  }
  return null;
}

export { CATEGORIES, STATUSES };
