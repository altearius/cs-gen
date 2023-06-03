import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';

import type ExecutionContext from '../services/ExecutionContext.js';
import FormatAndSave from '../services/FormatAndSave.js';

export default async function TransformToInterface(
	ctx: ExecutionContext,
	jsonSchema: JSONSchema4
) {
	const result = await compile(jsonSchema, 'ContentstackSchema', {
		format: false,
		strictIndexSignatures: true,
		unknownAny: true,
		unreachableDefinitions: true
	});

	await FormatAndSave(ctx, 'schema.d.ts', 'typescript', result);
}
