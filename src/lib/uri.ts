export const encodeUUIDToURI = (uuid: string) => {
  const hex: string = uuid.replace(/-/g, '');
  const bytes = new Uint8Array(hex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
  const binaryString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
  return btoa(binaryString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const decodeURIToUUID = (encoded: string) => {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = atob(base64);
  const bytes = Array.from(binaryString).map(char => char.charCodeAt(0));
  const hex = bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};