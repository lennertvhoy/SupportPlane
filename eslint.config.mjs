import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    ignores: ['**/dist/', '**/.next/', 'node_modules/', '.git/', '**/next-env.d.ts', '**/*.config.js', 'scripts/*.js', 'scripts/*.mjs'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  }
);
