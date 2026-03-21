module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    'react-native-toast-message': '<rootDir>/__mocks__/react-native-toast-message.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|@react-native-async-storage|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-modules-core|expo-font|expo-asset|expo-linear-gradient|expo-splash-screen|react-native-sqlite-storage|@react-navigation|@tamagui|tamagui)/)',
  ],
};
