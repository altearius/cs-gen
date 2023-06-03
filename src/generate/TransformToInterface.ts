/* eslint-disable require-yield */
import type { JSONSchema4 } from 'json-schema';
import { compile } from 'json-schema-to-typescript';

import type ExecutionContext from '../services/ExecutionContext.js';
import FormatAndSave from '../services/FormatAndSave.js';

export default async function TransformToInterface(
	ctx: ExecutionContext,
	jsonSchema: JSONSchema4,
	prefix: string
) {
	const banner = `/**
 * This file was automatically generated by cs-gen using
 * json-schema-to-typescript.
 *
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run cs-gen to regenerate this file.
 */
`;

	const toCompile: JSONSchema4 = {
		...jsonSchema,
		...prefixNames(jsonSchema, prefix)
	};

	const result = await compile(toCompile, 'ContentstackSchema', {
		additionalProperties: false,
		bannerComment: banner,
		format: false,
		maxItems: 10,
		strictIndexSignatures: true,
		unknownAny: true,
		unreachableDefinitions: false
	});

	await FormatAndSave(ctx, 'schema.d.ts', 'typescript', result);
}

function prefixNames(
	{ definitions = {} }: JSONSchema4,
	prefix: string
): {
	readonly definitions: Record<string, JSONSchema4>;
	readonly properties: Record<string, JSONSchema4>;
} {
	if (!prefix) {
		return { definitions, properties: definitions };
	}

	const updatedDefinitions: Record<string, JSONSchema4> = {};
	const properties: Record<string, JSONSchema4> = {};

	for (const [key, value] of Object.entries(definitions)) {
		const newKey = `${prefix}${key}`;
		const updatedDefinition = updateReferencesInObject(value, prefix);
		updatedDefinitions[newKey] = updatedDefinition;
		properties[key] = updatedDefinition;
	}

	return { definitions: updatedDefinitions, properties };
}

function updateReferencesInObject(schema: object, prefix: string) {
	const result: Record<string, unknown> = {};

	for (const [key, v] of Object.entries(schema)) {
		const value = v as unknown;
		if (key === '$ref' && typeof value === 'string') {
			result[key] = updateReferenceInString(value, prefix);
			continue;
		}

		if (Array.isArray(value)) {
			result[key] = updateReferencesInArray(value, prefix);
			continue;
		}

		if (typeof value === 'object' && value !== null) {
			result[key] = updateReferencesInObject(value, prefix);
			continue;
		}

		result[key] = value;
	}

	return result;
}

function updateReferencesInArray(
	value: readonly unknown[],
	prefix: string
): readonly unknown[] {
	return value.map((item) => {
		if (typeof item === 'object' && item !== null) {
			return updateReferencesInObject(item, prefix);
		}

		if (Array.isArray(item)) {
			return updateReferencesInArray(item, prefix);
		}

		return item;
	});
}

function updateReferenceInString(value: string, prefix: string) {
	const re = /^#\/definitions\/(?<name>.*)$/u;

	const match = re.exec(value);
	if (!match) {
		return value;
	}

	const { name } = match.groups as { name: string };
	return `#/definitions/${prefix}${name}`;
}
