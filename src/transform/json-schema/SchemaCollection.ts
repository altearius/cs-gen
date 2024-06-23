import type { ContentType } from '../../models/ContentType.schema.yaml';
import type { GlobalField } from '../../pull/GetGlobalFields.js';
import ReferenceFinder from './ReferenceFinder.js';

export default class SchemaCollection {
	private readonly _sorted: readonly (ContentType | GlobalField)[];

	public constructor(
		public readonly contentTypes: ReadonlyMap<string, ContentType>,
		public readonly globalTypes: ReadonlyMap<string, GlobalField>
	) {
		const mapped = mapByUid(globalTypes, contentTypes);
		const set = new Set(mapped.values());
		this._sorted = sortTopologically(set, mapped);
	}

	// Guaranteed to always be in topological order, and that all references
	// will actually exist.
	public [Symbol.iterator]() {
		return this._sorted[Symbol.iterator]();
	}
}

function mapByUid(
	...contentTypes: (
		| ReadonlyMap<string, ContentType>
		| ReadonlyMap<string, GlobalField>
	)[]
) {
	const map = new Map<string, ContentType | GlobalField>();

	for (const contentTypeMap of contentTypes) {
		for (const [uid, type] of contentTypeMap) {
			map.set(uid, type);
		}
	}

	return map;
}

function sortTopologically(
	contentTypes: ReadonlySet<ContentType | GlobalField>,
	mapped: ReadonlyMap<string, ContentType | GlobalField>
) {
	const visited = new Set<string>();
	const finder = new ReferenceFinder(mapped);
	const sorted: (ContentType | GlobalField)[] = [];

	function visit(
		contentType: ContentType | GlobalField,
		...path: readonly string[]
	) {
		throwOnCircularReference(contentType, ...path);

		const { schema, uid } = contentType;

		if (visited.has(uid)) {
			return;
		}

		visited.add(uid);

		const nextPath = [...path, uid];
		for (const reference of finder.findReferencesIn(schema)) {
			visit(reference, ...nextPath);
		}

		sorted.push(contentType);
	}

	for (const contentType of contentTypes) {
		visit(contentType);
	}

	return sorted;
}

function throwOnCircularReference(
	{ uid }: ContentType | GlobalField,
	...path: readonly string[]
) {
	if (path.includes(uid)) {
		const msg = `Circular reference detected: ${path.join(' -> ')} -> ${uid}`;
		throw new Error(msg);
	}
}
