import config from "@atlas/config/eslint";
const uiConfig = [
  ...config,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "no-restricted-imports": [
        "error",
        { patterns: ["**/apps/**", "**/features/**"] },
      ],
    },
  },
];

export default uiConfig;
