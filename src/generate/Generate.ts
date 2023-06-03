import PullSchemaFromContentstack from '../pull/PullSchemaFromContentstack.js';
import type ExecutionContext from '../services/ExecutionContext.js';
import TransformToJsonSchema from '../transform/json-schema/TransformToJsonSchema.js';

import TransformToInterface from './TransformToInterface.js';
import TransformToValidation from './TransformToValidation.js';

export default async function Generate(ctx: ExecutionContext, prefix: string) {
	const contentTypes = await PullSchemaFromContentstack(ctx);
	const jsonSchema = await TransformToJsonSchema(ctx, contentTypes);

	await Promise.all([
		TransformToInterface(ctx, jsonSchema, prefix),
		TransformToValidation(ctx, jsonSchema)
	]);
}
