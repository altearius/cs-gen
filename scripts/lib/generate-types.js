import { basename } from 'node:path';
import openapiTS from 'openapi-typescript';
import { resolve } from 'node:path';
import { compileFromFile } from 'json-schema-to-typescript';
import { writeFile } from 'node:fs/promises';
import fg from 'fast-glob';

const models = resolve('src', 'models');

const options = {
	Acl: { bannerComment: imports('Permissions') },
	ContentType: { bannerComment: imports('Acl', 'Field') },
	Field: { declareExternallyReferenced: true },
	GetAllContentTypesResponse: { bannerComment: imports('ContentType') },
	GetAllGlobalFieldsResponse: { bannerComment: imports('Field') }
};

export async function schemas() {
	const files = await fg('*.schema.yaml', { cwd: models, onlyFiles: true });

	await Promise.all(
		files.map(async (filename) => {
			const base = basename(filename, '.schema.yaml');
			const opts = options[base] ?? {};
			const input = resolve(models, filename);
			const output = resolve(models, `${base}.schema.d.yaml.ts`);

			const schema = await compileFromFile(input, {
				declareExternallyReferenced: false,
				additionalProperties: false,
				strictIndexSignatures: true,
				cwd: models,
				unknownAny: true,
				$refOptions: { mutateInputSchema: false },
				...opts
			});

			await writeFile(output, schema, 'utf-8');
		})
	);
}

export async function openApiTypes() {
	const input = resolve(models, 'cma-openapi-3.json');
	const output = resolve(models, 'cma-openapi-3.d.json.ts');

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

function imports(...names) {
	return names
		.map((name) => `import type { ${name} } from './${name}.schema.yaml';`)
		.join('\n');
}
