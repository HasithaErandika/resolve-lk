const NIC_REGEX = /^([0-9]{9}[VvXx]|[0-9]{12})$/;

export function isValidNic(nic) {
  return typeof nic === 'string' && NIC_REGEX.test(nic.trim());
}
