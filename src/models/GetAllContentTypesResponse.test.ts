import { GetAllContentTypesResponse as Validator } from '#src/models/validate.mjs';
import FixturePath from '#test/helpers/FixturePath.js';
import { describe, expect, it } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { inspect } from 'node:util';

describe('GetAllContentTypesResponse.schema', () => {
	it('should validate known-good JSON', async () => {
		// Arrange
		const fixture = await loadFixture();

		// Act
		const result = Validator(fixture);

		// Assert
		if (!result) {
			if ('errors' in Validator && Array.isArray(Validator.errors)) {
				console.error(
					inspect(Validator.errors, { colors: true, depth: Infinity })
				);
			}
		}

		expect(result).toBe(true);
	});
});

async function loadFixture() {
	const fixturePath = resolve(FixturePath, 'GetAllContentTypesResponse.json');
	const rawFixture = await readFile(fixturePath, 'utf8');
	return JSON.parse(rawFixture) as unknown;
}
