import type IOptions from '../models/IOptions.js';
import GlobalFieldsQuery from './GlobalFieldsQuery.js';

export default async function GetGlobalFields(options: IOptions) {
	const types = [];
	const query = await GlobalFieldsQuery.create(options);

	for await (const type of query.getAll()) {
		types.push(type);
	}

	return types;
}
