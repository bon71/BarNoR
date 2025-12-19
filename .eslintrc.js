module.exports = {
  root: true,
  extends: '@react-native',
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ['jest.setup.js', '**/__tests__/**/*', '**/*.test.{ts,tsx,js,jsx}'],
      env: {
        jest: true,
      },
    },
    {
      files: ['**/*.mjs'],
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      env: {
        node: true,
        es2022: true,
      },
    },
  ],
};
