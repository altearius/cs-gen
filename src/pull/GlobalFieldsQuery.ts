import type { ValidateFunction } from 'ajv';

import type IContentType from '../models/IContentType.js';
import type ExecutionContext from '../services/ExecutionContext.js';

import ContentstackQuery from './ContentstackQuery.js';
import type { IGetAllGlobalFieldsResponse } from './GetAllGlobalFieldsResponse.schema.js';

export default class GlobalFieldsQuery extends ContentstackQuery<IGetAllGlobalFieldsResponse> {
	protected readonly _relativePath = '/v3/global_fields';

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
