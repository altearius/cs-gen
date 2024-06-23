import { Ajv } from 'ajv';
import ContentstackError from '../errors/ContentstackError.js';
import type { GetAllContentTypesResponse } from '../models/GetAllContentTypesResponse.schema.yaml';
import { GetAllContentTypesResponse as Validator } from '../models/validate.mjs';
import Client from './CreateClient.js';

export default async function GetContentTypes(client: Client) {
	const types = [];

	for await (const type of getAllContentTypes(client)) {
		types.push(type);
	}

	return types;
}

function isResponse(data: unknown): data is GetAllContentTypesResponse {
	return Validator(data);
}

async function* getAllContentTypes(client: Client) {
	let cursor = 0;
	let batch = await getBatch(client);
	yield* batch.content_types;
	cursor += batch.content_types.length;

	const count = batch.count ?? 0;

	while (cursor < count) {
		batch = await getBatch(client);
		yield* batch.content_types;
		cursor += batch.content_types.length;

		if (batch.content_types.length === 0) {
			console.warn('Received empty batch');
			break;
		}
	}
}

async function getBatch(client: Client, skip = 0) {
	const { data, error } = await client.GET('/v3/content_types', {
		params: {
			query: {
				include_count: 'true',
				include_global_field_schema: 'true',
				...(skip > 0 ? { skip } : {})
			}
		}
	});

	ContentstackError.throwIfError(error, 'Failed to get content types');

	const result = data as unknown;

	if (!isResponse(result)) {
		if ('errors' in Validator && Array.isArray(Validator.errors)) {
			const ajv = new Ajv();
			throw new Error(ajv.errorsText(Validator.errors));
		}

		throw new Error('Invalid response');
	}

	return result;
}
