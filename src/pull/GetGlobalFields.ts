import type ExecutionContext from '../services/ExecutionContext.js';

import { BuildContentTypeResponseValidator } from './BuildContentTypeResponseValidator.js';
import ContentTypeQuery from './ContentTypeQuery.js';

export default async function GetGlobalFields(ctx: ExecutionContext) {
	const types = [];
	const validator = await BuildContentTypeResponseValidator();
	const query = new ContentTypeQuery(ctx, validator);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
