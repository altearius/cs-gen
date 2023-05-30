import type ExecutionContext from '../services/ExecutionContext.js';

import { BuildValidator } from './BuildValidator.js';
import ContentTypesQuery from './ContentTypesQuery.js';
import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema.js';

export default async function GetContentTypes(ctx: ExecutionContext) {
	const types = [];

	const validator = await BuildValidator<IGetAllContentTypesResponse>(
		'GetAllContentTypesResponse'
	);

	const query = new ContentTypesQuery(ctx, validator);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
