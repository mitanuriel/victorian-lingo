module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // expo-router requires this for typed routes
      'expo-router/babel',
      // react-native-reanimated must be listed last
      'react-native-reanimated/plugin',
    ],
  };
};
