import type { ContentType } from '../../models/ContentType.schema.yaml';
import ReferenceFinder from './ReferenceFinder.js';

type ITypeCollection = ReadonlyMap<string, ContentType>;

export default class SchemaCollection {
	private readonly _sorted: readonly ContentType[];

	public constructor(
		public readonly contentTypes: ITypeCollection,
		public readonly globalTypes: ITypeCollection
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

function mapByUid(...contentTypes: ITypeCollection[]) {
	const map = new Map<string, ContentType>();

	for (const contentTypeMap of contentTypes) {
		for (const [uid, type] of contentTypeMap) {
			map.set(uid, type);
		}
	}

	return map;
}

function sortTopologically(
	contentTypes: ReadonlySet<ContentType>,
	mapped: ReadonlyMap<string, ContentType>
) {
	const visited = new Set<string>();
	const finder = new ReferenceFinder(mapped);
	const sorted: ContentType[] = [];

	function visit(contentType: ContentType, ...path: readonly string[]) {
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
	{ uid }: ContentType,
	...path: readonly string[]
) {
	if (path.includes(uid)) {
		const msg = `Circular reference detected: ${path.join(' -> ')} -> ${uid}`;
		throw new Error(msg);
	}
}
