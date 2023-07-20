import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import jest from 'eslint-plugin-jest';

export default [
	{
		files: ['**/*.js'],
		ignores: ['.jest/**/*', 'dist/**/*', 'node_modules/**/*'],
		rules: js.configs.recommended.rules
	},
	{
		files: ['src/**/*.ts', 'test/**/*.ts'],
		ignores: [
			// schema.d.ts files are generated code.
			'src/pull/*.schema.d.ts'
		],
		plugins: {
			'@typescript-eslint': ts
		},
		rules: {
			...js.configs.recommended.rules,
			...ts.configs['stylistic-type-checked'].rules,
			...ts.configs['strict-type-checked'].rules,

			// This rule is turned on by one of the recommended base sets,
			// but it conflicts with @typescript-eslint/promise-function-async,
			// and also yields false positives when (for instance), an interface
			// requires a method to return a Promise, but the implementation
			// method doesn't actually need to await anything.
			'@typescript-eslint/require-await': 'off'
		},

		languageOptions: {
			globals: {
				...globals.node,
				Blob: false
			},
			parser: tsParser,
			parserOptions: {
				project: ['tsconfig.json', 'src/tsconfig.json', 'test/tsconfig.json']
			}
		}
	},
	{
		files: ['src/**/*.test.ts', 'test/**/*.ts'],
		plugins: { jest },
		rules: {
			...jest.configs.recommended.rules,
			// Tests can afford to treat unexpected nulls as errors.
			'@typescript-eslint/no-non-null-assertion': 'off',

			// I like to use the `name` property of functions and classes to describe
			// what is being tested.
			'jest/valid-title': 'off'
		}
	}
];
