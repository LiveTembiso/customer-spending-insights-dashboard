const config = {
  "*.{js,mjs,cjs,jsx,ts,mts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
  ],
  "*.{ts,mts,tsx}": () => "tsc --noEmit",
  "*.{json,md,css,yml,yaml}": "prettier --write",
};

export default config;
