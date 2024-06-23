import openapiTS from 'openapi-typescript';
import { resolve } from 'node:path';
import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile } from 'node:fs/promises';

const models = resolve('src', 'models');

export async function getAllGlobalFieldsResponse() {
	const input = resolve(models, 'GetAllGlobalFieldsResponse.schema.yaml');
	const output = resolve(models, 'GetAllGlobalFieldsResponse.schema.d.yaml.ts');

	const schema = await compileFromFile(input, {
		bannerComment: "import type { Field } from './Field.schema.yaml';",
		declareExternallyReferenced: false,
		additionalProperties: false,
		strictIndexSignatures: true,
		cwd: models,
		unknownAny: true,
		$refOptions: { mutateInputSchema: false }
	});

	await writeFile(output, schema, 'utf-8');
}

export async function getAllContentTypesResponse() {
	const input = resolve(models, 'GetAllContentTypesResponse.schema.yaml');
	const output = resolve(models, 'GetAllContentTypesResponse.schema.d.yaml.ts');

	const schema = await compileFromFile(input, {
		bannerComment:
			"import type { ContentType } from './ContentType.schema.yaml';",
		declareExternallyReferenced: false,
		additionalProperties: false,
		strictIndexSignatures: true,
		cwd: models,
		unknownAny: true,
		$refOptions: { mutateInputSchema: false }
	});

	await writeFile(output, schema, 'utf-8');
}

export async function openApiTypes() {
	const input = resolve('src', 'models', 'cma-openapi-3.json');
	const output = resolve('src', 'models', 'cma-openapi-3.d.json.ts');

	await writeFile(
		output,
		await openapiTS(input, {
			alphabetize: true,
			excludeDeprecated: true,
			immutableTypes: true
		}),
		'utf-8'
	);
}

export async function field() {
	const models = resolve('src', 'models');
	const input = resolve(models, 'Field.schema.yaml');
	const output = resolve(models, 'Field.schema.d.yaml.ts');

	const schema = await compileFromFile(input, {
		declareExternallyReferenced: true,
		additionalProperties: false,
		strictIndexSignatures: true,
		cwd: models,
		unknownAny: true,
		$refOptions: { mutateInputSchema: false }
	});

	await writeFile(output, schema, 'utf-8');
}

export async function contentType() {
	const models = resolve('src', 'models');
	const input = resolve(models, 'ContentType.schema.yaml');
	const output = resolve(models, 'ContentType.schema.d.yaml.ts');

	const schema = await compileFromFile(input, {
		bannerComment: "import type { Field } from './Field.schema.yaml';",
		declareExternallyReferenced: false,
		additionalProperties: false,
		strictIndexSignatures: true,
		cwd: models,
		unknownAny: true,
		$refOptions: { mutateInputSchema: false }
	});

	await writeFile(output, schema, 'utf-8');
}
