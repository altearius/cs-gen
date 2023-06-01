import type { IContentField } from '../../pull/ContentField.schema.js';

interface IContentType {
	readonly schema: readonly IContentField[];
	readonly uid: string;
}

export default function TopologicalSort<T extends IContentType>(
	contentTypes: ReadonlySet<T>
) {
	const sorted: T[] = [];
	const visited = new Set<string>();
	const collection = new SchemaStructure(contentTypes);

	function visit(contentType: T, ...path: readonly string[]) {
		const { schema, uid } = contentType;
		if (path.includes(uid)) {
			const msg = `Circular reference detected: ${path.join(' -> ')} -> ${uid}`;
			throw new Error(msg);
		}

		if (visited.has(uid)) {
			return;
		}

		visited.add(uid);

		const nextPath = [...path, uid];
		for (const reference of collection.findReferencesIn(schema)) {
			visit(reference, ...nextPath);
		}

		sorted.push(contentType);
	}

	for (const contentType of contentTypes) {
		visit(contentType);
	}

	return sorted;
}

class SchemaStructure<T extends IContentType> {
	private readonly _map = new Map<string, T>();

	public constructor(schema: ReadonlySet<T>) {
		for (const contentType of schema) {
			this._map.set(contentType.uid, contentType);
		}
	}

	public *findReferencesIn(schema: readonly IContentField[]) {
		for (const field of schema) {
			if (field.data_type !== 'blocks') {
				continue;
			}

			for (const { reference_to: reference } of field.blocks) {
				if (typeof reference !== 'string') {
					continue;
				}

				const contentType = this._map.get(reference);
				if (!contentType) {
					throw new Error(`Cannot find referenced content type: ${reference}`);
				}

				yield contentType;
			}
		}
	}
}
