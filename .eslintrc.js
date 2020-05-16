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
      parserOptions: { project: "./tsconfig.json" },
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
        "@typescript-eslint/camelcase": "off",
        "@typescript-eslint/no-floating-promises": [
          "error",
          { ignoreVoid: true, ignoreIIFE: true },
        ],
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
        "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
        "prettier/prettier": "warn",
        "no-var": "error",
        camelcase: "off",
      },
    },
  ],
};
