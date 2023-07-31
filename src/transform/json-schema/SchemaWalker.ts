import { inspect } from 'node:util';

import S from 'fluent-json-schema';

import type IContentType from '../../models/IContentType.js';
import type {
	IBlocksContentField,
	IBooleanContentField,
	IContentField,
	IDateContentField,
	IFileContentField,
	IGlobalContentField,
	IGroupContentField,
	IJsonContentField,
	ILinkContentField,
	INumberContentField,
	IReferenceContentField,
	ITextContentField
} from '../../pull/ContentField.schema.js';

import EntryDefinition from './EntryDefinition.js';
import HostedFileDefinition from './HostedFileDefinition.js';
import type ISchema from './ISchema.js';
import LinkDefinition from './LinkFieldDefinition.js';
import MetadataDefinition from './MetadataDefinition.js';
import type SchemaCollection from './SchemaCollection.js';

type IBlock = IBlocksContentField['blocks'][number];

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

	private processGlobalType(contentType: IContentType) {
		const schema = this.processContentTypeInterior(contentType);
		this._definitions.set(contentType.uid, schema);
	}

	private processContentType(contentType: IContentType) {
		const entryDef = this.getOrCreateEntryDefinition();
		const schema = this.processContentTypeInterior(contentType);
		const base = S.allOf([S.ref(`#/definitions/${entryDef}`), schema]);
		this._definitions.set(contentType.uid, base);
	}

	private processContentTypeInterior(contentType: IContentType) {
		return contentType.schema.reduce(
			(s, field) => s.prop(field.uid, this.processField(field)),
			S.object().required(identifyRequiredFields(contentType))
		);
	}

	private processField(field: IContentField): ISchema {
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

	private processJsonField(field: IJsonContentField) {
		return applyBaseFieldsFrom(field).to(handleMultiple(field, S.raw({})));
	}

	private processLinkField(field: ILinkContentField) {
		const name = this.getOrCreateLinkDefinition();
		const ref = S.ref(`#/definitions/${name}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processTextField(field: ITextContentField) {
		let schema: ISchema = S.string();

		if (field.min !== undefined && field.min > 0) {
			schema = schema.minLength(field.min);
		}

		if (field.max !== undefined) {
			schema = schema.maxLength(field.max);
		}

		if (field.format) {
			schema = schema.pattern(field.format);
		}

		if (field.enum) {
			schema = schema.enum(field.enum.choices.map((choice) => choice.value));
		}

		schema = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processReferenceField(field: IReferenceContentField) {
		const referenced = field.reference_to ?? [];

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

	private processNumberField(field: INumberContentField) {
		const { min, max } = field;
		let schema: ISchema = S.number();

		if (min !== undefined && min !== null) {
			schema = schema.minimum(min);
		}

		if (max !== undefined && max !== null) {
			schema = schema.maximum(max);
		}

		schema = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processBooleanField(field: IBooleanContentField): ISchema {
		const schema = handleMultiple(field, S.boolean());
		return applyBaseFieldsFrom(field).to(schema);
	}

	private processGlobalField(field: IGlobalContentField): ISchema {
		const ref = S.ref(`#/definitions/${field.reference_to}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processIsoDateField(field: IDateContentField) {
		const format = field.field_metadata?.hide_time ? 'date' : 'date-time';
		const schema = S.string().format(format);
		const multiple = handleMultiple(field, schema);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processModularBlocksField(field: IBlocksContentField): ISchema {
		const possibleBlocks = field.blocks.map((block) => {
			const blockSchema = this.processModularBlocksBlock(block);
			return S.object().prop(block.uid, blockSchema).required([block.uid]);
		});

		const blocksContainer = S.object().oneOf(possibleBlocks);
		const modularBlocks = S.array().items(blocksContainer);
		return applyBaseFieldsFrom(field).to(modularBlocks);
	}

	private processModularBlocksBlock(block: IBlock) {
		const metadataName = this.getOrCreateMetadataDefinition();

		if (block.reference_to) {
			return S.object()
				.allOf([
					S.ref(`#/definitions/${block.reference_to}`),
					S.ref(`#/definitions/${metadataName}`)
				])
				.title(block.title);
		}

		const required = block.schema.filter((x) => x.mandatory).map((x) => x.uid);

		const blockSchema = block.schema.reduce(
			(blockScheme, blockField) =>
				blockScheme.prop(blockField.uid, this.processField(blockField)),

			S.object().required(required).title(block.title)
		);

		return S.object().allOf([
			S.ref(`#/definitions/${metadataName}`),
			blockSchema
		]);
	}

	private processFileField(field: IFileContentField): ISchema {
		const name = this.getOrCreateHostedFileDefinition();
		const ref = S.ref(`#/definitions/${name}`);
		const multiple = handleMultiple(field, ref);
		return applyBaseFieldsFrom(field).to(multiple);
	}

	private processGroupField(group: IGroupContentField): ISchema {
		const metadataName = this.getOrCreateMetadataDefinition();

		let groupSchema: ISchema = S.object();

		for (const field of group.schema) {
			const fieldSchema = this.processField(field);
			groupSchema = groupSchema.prop(field.uid, fieldSchema);
		}

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

function applyBaseFieldsFrom({
	display_name: title,
	field_metadata: { description } = {}
}: IContentField) {
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

function handleMultiple(field: IContentField, schema: ISchema) {
	if (!field.multiple) {
		return schema;
	}

	const { min_instance: min, max_instance: max } = field;
	let array = S.array().items(schema);

	if (typeof min === 'number') {
		array = array.minItems(min);
	}

	if (typeof max === 'number') {
		array = array.maxItems(max);
	}

	return array;
}

function identifyRequiredFields(contentType: IContentType) {
	// Mandatory fields are required because they are mandatory.
	//
	// Multiple fields are required because Contentstack always returns an array.
	// The array is empty if there are no values.
	//
	// Link fields are required because Contentstack always returns an object.
	// The object has empty strings for "title" and "href" if there is no value.
	// Last observed on 2023-07-31.
	const mandatory = contentType.schema.filter(
		(s) => s.mandatory || s.multiple || s.data_type === 'link'
	);

	const required = new Set(mandatory.map((s) => s.uid));
	return [...required].sort();
}
