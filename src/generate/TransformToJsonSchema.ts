import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { inspect } from 'node:util';

import type {
	ExtendedSchema,
	JSONSchema,
	NullSchema,
	ObjectSchema
} from 'fluent-json-schema';
import S from 'fluent-json-schema';

import type ExecutionContext from '../services/ExecutionContext.js';

import type {
	BlocksContentField as IContentstackBlockField,
	ContentType as IContentstackContentType,
	DateContentField as IContentstackDateField,
	ContentField as IContentstackField,
	GroupContentField as IContentstackGroupField,
	NumberContentField as IContentstackNumberField,
	ReferenceContentField as IContentstackReferenceField,
	TextContentField as IContentstackTextField
} from './IGetAllContentTypesResponse.js';

type ISchema = Exclude<JSONSchema, ExtendedSchema | NullSchema> | ObjectSchema;

export default async function TransformToJsonSchema(
	ctx: ExecutionContext,
	contentstackSchema: readonly IContentstackContentType[]
) {
	const schema = new SchemaContext();
	const schemaPath = join(ctx.paths.workingDirectory, 'schema.json');

	for (const contentType of contentstackSchema) {
		const def = S.object();

		const required = contentType.schema
			.filter((s) => s.mandatory)
			.map((s) => s.uid);

		def.required(required);
		schema.addFields(contentType.schema).to(def);
		schema.addDefinition(contentType.uid, def);
	}

	const jsonSchema = schema.finalize();
	await writeFile(schemaPath, JSON.stringify(jsonSchema, null, 2), 'utf-8');
	return jsonSchema;
}

function addBasePropertiesFrom({
	display_name: title,
	field_metadata: { description } = {}
}: IContentstackField) {
	return {
		to: (fieldSchema: ISchema) => {
			if (title) {
				fieldSchema.title(title);
			}

			if (description) {
				fieldSchema.description(description);
			}
		}
	};
}

function dateSchemaFor(field: IContentstackDateField) {
	const schema = S.string();
	const format = field.field_metadata?.hide_time ? 'date' : 'date-time';
	schema.format(format);
	return schema;
}

function numberSchemaFor({ min, max }: IContentstackNumberField) {
	const schema = S.number();

	if (min !== undefined && min !== null) {
		schema.minimum(min);
	}

	if (max !== undefined && max !== null) {
		schema.maximum(max);
	}

	return schema;
}

function referenceSchemaFor(field: IContentstackReferenceField) {
	const schema = S.array();

	const contentTypeUid = S.string();
	contentTypeUid.enum(field.reference_to ?? []);

	const items = S.object();
	items.prop('uid', S.string());
	items.prop('_content_type_uid', contentTypeUid);
	items.required(['uid', '_content_type_uid']);
	schema.items(items);

	return schema;
}

function textSchemaFor(field: IContentstackTextField) {
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

class SchemaContext {
	public readonly builder = S.object();

	private readonly _definitions = new Map<string, ISchema>();
	private readonly _deferredDefinitionResolutions: (() => void)[] = [];

	public addDefinition(name: string, schema: ISchema) {
		if (this._definitions.has(name)) {
			throw new Error(`Duplicate definition: ${name}`);
		}

		this._definitions.set(name, schema);
		this.builder.definition(name, schema);
	}

	public addFields(fields: readonly IContentstackField[]) {
		return {
			to: (definition: ObjectSchema) => {
				for (const field of fields) {
					const fieldSchema = this.fieldSchemaFor(field);
					addBasePropertiesFrom(field).to(fieldSchema);
					definition.prop(field.uid, fieldSchema);
				}
			}
		};
	}

	public blockSchemaFor(field: IContentstackBlockField) {
		const schema = S.array();

		const items: ExtendedSchema[] = [];

		for (const block of field.blocks) {
			const containerSchema = S.object();
			const blockSchema = S.object();
			containerSchema.required([block.uid]);
			containerSchema.additionalProperties(false);
			containerSchema.prop(block.uid, blockSchema);
			items.push(containerSchema);

			const { reference_to: referencedSchema } = block;

			if (referencedSchema) {
				this.waitUntilAllDefinitionsAreAddedThen(() => {
					const referenceSchema = this._definitions.get(referencedSchema);

					if (!referenceSchema) {
						throw new Error(`Unknown reference: ${referencedSchema}`);
					}

					blockSchema.allOf([
						referenceSchema,
						this.getOrCreateBlockMetadataDefinition()
					]);
				});
			} else {
				const nestedSchema = S.object();
				this.addFields(block.schema).to(nestedSchema);

				blockSchema.allOf([
					nestedSchema,
					this.getOrCreateBlockMetadataDefinition()
				]);
			}
		}

		return schema.items(S.object().oneOf(items));
	}

	public fieldSchemaFor(field: IContentstackField): ISchema {
		const typedSchema = this.typedSchemaFor(field);
		addBasePropertiesFrom(field).to(typedSchema);

		// The "blocks" type is always an array and handles the "multiple" property
		// itself.
		if (field.multiple && field.data_type !== 'blocks') {
			return S.array().items(typedSchema);
		}

		return typedSchema;
	}

	public finalize() {
		for (const callback of this._deferredDefinitionResolutions) {
			callback();
		}

		const jsonSchema = this.builder.valueOf();
		this.finalize = () => jsonSchema;
		return jsonSchema;
	}

	private typedSchemaFor(field: IContentstackField): ISchema {
		switch (field.data_type) {
			case 'blocks':
				return this.blockSchemaFor(field);

			case 'boolean':
				return S.boolean();

			case 'file':
				return this.fileSchema();

			case 'global_field':
				return S.object().ref(`#/definitions/${field.reference_to}`);

			case 'group':
				return this.groupSchemaFor(field);

			case 'link':
				return this.linkSchema();

			case 'isodate':
				return dateSchemaFor(field);

			case 'json':
				console.warn('Cannot find documentation for JSON types.');
				return S.object();

			case 'number':
				return numberSchemaFor(field);

			case 'reference':
				return referenceSchemaFor(field);

			case 'text':
				return textSchemaFor(field);

			default:
				throw new Error(`Unknown field type: ${inspect(field)}`);
		}
	}

	private groupSchemaFor(field: IContentstackGroupField) {
		const schema = S.object();
		this.addFields(field.schema).to(schema);
		return schema;
	}

	private fileSchema() {
		this.getOrCreateFileDefinition();
		return S.object().ref('#/definitions/hosted-file');
	}

	private linkSchema() {
		this.getOrCreateLinkDefinition();
		return S.object().ref('#/definitions/link-field');
	}

	private getOrCreateLinkDefinition() {
		const name = 'link-field';
		const existing = this._definitions.get(name);
		if (existing) {
			return existing;
		}

		const created = S.object()
			.prop('title', S.string())
			.prop('href', S.string().format('uri'));

		this.addDefinition(name, created);
		return created;
	}

	private getOrCreateFileDefinition() {
		const name = 'hosted-file';
		const existing = this._definitions.get(name);
		if (existing) {
			return existing;
		}

		const created = S.object()
			.prop('uid', S.string())
			.prop('created_at', S.string().format('date-time'))
			.prop('updated_at', S.string().format('date-time'))
			.prop('created_by', S.string())
			.prop('updated_by', S.string())
			.prop('content_type', S.string())
			.prop('file_size', S.string().pattern(/^\d+$/u))
			.prop('tags', S.array().items(S.string()))
			.prop('filename', S.string())
			.prop('url', S.string().format('uri'))
			.prop('title', S.string())
			.required([
				'uid',
				'created_at',
				'updated_at',
				'created_by',
				'updated_by',
				'content_type',
				'file_size',
				'tags',
				'filename',
				'url',
				'title'
			]);

		this.addDefinition(name, created);
		return created;
	}

	private getOrCreateBlockMetadataDefinition() {
		const name = 'block-metadata';
		const existing = this._definitions.get(name);
		if (existing) {
			return existing;
		}

		const created = S.object();

		created.required(['_metadata']);

		created.prop(
			'_metadata',
			S.object().required(['uid']).prop('uid', S.string())
		);

		this.addDefinition(name, created);
		return created;
	}

	private waitUntilAllDefinitionsAreAddedThen(callback: () => void) {
		this._deferredDefinitionResolutions.push(callback);
	}
}
