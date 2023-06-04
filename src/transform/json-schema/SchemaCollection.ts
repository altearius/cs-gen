import type IContentType from '../../models/IContentType.js';

import ReferenceFinder from './ReferenceFinder.js';

type ITypeCollection = ReadonlyMap<string, IContentType>;

export default class SchemaCollection {
	private readonly _sorted: readonly IContentType[];

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
	const map = new Map<string, IContentType>();

	for (const contentTypeMap of contentTypes) {
		for (const [uid, type] of contentTypeMap) {
			map.set(uid, type);
		}
	}

	return map;
}

function sortTopologically(
	contentTypes: ReadonlySet<IContentType>,
	mapped: ReadonlyMap<string, IContentType>
) {
	const visited = new Set<string>();
	const finder = new ReferenceFinder(mapped);
	const sorted: IContentType[] = [];

	function visit(contentType: IContentType, ...path: readonly string[]) {
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
	{ uid }: IContentType,
	...path: readonly string[]
) {
	if (path.includes(uid)) {
		const msg = `Circular reference detected: ${path.join(' -> ')} -> ${uid}`;
		throw new Error(msg);
	}
}
