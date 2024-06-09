import type IOptions from '../models/IOptions.js';
import PullSchemaFromContentstack from '../pull/PullSchemaFromContentstack.js';
import TransformToJsonSchema from '../transform/json-schema/TransformToJsonSchema.js';
import TransformToInterface from './TransformToInterface.js';
import TransformToValidation from './TransformToValidation.js';

export default async function Generate(options: IOptions) {
	const { contentTypes, globalTypes } = await PullSchemaFromContentstack(
		options
	);

	const jsonSchema = await TransformToJsonSchema(
		options,
		contentTypes,
		globalTypes
	);

	await Promise.all([
		TransformToInterface(options, jsonSchema),
		TransformToValidation(options, jsonSchema)
	]);
}
