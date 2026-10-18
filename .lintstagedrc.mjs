const config = {
  "*.{js,mjs,cjs,jsx,ts,mts,tsx}": [
    "eslint --fix --max-warnings=0",
    "prettier --write",
  ],
  // Route types live in .next/, which a fresh clone doesn't have yet.
  "*.{ts,mts,tsx}": () => ["next typegen", "tsc --noEmit"],
  "*.{json,md,css,yml,yaml}": "prettier --write",
};

export default config;
