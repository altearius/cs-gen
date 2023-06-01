import { inspect } from 'node:util';

import type { ValidateFunction } from 'ajv';

import type IContentType from '../models/IContentType.js';
import type ExecutionContext from '../services/ExecutionContext.js';

interface IResponse {
	readonly [k: string]: unknown;
	readonly count?: number;
}

export default abstract class ContentstackQuery<TResponse extends IResponse> {
	protected abstract readonly _relativePath: string;

	protected constructor(
		private readonly _ctx: ExecutionContext,
		private readonly _validator: ValidateFunction<TResponse>
	) {}

	public async *getAll(): AsyncGenerator<IContentType> {
		const limit = 100;
		let cursor = 0;

		const firstBatch = await this.getBatch(0, limit);
		const { count } = firstBatch;

		if (count === undefined) {
			throw new Error('Expected count to be defined');
		}

		for (const item of this.accessResponseContent(firstBatch)) {
			cursor += 1;
			yield item;
		}

		while (cursor < count) {
			const batch = await this.getBatch(cursor, limit);
			const items = this.accessResponseContent(batch);
			for (const item of items) {
				cursor += 1;
				yield item;
			}

			if (items.length === 0) {
				console.warn('Received empty batch');
				break;
			}
		}
	}

	private async getBatch(skip: number, limit: number) {
		const url = this.endpoint(skip, limit);

		const response = await fetch(url.toString(), {
			headers: {
				// Justification: This is the header name Contentstack expects.
				// eslint-disable-next-line @typescript-eslint/naming-convention
				api_key: this._ctx.apiKey,
				authorization: this._ctx.managementToken,
				branch: this._ctx.branch
			},
			method: 'GET'
		});

		const body = await response.json();

		if (!response.ok) {
			throw new Error(`Failed to get content types: ${response.statusText}`);
		}

		if (!this._validator(body)) {
			const errors = inspect(this._validator.errors, {
				colors: true,
				depth: 10
			});

			console.log(inspect(body, { colors: true, depth: 2 }));

			throw new Error(`Response body failed validation: ${errors}`);
		}

		return body;
	}

	private endpoint(skip: number, limit: number) {
		const qs = new URLSearchParams();
		this.mutateQueryString(qs);

		qs.set('limit', limit.toString());

		if (skip > 0) {
			qs.set('skip', skip.toString());
		} else {
			qs.set('include_count', 'true');
		}

		const relative = `${this._relativePath}?${qs.toString()}`;
		return new URL(relative, this._ctx.baseUrl);
	}

	protected abstract mutateQueryString(qs: URLSearchParams): void;
	protected abstract accessResponseContent(response: TResponse): IContentType[];
}
