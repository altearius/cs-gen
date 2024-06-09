import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile } from 'node:fs/promises';

export default async function generateTypes() {
	await Promise.all([
		generateContentFieldSchema(),
		generateSchema('GetAllContentTypesResponse'),
		generateSchema('GetAllGlobalFieldsResponse')
	]);
}

async function generateContentFieldSchema() {
	const filePath = 'src/pull/ContentField.schema.json';

	const contentField = await compileFromFile(filePath, {
		cwd: 'src/pull',
		unreachableDefinitions: true,
		bannerComment: ''
	});

	await writeFile('src/pull/ContentField.schema.d.ts', contentField, 'utf-8');
}

async function generateSchema(input) {
	const bannerComment =
		'import type { IContentField } from "./ContentField.schema"';

	const filePath = `src/pull/${input}.schema.json`;

	const contentField = await compileFromFile(filePath, {
		cwd: 'src/pull',
		declareExternallyReferenced: false,
		bannerComment
	});

	await writeFile(`src/pull/${input}.schema.d.ts`, contentField, 'utf-8');
}
