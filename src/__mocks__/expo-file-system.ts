// Stub for expo-file-system in Jest (Node environment)
export const documentDirectory = '/mock/documents/';
export const downloadAsync = jest.fn().mockResolvedValue({ status: 200, uri: '/mock/file.txt' });
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: false });
export const readAsStringAsync = jest.fn().mockResolvedValue('');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);

export default {
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  makeDirectoryAsync,
};
