import addFormats from 'ajv-formats';
import yaml from 'js-yaml';
import { resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { resolveConfig, format } from 'prettier';

export async function generateValidation() {
	await writePrettyCode(generateCode());
}

async function generateCode() {
	const cache = new SchemaCache();
	const schemas = await readSchemas(cache);
	const ajv = createAjv(schemas, cache);

	for (const value of schemas.values()) {
		await ajv.compileAsync(value);
	}

	return standaloneCode(
		ajv,
		Object.fromEntries([...schemas.keys()].map((key) => [key, key]))
	);
}

function createAjv(schemas, schemaCache) {
	const ajv = new Ajv({
		schemas: Object.fromEntries(schemas),
		verbose: true,
		code: { source: true, esm: true, lines: true },
		loadSchema: async (uri) => schemaCache.load(uri)
	});

	addFormats(ajv);

	return ajv;
}

async function readSchemas(schemaCache) {
	const keys = ['GetAllContentTypesResponse', 'GetAllGlobalFieldsResponse'];
	const values = await Promise.all(
		keys.map((key) => schemaCache.load(`${key}.schema.yaml`))
	);

	return new Map(keys.map((key, index) => [key, values[index]]));
}

async function writePrettyCode(codePromise) {
	const outputPath = resolve('src', 'models', 'validate.mjs');

	const [options, code] = await Promise.all([
		resolveConfig(outputPath, { editorconfig: true }),
		codePromise
	]);

	const formatted = await format(code, { ...options, parser: 'typescript' });
	await writeFile(outputPath, formatted, 'utf8');
}

class SchemaCache {
	#schemas = new Map();

	async load(path) {
		const existing = this.#schemas.get(path);
		if (existing) {
			return existing;
		}

		const absolute = resolve('src', 'models', path);
		const raw = await readFile(absolute, 'utf8');
		const parsed = yaml.load(raw, { filename: path });

		if (!this.#schemas.has(path)) {
			this.#schemas.set(path, parsed);
		}

		return parsed;
	}
}
