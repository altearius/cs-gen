import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { inspect } from 'node:util';

import Ajv from 'ajv';

import type ExecutionContext from '../services/ExecutionContext.js';

import type {
	ContentType as IContentstackContentType,
	IGetAllContentTypesResponse
} from './IGetAllContentTypesResponse.js';

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
): Promise<readonly IContentstackContentType[]> {
	const types = [];
	for await (const type of getAll(ctx)) {
		types.push(type);
	}

	return types;
}

async function* getAll(
	ctx: ExecutionContext
): AsyncGenerator<IContentstackContentType> {
	const limit = 100;
	let cursor = 0;
	const firstBatch = await getBatch(ctx, 0, limit);
	const { count } = firstBatch;

	if (count === undefined) {
		throw new Error('Expected count to be defined');
	}

	for (const item of firstBatch.content_types) {
		cursor += 1;
		yield item;
	}

	while (cursor < count) {
		const { content_types: types } = await getBatch(ctx, cursor, limit);
		for (const item of types) {
			cursor += 1;
			yield item;
		}

		if (types.length === 0) {
			console.warn('Received empty batch');
			break;
		}
	}
}

async function getBatch(ctx: ExecutionContext, skip: number, limit: number) {
	const url = endpoint(ctx, skip, limit);
	const validator = await buildValidator();

	const response = await fetch(url.toString(), {
		headers: {
			// Justification: This is the header name Contentstack expects.
			// eslint-disable-next-line @typescript-eslint/naming-convention
			api_key: ctx.apiKey,
			authorization: ctx.managementToken,
			branch: ctx.branch
		},
		method: 'GET'
	});

	const body = await response.json();

	if (!response.ok) {
		throw new Error(`Failed to get content types: ${response.statusText}`);
	}

	if (!validator(body)) {
		const errors = inspect(validator.errors, { colors: true, depth: 10 });
		throw new Error(`Response body failed validation: ${errors}`);
	}

	return body;
}

function endpoint(ctx: ExecutionContext, skip: number, limit: number) {
	const relativePath = '/v3/content_types';
	const qs = new URLSearchParams();
	qs.set('include_global_field_schema', 'true');
	qs.set('limit', limit.toString());

	if (skip > 0) {
		qs.set('skip', skip.toString());
	} else {
		qs.set('include_count', 'true');
	}

	const relative = `${relativePath}?${qs.toString()}`;
	return new URL(relative, ctx.baseUrl);
}

function schemaPath() {
	const thisUrl = new URL(import.meta.url);
	const thisPath = thisUrl.pathname;
	const dir = dirname(thisPath);
	return resolve(dir, 'GetAllContentTypesResponse.schema.json');
}

async function buildValidator() {
	const rawSchema = await readFile(schemaPath(), 'utf8');
	const parsed = JSON.parse(rawSchema) as unknown;
	if (typeof parsed !== 'object' || parsed === null) {
		throw new Error('Schema is not an object');
	}

	const ajv = new Ajv();
	return ajv.compile<IGetAllContentTypesResponse>(parsed);
}
