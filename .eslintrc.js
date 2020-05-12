module.exports = {
  extends: ["eslint:recommended", "standard", "plugin:prettier/recommended"],
  env: {
    es2020: true,
    node: true,
    mocha: true,
  },
  globals: {
    artifacts: "readonly",
    contract: "readonly",
    web3: true,
  },
  rules: {
    camelcase: [
      "error",
      { properties: "never", allow: ["run_tests", "test_suite_name"] },
    ],
  },
};
