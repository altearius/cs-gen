import GlobalFieldsQuery from '#src/pull/GlobalFieldsQuery.js';
import FixturePath from '#test/helpers/FixturePath.js';
import { describe, expect, it, jest } from '@jest/globals';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type IContentType from '../models/IContentType.js';

describe(GlobalFieldsQuery.name, () => {
	// 2023-07-19: Contentstack observed delivering a response with a missing
	// 'count' property when queried for global types, even with the "include
	// count" flag turned on.
	it('can handle a missing `count` property', async () => {
		// Arrange
		const fixture = await loadFixture();

		jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse(fixture));

		const types: IContentType[] = [];

		const query = await GlobalFieldsQuery.create({
			apiKey: '',
			baseUrl: 'https://cdn.contentstack.io/',
			branch: 'main',
			managementToken: '',
			prefix: ''
		});

		// Act
		for await (const type of query.getAll()) {
			types.push(type);
		}

		// Assert
		expect(types).toHaveLength(0);
	});
});

async function loadFixture() {
	const fixturePath = resolve(FixturePath, 'GetAllGlobalFieldsResponse.json');

	const rawFixture = await readFile(fixturePath, 'utf8');
	return JSON.parse(rawFixture) as unknown;
}

function mockResponse(json: unknown): Response {
	return {
		arrayBuffer: async () => new ArrayBuffer(0),
		blob: async () => new Blob([]),
		body: null,
		bodyUsed: false,
		clone: () => mockResponse(json),
		formData: async () => new FormData(),
		headers: new Headers(),
		json: async () => json,
		ok: true,
		redirected: false,
		status: 200,
		statusText: 'ok',
		text: async () => JSON.stringify(json),
		type: 'basic',
		url: ''
	};
}
