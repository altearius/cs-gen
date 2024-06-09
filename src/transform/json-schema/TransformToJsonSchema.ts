import type { SchemaObject } from 'ajv';
import yaml from 'js-yaml';
import { extname } from 'node:path';
import type IContentType from '../../models/IContentType.js';
import type IOptions from '../../models/IOptions.js';
import FormatAndSave from '../../services/FormatAndSave.js';
import SchemaCollection from './SchemaCollection.js';
import SchemaWalker from './SchemaWalker.js';

type ITypeCollection = ReadonlyMap<string, IContentType>;

export default async function TransformToJsonSchema(
	options: IOptions,
	contentTypes: ITypeCollection,
	globalTypes: ITypeCollection
): Promise<SchemaObject> {
	const collection = new SchemaCollection(contentTypes, globalTypes);
	const walker = new SchemaWalker(collection);
	const jsonSchema = walker.toJsonSchema();
	await saveJsonSchema(options, jsonSchema);
	return jsonSchema;
}

async function saveJsonSchema(
	{ jsonSchemaPath }: IOptions,
	jsonSchema: SchemaObject
) {
	if (typeof jsonSchemaPath !== 'string') {
		return;
	}

	const extension = extname(jsonSchemaPath);
	const isYaml = extension === '.yaml' || extension === '.yml';
	const value = isYaml ? yaml.dump(jsonSchema) : JSON.stringify(jsonSchema);
	await FormatAndSave(jsonSchemaPath, isYaml ? 'yaml' : 'json', value);
}
