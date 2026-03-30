// Stub for expo-file-system (and expo-file-system/legacy) in Jest (Node environment)
export const documentDirectory = '/mock/documents/';
export const cacheDirectory = '/mock/cache/';
export const downloadAsync = jest.fn().mockResolvedValue({ status: 200, uri: '/mock/file.txt' });
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false });
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const createDownloadResumable = jest.fn().mockReturnValue({
  downloadAsync: jest.fn().mockResolvedValue({ status: 200, uri: '/mock/file.txt' }),
  pauseAsync: jest.fn(),
  resumeAsync: jest.fn(),
  savable: jest.fn(),
});
export const EncodingType = { UTF8: 'utf8', Base64: 'base64' } as const;

export default {
  documentDirectory,
  cacheDirectory,
  downloadAsync,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  makeDirectoryAsync,
  createDownloadResumable,
  EncodingType,
};
