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
	ILinkContentField,
	INumberContentField,
	IReferenceContentField,
	ITextContentField
} from '../../pull/ContentField.schema.js';

import BlockMetadataDefinition from './BlockMetadataDefinition.js';
import HostedFileDefinition from './HostedFileDefinition.js';
import type ISchema from './ISchema.js';
import LinkDefinition from './LinkFieldDefinition.js';
import type SchemaCollection from './SchemaCollection.js';

type IBlock = IBlocksContentField['blocks'][number];

export default class SchemaWalker {
	private readonly _definitions = new Map<string, ISchema>();

	public constructor(schema: SchemaCollection) {
		for (const contentType of schema) {
			this.processContentType(contentType);
		}
	}

	public [Symbol.iterator]() {
		return this._definitions[Symbol.iterator]();
	}

	private processContentType(contentType: IContentType) {
		let schema = S.object();

		for (const field of contentType.schema) {
			schema = schema.prop(field.uid, this.processField(field));
		}

		this._definitions.set(contentType.uid, schema);
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
				console.warn('Cannot find documentation for JSON types.');
				return S.object();

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

	private processLinkField(field: ILinkContentField) {
		const name = this.getOrCreateLinkDefinition();
		const ref = S.object().ref(`#/definitions/${name}`);
		const base = field.multiple ? S.array().items(ref) : ref;

		return base
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
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

		if (field.multiple) {
			schema = S.array().items(schema);
		}

		return schema
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processReferenceField(field: IReferenceContentField) {
		return S.array()
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '')
			.items(
				S.object()
					.prop('uid', S.string())
					.prop('_content_type_uid', S.string().enum(field.reference_to ?? []))
					.required(['uid', '_content_type_uid'])
			);
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

		if (field.multiple) {
			schema = S.array().items(schema);
		}

		return schema
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processBooleanField(field: IBooleanContentField): ISchema {
		const boolean = S.boolean();
		const base = field.multiple ? S.array().items(boolean) : boolean;

		return base
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processGlobalField(field: IGlobalContentField): ISchema {
		const ref = S.object().ref(`#/definitions/${field.reference_to}`);
		const base = field.multiple ? S.array().items(ref) : ref;

		return base
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processIsoDateField(field: IDateContentField) {
		const format = field.field_metadata?.hide_time ? 'date' : 'date-time';
		const schema = S.string().format(format);
		const base = field.multiple ? S.array().items(schema) : schema;

		return base
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processModularBlocksField(field: IBlocksContentField): ISchema {
		const possibleBlocks = field.blocks.map((block) => {
			const blockSchema = this.processModularBlocksBlock(block);
			return S.object().prop(block.uid, blockSchema);
		});

		return S.array()
			.items(S.object().oneOf(possibleBlocks))
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processModularBlocksBlock(block: IBlock) {
		const metadataName = this.getOrCreateBlockMetadataDefinition();

		if (block.reference_to) {
			return S.object()
				.allOf([
					S.object().ref(`#/definitions/${block.reference_to}`),
					S.object().ref(`#/definitions/${metadataName}`)
				])
				.title(block.title);
		}

		const required = block.schema.filter((x) => x.mandatory).map((x) => x.uid);
		let blockSchema = S.object().required(required).title(block.title);

		for (const blockField of block.schema) {
			const fieldSchema = this.processField(blockField);
			blockSchema = blockSchema.prop(blockField.uid, fieldSchema);
		}

		return S.object().allOf([
			S.object().ref(`#/definitions/${metadataName}`),
			blockSchema
		]);
	}

	private processFileField(field: IFileContentField): ISchema {
		const name = this.getOrCreateHostedFileDefinition();
		const ref = S.object().ref(`#/definitions/${name}`);
		const base = field.multiple ? S.array().items(ref) : ref;

		return base
			.title(field.display_name)
			.description(field.field_metadata?.description ?? '');
	}

	private processGroupField(group: IGroupContentField): ISchema {
		let groupSchema = S.object();

		for (const field of group.schema) {
			const fieldSchema = this.processField(field);
			groupSchema = groupSchema.prop(field.uid, fieldSchema);
		}

		return groupSchema;
	}

	private getOrCreateLinkDefinition() {
		const name = 'link-field';
		this.getOrCreateDefinition(name, LinkDefinition);
		return name;
	}

	private getOrCreateBlockMetadataDefinition() {
		const name = 'block-metadata';
		this.getOrCreateDefinition(name, BlockMetadataDefinition);
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
