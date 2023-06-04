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

	// TSgen types this as "any"
	// I can't find documentation for it.
	// The output for an entity right now has a field that says _version: 9
	// So I guess there are other versions?
	// I could try to reverse-engineer this. It would look something like:
	//
	//   const name = this.getOrCreateJsonDefinition();
	//   const ref = S.ref(`#/definitions/${name}`);
	//   const multiple = handleMultiple(field, ref);
	//   return applyBaseFieldsFrom(field).to(multiple);
	//
	// Where `getOrCreateJsonDefinition` would create a definition like this:
	//
	//   S
	//     .object()
	//     .required(['attrs', 'children', 'uid'])
	//     .prop('uid', S.string())
	//     .prop('attrs', S.object()) <-- unclear what goes here
	//     .prop(
	//       'children',
	//       S.array().items(S.oneOf([
	//         S.ref(`#/definitions/${name}`),
	//         S.object().required(['text']).prop('text', S.string())
	//       ])));
	//
	// But the _version number and lack of documentation scares me. Maybe if I
	// could find the docs for this and a roadmap for future version iterations,
	// it would make more sense. As it is, it seems complex and in flux, and
	// I'm worried that this target is moving too quickly to hit. Perhaps it is
	// better to leave this as "any" until I can find more information.
	//
	// Or maybe, is it always going to be an object? Is that a safe bet?
	// I could imagine it being a string in some cases, if there's some way to
	// have the server render HTML that I just don't know about yet.
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
		const ref = S.array().items(
			S.object()
				.prop('uid', S.string())
				.prop('_content_type_uid', S.string().enum(field.reference_to ?? []))
				.required(['uid', '_content_type_uid'])
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
		const metadataName = this.getOrCreateBlockMetadataDefinition();

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
		let groupSchema: ISchema = S.object();

		for (const field of group.schema) {
			const fieldSchema = this.processField(field);
			groupSchema = groupSchema.prop(field.uid, fieldSchema);
		}

		groupSchema = handleMultiple(group, groupSchema);
		return applyBaseFieldsFrom(group).to(groupSchema);
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
