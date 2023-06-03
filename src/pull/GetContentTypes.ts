import type IOptions from '../models/IOptions.js';

import { BuildValidator } from './BuildValidator.js';
import ContentTypesQuery from './ContentTypesQuery.js';
import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema.js';

export default async function GetContentTypes(options: IOptions) {
	const types = [];

	const validator = await BuildValidator<IGetAllContentTypesResponse>(
		'GetAllContentTypesResponse'
	);

	const query = new ContentTypesQuery(options, validator);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
