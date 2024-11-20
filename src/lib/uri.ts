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

export const guessRawURL = (url: string): string => {
  const patterns = [
    {
      regex: /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/,
      transform: (match: RegExpMatchArray) =>
        `https://raw.githubusercontent.com/${match[1]}/${match[2]}/${match[3]}/${match[4]}`
    },
    {
      regex: /^https:\/\/gist\.github\.com\/([^/]+)\/(\w+)$/,
      transform: (match: RegExpMatchArray) =>
        `https://gist.githubusercontent.com/${match[1]}/${match[2]}/raw`
    },
    {
      regex: /^https:\/\/pastebin\.com\/(?!raw\/)(\w+)$/,
      transform: (match: RegExpMatchArray) =>
        `https://pastebin.com/raw/${match[1]}`
    }
  ];

  for (const { regex, transform } of patterns) {
    const match = url.match(regex);
    if (match) {
      return transform(match);
    }
  }
  
  return url;
};