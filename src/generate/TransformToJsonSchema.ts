import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import S from 'fluent-json-schema';

import type ExecutionContext from '../services/ExecutionContext.js';

import type {
	ContentType as IContentstackContentType,
	ContentField as IContentstackField
} from './IGetAllContentTypesResponse.js';

export default async function TransformToJsonSchema(
	ctx: ExecutionContext,
	contentstackSchema: readonly IContentstackContentType[]
) {
	const builder = S.object();
	const schemaPath = join(ctx.paths.workingDirectory, `schema.json`);

	for (const contentType of contentstackSchema) {
		const def = S.object();

		const required = contentType.schema
			.filter((s) => s.mandatory)
			.map((s) => s.uid);

		def.additionalProperties(false);
		def.required(required);

		for (const field of contentType.schema) {
			const fieldSchema = fieldSchemaFor(field);

			if (field.display_name) {
				fieldSchema.description(field.display_name);
			}

			def.prop(field.uid, fieldSchema);
		}

		builder.definition(contentType.uid, def);
	}

	console.warn(
		'TODO: transform',
		contentstackSchema.length,
		'content types to JSON schema'
	);

	const jsonSchema = builder.valueOf();

	await writeFile(schemaPath, JSON.stringify(jsonSchema, null, 2), 'utf-8');

	return jsonSchema;
}

function fieldSchemaFor(field: IContentstackField) {
	switch (field.data_type) {
		case 'text':
			return textSchemaFor(field);

		case 'group':
			return S.object();

		default:
			console.warn(field);
			throw new Error(`Unknown field type: ${field.data_type as string}`);
	}
}

function textSchemaFor(field: IContentstackField) {
	if (field.multiple) {
		const array = S.array();
		array.items(textSchemaFor({ ...field, multiple: false }));

		if (field.min_instance !== undefined) {
			array.minItems(field.min_instance);
		}

		if (field.max_instance !== undefined) {
			array.maxItems(field.max_instance);
		}

		return array;
	}

	const schema = S.string();

	if (field.min !== undefined && field.min > 0) {
		schema.minLength(field.min);
	}

	if (field.max !== undefined) {
		schema.maxLength(field.max);
	}

	if (field.format) {
		schema.pattern(field.format);
	}

	if (field.enum) {
		schema.enum(field.enum.choices.map((choice) => choice.value));
	}

	return schema;
}
