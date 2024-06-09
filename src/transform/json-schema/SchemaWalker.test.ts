import SchemaCollection from '#src/transform/json-schema/SchemaCollection.js';
import SchemaWalker from '#src/transform/json-schema/SchemaWalker.js';
import FixturePath from '#test/helpers/FixturePath.js';
import { describe, expect, it } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import IContentType from '../../models/IContentType.js';

describe(SchemaWalker.name, () => {
	it('generates appropriate schema for link fields', async () => {
		// Arrange
		const [contentTypes, expected] = await loadFixtures();
		const globalTypes = new Map<string, IContentType>();
		const schema = new SchemaCollection(contentTypes, globalTypes);
		const walker = new SchemaWalker(schema);

		// Act
		const jsonSchema = walker.toJsonSchema() as {
			readonly definitions: {
				readonly link_variations: unknown;
			};
		};

		// Assert
		expect(jsonSchema.definitions.link_variations).toEqual(expected);
	});
});

async function loadFixtures() {
	const typePath = resolve(FixturePath, 'LinkVariationsContentType.json');
	const schemaPath = resolve(FixturePath, 'LinkVariationsSchema.json');

	const [rawType, rawSchema] = await Promise.all([
		readFile(typePath, 'utf-8'),
		readFile(schemaPath, 'utf-8')
	]);

	const contentType = JSON.parse(rawType) as IContentType;
	const schema = JSON.parse(rawSchema) as unknown;

	return [
		new Map<string, IContentType>([[contentType.uid, contentType]]),
		schema
	] as const;
}
