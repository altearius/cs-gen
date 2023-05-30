import type ExecutionContext from '../services/ExecutionContext.js';

import GetContentTypes from './GetContentTypes.js';
import type { ContentType as IContentstackContentType } from './IGetAllContentTypesResponse';

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
): Promise<readonly IContentstackContentType[]> {
	return GetContentTypes(ctx);
}
