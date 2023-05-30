import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspect } from 'node:util';

import { describe, expect, it } from '@jest/globals';
import Ajv from 'ajv';

import type { IGetAllContentTypesResponse } from '#src/generate/IGetAllContentTypesResponse';

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

function commonPath() {
	return resolve(process.cwd(), 'src', 'generate');
}

async function loadFixture() {
	const fixturePath = resolve(
		commonPath(),
		'GetAllContentTypesResponse.fixture.1.json'
	);

	const rawFixture = await readFile(fixturePath, 'utf8');
	return JSON.parse(rawFixture) as unknown;
}

async function buildValidator() {
	const schemaPath = resolve(
		commonPath(),
		'GetAllContentTypesResponse.schema.json'
	);

	const rawSchema = await readFile(schemaPath, 'utf8');
	const parsed = JSON.parse(rawSchema) as unknown;
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	const ajv = new Ajv();
	return ajv.compile<IGetAllContentTypesResponse>(parsed);
}
