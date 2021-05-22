module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    'prettier/prettier': 'off',
  },
  // Note: needed for top level await in testRunnerCli
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  overrides: [
    {
      files: '*.test.js',
      env: {
        'mocha': true
      }
    }
  ]
};
