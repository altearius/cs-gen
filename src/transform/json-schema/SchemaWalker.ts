import S from 'fluent-json-schema';
import { inspect } from 'node:util';
import { ContentType } from '../../models/ContentType.schema.yaml';
import { Field } from '../../models/Field.schema.yaml';
import EntryDefinition from './EntryDefinition.js';
import HostedFileDefinition from './HostedFileDefinition.js';
import type ISchema from './ISchema.js';
import LinkDefinition from './LinkFieldDefinition.js';
import MetadataDefinition from './MetadataDefinition.js';
import type SchemaCollection from './SchemaCollection.js';

export default class SchemaWalker {
	private readonly _definitions = new Map<string, ISchema>();

	public constructor(schema: SchemaCollection) {
		for (const contentType of schema) {
			if (schema.globalTypes.has(contentType.uid)) {
				this.processGlobalType(contentType);
			} else {
				this.processContentType(contentType);
			}
		}
	}

	public toJsonSchema() {
		const jsonSchema = [...this].reduce(
			(top, [uid, schema]) => top.definition(uid, schema),
			S.object()
		);

		return jsonSchema.valueOf();
	}

	public [Symbol.iterator]() {
		return this._definitions[Symbol.iterator]();
	}

	private processGlobalType(contentType: ContentType) {
		const schema = this.processContentTypeInterior(contentType);
		this._definitions.set(contentType.uid, schema);
	}

	private processContentType(contentType: ContentType) {
		const entryDef = this.getOrCreateEntryDefinition();
		const schema = this.processContentTypeInterior(contentType);
		const base = S.allOf([S.ref(`#/definitions/${entryDef}`), schema]);
		this._definitions.set(contentType.uid, base);
	}

	private processContentTypeInterior(contentType: ContentType) {
		return contentType.schema.reduce(
			(s, field) => s.prop(field.uid, this.processField(field)),
			S.object().required(identifyRequiredFields(contentType.schema))
		);
	}

	private processField(field: Field): ISchema {
		if ('taxonomies' in field) {
			throw new Error('');
		}

		if (!('data_type' in field)) {
			throw new Error(`Field is missing a data_type: ${inspect(field)}`);
		}

		switch (field.data_type) {
			case 'blocks':
				return this.processModularBlocksField(field);

			case 'boolean':
				return this.processBooleanField(field);

			case 'file':
				return this.processFileField(field);

			case 'global_field':
				return this.processGlobalField(field);

			case 'group':
				return this.processGroupField(field);

			case 'isodate':
				return this.processIsoDateField(field);

			case 'json':
				return this.processJsonField(field);

			case 'link':
				return this.processLinkField(field);

			case 'number':
				return this.processNumberField(field);

			case 'reference':
				return this.processReferenceField(field);

			case 'text':
				return this.processTextField(field);

			default:
				throw new Error(`Unknown field type: ${inspect(field)}`);
		}
	}

	private processJsonField(field: Extract<Field, { data_type: 'json' }>) {
		return applyBaseFieldsFrom(field).to(handleMultiple(field, S.raw({})));
	}

	private processLinkField(field: Extract<Field, { data_type: 'link' }>) {
		const name = this.getOrCreateLinkDefinition();
		const ref = S.ref(`#/definitions/${name}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processTextField(field: Extract<Field, { data_type: 'text' }>) {
		let schema: ISchema = S.string();

		if ('min' in field && typeof field.min === 'number' && field.min > 0) {
			schema = schema.minLength(field.min);
		}

		if ('max' in field && typeof field.max === 'number') {
			schema = schema.maxLength(field.max);
		}

		if ('format' in field && typeof field.format === 'string') {
			schema = schema.pattern(field.format);
		}

		if (isSelectField(field)) {
			schema = schema.enum(field.enum.choices.map((choice) => choice.value));
		}

		schema = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processReferenceField(
		field: Extract<Field, { data_type: 'reference' }>
	) {
		const referenced = field.reference_to;

		if (referenced.length === 0) {
			return applyBaseFieldsFrom(field).to(S.array().maxItems(0));
		}

		// References are always arrays, even if they are not flagged as "multiple"
		// and I don't know why.
		const ref = S.array().items(
			S.anyOf([
				S.object()
					.prop('uid', S.string())
					.prop('_content_type_uid', S.string().enum(referenced))
					.required(['uid', '_content_type_uid']),
				...referenced.map((refName) => S.ref(`#/definitions/${refName}`))
			])
		);

		return applyBaseFieldsFrom(field).to(ref);
	}

	private processNumberField(field: Extract<Field, { data_type: 'number' }>) {
		const { min, max } = field;
		let schema: ISchema = S.number();

		if (typeof min === 'number') {
			schema = schema.minimum(min);
		}

		if (typeof max === 'number') {
			schema = schema.maximum(max);
		}

		schema = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processBooleanField(
		field: Extract<Field, { data_type: 'boolean' }>
	): ISchema {
		const schema = handleMultiple(field, S.boolean());
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processGlobalField(
		field: Extract<Field, { data_type: 'global_field' }>
	): ISchema {
		const ref = S.ref(`#/definitions/${field.reference_to}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processIsoDateField(field: Extract<Field, { data_type: 'isodate' }>) {
		const format = field.field_metadata?.hide_time ? 'date' : 'date-time';
		const schema = S.string().format(format);
		const multiple = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processModularBlocksField(
		field: Extract<Field, { data_type: 'blocks' }>
	): ISchema {
		const possibleBlocks = field.blocks.map((block) => {
			const blockSchema = this.processModularBlocksBlock(block);
			return S.object().prop(block.uid, blockSchema).required([block.uid]);
		});

		const blocksContainer = S.object().oneOf(possibleBlocks);
		const modularBlocks = S.array().items(blocksContainer);
		return applyBaseFieldsFrom(field).to(modularBlocks);
	}

	private processModularBlocksBlock(
		block: NonNullable<
			Extract<Field, { data_type: 'blocks' }>['blocks']
		>[number]
	) {
		const metadataName = this.getOrCreateMetadataDefinition();

		if ('reference_to' in block) {
			if (typeof block.reference_to !== 'string') {
				throw new Error(
					`Expected a string for block.reference_to, but got ${inspect(
						block.reference_to
					)}`
				);
			}

			return S.object()
				.allOf([
					S.ref(`#/definitions/${block.reference_to}`),
					S.ref(`#/definitions/${metadataName}`)
				])
				.title(block.title);
		}

		const blockSchema = block.schema.reduce(
			(blockScheme, blockField) =>
				blockScheme.prop(blockField.uid, this.processField(blockField)),

			S.object()
				.required(identifyRequiredFields(block.schema))
				.title(block.title)
		);

		return S.object().allOf([
			S.ref(`#/definitions/${metadataName}`),
			blockSchema
		]);
	}

	private processFileField(
		field: Extract<Field, { data_type: 'file' }>
	): ISchema {
		const name = this.getOrCreateHostedFileDefinition();
		const ref = S.ref(`#/definitions/${name}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processGroupField(
		group: Extract<Field, { data_type: 'group' }>
	): ISchema {
		const metadataName = this.getOrCreateMetadataDefinition();

		let groupSchema: ISchema = S.object();

		for (const field of group.schema) {
			const fieldSchema = this.processField(field);
			groupSchema = groupSchema.prop(field.uid, fieldSchema);
		}

		groupSchema = groupSchema.required(identifyRequiredFields(group.schema));

		if (group.multiple) {
			groupSchema = S.object().allOf([
				S.ref(`#/definitions/${metadataName}`),
				groupSchema
			]);
		}

		groupSchema = handleMultiple(group, groupSchema);
		return applyBaseFieldsFrom(group).to(groupSchema);
	}

	private getOrCreateEntryDefinition() {
		const name = 'contentstack-entry';
		this.getOrCreateDefinition(name, EntryDefinition);
		return name;
	}

	private getOrCreateLinkDefinition() {
		const name = 'link-field';
		this.getOrCreateDefinition(name, LinkDefinition);
		return name;
	}

	private getOrCreateMetadataDefinition() {
		const name = 'metadata-container';
		this.getOrCreateDefinition(name, MetadataDefinition);
		return name;
	}

	private getOrCreateHostedFileDefinition() {
		const name = 'hosted-file';
		this.getOrCreateDefinition(name, HostedFileDefinition);
		return name;
	}

	private getOrCreateDefinition(
		name: string,
		creation: () => ISchema
	): ISchema {
		const existing = this._definitions.get(name);
		if (existing) {
			return existing;
		}

		const created = creation();
		this._definitions.set(name, created);
		return created;
	}
}

function applyBaseFieldsFrom(field: Exclude<Field, { taxonomies: unknown }>) {
	const meta = field.field_metadata ?? {};

	const title =
		typeof field.display_name === 'string' ? field.display_name : '';

	const description =
		typeof meta === 'object' && 'description' in meta ? meta.description : null;

	const docs =
		typeof description === 'string' && description.length > 0
			? description
			: title;

	return {
		to: (schema: ISchema) => {
			return docs ? schema.description(docs) : schema;
		}
	};
}

function handleMultiple(field: Field, schema: ISchema) {
	if (!field.multiple) {
		return schema;
	}

	let array = S.array().items(schema);

	if ('min_instance' in field && typeof field.min_instance === 'number') {
		array = array.minItems(field.min_instance);
	}

	if ('max_instance' in field && typeof field.max_instance === 'number') {
		array = array.maxItems(field.max_instance);
	}

	return array;
}

function identifyRequiredFields(schema: readonly Field[]) {
	// Mandatory fields are required because they are mandatory.
	//
	// Multiple fields are required because Contentstack always returns an array.
	// The array is empty if there are no values.
	//
	// Link fields are required because Contentstack always returns an object.
	// The object has empty strings for "title" and "href" if there is no value.
	// Last observed on 2023-07-31.
	//
	// Group fields are required because Contentstack always returns an object.
	// Last observed on 2023-07-31.
	const mandatory = schema.filter(
		(s) =>
			'taxonomies' in s ||
			s.mandatory ||
			(s.multiple ?? false) ||
			s.data_type === 'link' ||
			s.data_type === 'group'
	);

	const required = new Set(mandatory.map((s) => s.uid));
	return [...required].sort();
}

function isSelectField(field: Field): field is Extract<
	Field,
	{
		data_type: 'text';
		enum: { advanced: boolean; choices: { value: string }[] };
	}
> {
	return (
		'data_type' in field &&
		field.data_type === 'text' &&
		'enum' in field &&
		field.enum !== null
	);
}
