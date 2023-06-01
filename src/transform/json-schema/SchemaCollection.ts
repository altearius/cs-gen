import type IContentType from '../../models/IContentType.js';

import ReferenceFinder from './ReferenceFinder.js';

export default class SchemaCollection {
	private readonly _sorted: readonly IContentType[];
	private readonly _mapped: ReadonlyMap<string, IContentType>;

	public constructor(contentTypes: ReadonlySet<IContentType>) {
		this._mapped = mapByUid(contentTypes);
		this._sorted = sortTopologically(contentTypes, this._mapped);
	}

	// Guaranteed to always be in topological order, and that all references
	// will actually exist.
	public [Symbol.iterator]() {
		return this._sorted[Symbol.iterator]();
	}

	public get(uid: string) {
		return this._mapped.get(uid);
	}
}

function mapByUid<T extends IContentType>(contentTypes: ReadonlySet<T>) {
	return [...contentTypes].reduce((map, contentType) => {
		map.set(contentType.uid, contentType);
		return map;
	}, new Map<string, T>());
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
