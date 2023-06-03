import type { ValidateFunction } from 'ajv';

import type IContentType from '../models/IContentType.js';
import type ExecutionContext from '../services/ExecutionContext.js';

import ContentstackQuery from './ContentstackQuery.js';
import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema.js';

export default class ContentTypesQuery extends ContentstackQuery<IGetAllContentTypesResponse> {
	protected readonly _relativePath = '/v3/content_types';

	public constructor(
		_ctx: ExecutionContext,
		_validator: ValidateFunction<IGetAllContentTypesResponse>
	) {
		super(_ctx, _validator);
	}

	protected override mutateQueryString(qs: URLSearchParams) {
		qs.set('include_global_field_schema', 'true');
	}

	protected override accessResponseContent(
		response: IGetAllContentTypesResponse
	): IContentType[] {
		return response.content_types;
	}
}
