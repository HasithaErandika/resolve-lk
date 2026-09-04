import { isValidNic } from '../lib/nic.js';

const CATEGORIES = ['Garbage', 'Road', 'Water', 'Lighting', 'Drainage', 'Sewerage', 'Public Safety', 'Other'];
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateNewIssue(body, hasPhoto) {
  const errors = {};
  const { nic, email, category, ward, landmark, description, latitude, longitude } = body;

  if (!hasPhoto) {
    errors.photo = 'Please attach a photo of the issue.';
  }

  if (!nic || !isValidNic(nic)) {
    errors.nic = 'Please enter a valid NIC number: either 9 digits followed by V/X, or 12 digits.';
  }
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please enter a valid email address. We use it to set up your account.';
  }
  if (!category || !CATEGORIES.includes(category)) {
    errors.category = `Category must be one of: ${CATEGORIES.join(', ')}.`;
  }
  if (!ward || !ward.trim()) {
    errors.ward = 'Please select a ward/zone.';
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

export { CATEGORIES, STATUSES };
