import type ExecutionContext from '../services/ExecutionContext.js';

import { BuildValidator } from './BuildValidator.js';
import ContentTypeQuery from './ContentTypeQuery.js';

export default async function GetContentTypes(ctx: ExecutionContext) {
	const types = [];
	const validator = await BuildValidator();
	const query = new ContentTypeQuery(ctx, validator);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
