// Stub for expo-sqlite in Jest (Node environment)
export const openDatabaseSync = jest.fn(() => ({
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
}));

export default { openDatabaseSync };
