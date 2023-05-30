import PullSchemaFromContentstack from '../pull/PullSchemaFromContentstack.js';
import type ExecutionContext from '../services/ExecutionContext.js';

import TransformToInterface from './TransformToInterface.js';
import TransformToJsonSchema from './TransformToJsonSchema.js';
import TransformToValidation from './TransformToValidation.js';

export default async function Generate(ctx: ExecutionContext) {
	const contentstackSchema = await PullSchemaFromContentstack(ctx);
	const jsonSchema = await TransformToJsonSchema(ctx, contentstackSchema);
	await TransformToInterface(ctx, jsonSchema);
	await TransformToValidation(ctx, jsonSchema);
}
