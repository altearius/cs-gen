import type ExecutionContext from '../services/ExecutionContext.js';

import PrettifyUnreadableBullshit from './PrettifyUnreadableBullshit.js';
import PullSchemaFromContentstack from './PullSchemaFromContentstack.js';
import TransformToInterface from './TransformToInterface.js';
import TransformToJsonSchema from './TransformToJsonSchema.js';
import TransformToValidation from './TransformToValidation.js';

export default async function Generate(ctx: ExecutionContext) {
	console.info('Generating type definitions...');
	const files = await PullSchemaFromContentstack(ctx);

	console.info('Prettifying...');
	const contents = await PrettifyUnreadableBullshit(ctx, files);

	const jsonSchema = await TransformToJsonSchema(ctx, contents);
	await TransformToInterface(ctx, jsonSchema);
	await TransformToValidation(ctx, jsonSchema);
}
