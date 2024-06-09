import globals from 'globals';
import jest from 'eslint-plugin-jest';
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
	{
		files: ['**/*.js', '**/*.ts'],
		ignores: [
			'node_modules/**/*',

			// The following ignores refer to generated code:
			'.jest/**/*',
			'dist/**/*',
			'src/pull/*.schema.d.ts'
		],
		linterOptions: { reportUnusedDisableDirectives: true },
		rules: {
			...js.configs.recommended.rules,
			...prettier.rules,

			// "import/no-unresolved" is broken in vanilla JS due to a lack of
			// support for resolving ESM modules that use "exports" instead of "main"
			// in the package.json file, see:
			//
			// https://github.com/browserify/resolve/issues/222
			'import/no-unresolved': 'off',

			'import/order': ['error', { 'newlines-between': 'always' }],
			'import/no-amd': 'error',
			'import/no-commonjs': 'error',
			'import/no-absolute-path': 'error',
			'import/no-relative-packages': 'error',
			'import/no-self-import': 'error',
			'import/no-useless-path-segments': 'error',
			'import/no-webpack-loader-syntax': 'error',
			'import/consistent-type-specifier-style': ['error', 'prefer-top-level']
		}
	},
	{
		files: ['src/**/*.ts', 'test/**/*.ts'],
		ignores: [
			// schema.d.ts files are generated code.
			'src/pull/*.schema.d.ts'
		],
		plugins: { '@typescript-eslint': ts },

		languageOptions: {
			globals: {
				...globals.node,
				Blob: false
			},
			parser: tsParser,
			parserOptions: {
				project: 'src/tsconfig.json'
			}
		},

		rules: {
			...ts.configs['stylistic-type-checked'].rules,
			...ts.configs['strict-type-checked'].rules,
			...prettier.rules,

			'import/no-unresolved': 'error',

			// This rule is turned on by one of the recommended base sets,
			// but it conflicts with @typescript-eslint/promise-function-async,
			// and also yields false positives when (for instance), an interface
			// requires a method to return a Promise, but the implementation
			// method doesn't actually need to await anything.
			'@typescript-eslint/require-await': 'off'
		}
	},
	{
		files: ['src/**/*.test.ts', 'test/**/*.ts'],
		plugins: { jest },
		languageOptions: {
			parserOptions: {
				project: ['src/tsconfig.json', 'test/tsconfig.json']
			}
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: ['src/tsconfig.json', 'test/tsconfig.json']
				}
			}
		},
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
