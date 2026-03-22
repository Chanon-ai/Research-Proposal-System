module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  extends: [
    'plugin:vue/essential',
    'eslint:recommended'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'no-redeclare': 'warn',
    'vue/no-unused-components': 'warn',
    'vue/no-unused-vars': 'warn',
    'vue/no-dupe-keys': 'warn',
    'vue/no-side-effects-in-computed-properties': 'warn',
    'vue/require-valid-default-prop': 'warn'
  },
  overrides: [
    {
      files: [
        'tests/**/*.js',
        'tests/**/*.spec.js'
      ],
      env: {
        jest: true
      }
    }
  ]
}
