import type { ValidateFunction } from 'ajv';

import type ExecutionContext from '../services/ExecutionContext.js';

import ContentstackQuery from './ContentstackQuery.js';
import type { IGetAllContentTypesResponse } from './GetAllContentTypesResponse.schema.js';
import type { IGetAllGlobalFieldsResponse } from './GetAllGlobalFieldsResponse.schema.js';

type IContentType = IGetAllContentTypesResponse['content_types'][number];

export default class GlobalFieldsQuery extends ContentstackQuery<IGetAllGlobalFieldsResponse> {
	protected readonly _relativePath = '/v3/content_types';

	public constructor(
		_ctx: ExecutionContext,
		_validator: ValidateFunction<IGetAllGlobalFieldsResponse>
	) {
		super(_ctx, _validator);
	}

	protected override mutateQueryString(qs: URLSearchParams) {
		qs.set('include_global_field_schema', 'true');
	}

	protected override accessResponseContent(
		response: IGetAllGlobalFieldsResponse
	): IContentType[] {
		return response.global_fields;
	}
}
