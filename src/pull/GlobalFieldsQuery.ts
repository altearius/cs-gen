import type { ValidateFunction } from 'ajv';

import type IContentType from '../models/IContentType.js';
import type IOptions from '../models/IOptions.js';

import { BuildValidator } from './BuildValidator.js';
import ContentstackQuery from './ContentstackQuery.js';
import type { IGetAllGlobalFieldsResponse } from './GetAllGlobalFieldsResponse.schema.js';

export default class GlobalFieldsQuery extends ContentstackQuery<IGetAllGlobalFieldsResponse> {
	protected readonly _relativePath = '/v3/global_fields';

	private constructor(
		options: IOptions,
		validator: ValidateFunction<IGetAllGlobalFieldsResponse>
	) {
		super(options, validator);
	}

	public static async create(options: IOptions) {
		const validator = await BuildValidator<IGetAllGlobalFieldsResponse>(
			'GetAllGlobalFieldsResponse'
		);

		return new GlobalFieldsQuery(options, validator);
	}

	protected override resolveCount({
		count,
		global_fields
	}: IGetAllGlobalFieldsResponse): number {
		if (count === undefined) {
			if (global_fields.length === 0) {
				return 0;
			}

			throw new Error('Expected count to be defined');
		}

		return count;
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
