import Ajv from 'ajv';
import ContentstackError from '../errors/ContentstackError.js';
import { GetAllGlobalFieldsResponse } from '../models/GetAllGlobalFieldsResponse.schema.yaml';
import { GetAllGlobalFieldsResponse as Validator } from '../models/validate.mjs';
import Client from './CreateClient.js';

export type GlobalField = Readonly<
	GetAllGlobalFieldsResponse['global_fields'][number]
>;

export default async function GetGlobalFields(
	client: Client
): Promise<readonly GlobalField[]> {
	const response = await client.GET('/v3/global_fields');

	ContentstackError.throwIfError(response.error, 'Failed to get content types');

	const result = response.data as unknown;

	if (!isResponse(result)) {
		if ('errors' in Validator && Array.isArray(Validator.errors)) {
			const ajv = new Ajv();
			throw new Error(ajv.errorsText(Validator.errors));
		}

		throw new Error('Invalid response');
	}

	return result.global_fields;
}

function isResponse(data: unknown): data is GetAllGlobalFieldsResponse {
	return Validator(data);
}
