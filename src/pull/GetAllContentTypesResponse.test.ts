import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspect } from 'node:util';

import { describe, expect, it } from '@jest/globals';
import Ajv from 'ajv';

import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema';

import FixturePath from '#test/helpers/FixturePath.js';

describe('GetAllContentTypesResponse.schema', () => {
	it('should validate known-good JSON', async () => {
		// Arrange
		const [fixture, validator] = await Promise.all([
			loadFixture(),
			buildValidator()
		]);

		// Act
		const result = validator(fixture);

		// Assert
		if (!result) {
			console.error(
				inspect(validator.errors![0], { colors: true, depth: Infinity })
			);
		}

		expect(result).toBe(true);
	});
});

async function loadFixture() {
	const fixturePath = resolve(FixturePath, 'GetAllContentTypesResponse.json');

	const rawFixture = await readFile(fixturePath, 'utf8');
	return JSON.parse(rawFixture) as unknown;
}

async function buildValidator() {
	const [baseSchema, responseSchema] = await Promise.all([
		loadSchema(baseSchemaPath),
		loadSchema(responseSchemaPath)
	]);

	const ajv = new Ajv({
		loadSchema: async (uri) => {
			if (uri === 'ContentField.schema.json') {
				return baseSchema;
			}

			throw new Error(`Unexpected schema load: ${uri}`);
		}
	});

	return ajv.compileAsync<IGetAllContentTypesResponse>(responseSchema);
}

async function loadSchema(pathFn: () => string) {
	const rawSchema = await readFile(pathFn(), 'utf8');
	const parsed = JSON.parse(rawSchema) as unknown;
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	return parsed;
}

function baseSchemaPath() {
	return resolve(process.cwd(), 'src', 'pull', 'ContentField.schema.json');
}

function responseSchemaPath() {
	return resolve(
		process.cwd(),
		'src',
		'pull',
		'GetAllContentTypesResponse.schema.json'
	);
}
