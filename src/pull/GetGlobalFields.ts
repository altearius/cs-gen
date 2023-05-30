import type ExecutionContext from '../services/ExecutionContext.js';

import { BuildValidator } from './BuildValidator.js';
import type { IGetAllGlobalFieldsResponse } from './GetAllGlobalFieldsResponse.schema.js';
import GlobalFieldsQuery from './GlobalFieldsQuery.js';

export default async function GetGlobalFields(ctx: ExecutionContext) {
	const types = [];
	const validator = await BuildValidator<IGetAllGlobalFieldsResponse>(
		'GetAllGlobalFieldsResponse'
	);

	const query = new GlobalFieldsQuery(ctx, validator);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
