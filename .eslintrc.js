module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    mocha: true,
  },
  globals: {
    artifacts: "readonly",
    contract: "readonly",
    assert: "readonly",
    web3: true,
  },
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:prettier/recommended",
      ],
      rules: {
        "@typescript-eslint/no-unused-vars": [
          "warn",
          { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-use-before-define": [
          "error",
          { functions: false, classes: false },
        ],
        "prettier/prettier": "warn",
      },
    },
    {
      files: ["**/*.js"],
      extends: [
        "eslint:recommended",
        "standard",
        "plugin:prettier/recommended",
      ],
      rules: {
        camelcase: "error",
        "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "prettier/prettier": "warn",
        "no-var": "error",
      },
    },
  ],
};
