module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    // Note: needed for testRunnerCli
    '@babel/plugin-syntax-top-level-await'
  ]
};
