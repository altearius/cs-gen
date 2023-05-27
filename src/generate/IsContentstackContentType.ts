import c from 'ansi-colors';

import type IContentstackContentType from './IContentstackContentType.js';
import IsContentstackField from './IsContentstackField.js';

export default function IsContentstackContentType(
	o: unknown
): o is IContentstackContentType {
	if (typeof o !== 'object' || o === null) {
		return false;
	}

	const obj = o as Record<string, unknown>;

	if (typeof obj.uid !== 'string') {
		console.warn('uid is not a string', obj);
		return false;
	}

	if (typeof obj.title !== 'string') {
		console.warn(`[${c.yellow(obj.uid)}] title is not a string:`, obj.title);
		return false;
	}

	const prefix = `[${c.yellow(obj.uid)} (${c.yellow(obj.title)})]`;

	if (obj.description !== undefined && typeof obj.description !== 'string') {
		console.warn(prefix, 'description is not a string', obj.description);
		return false;
	}

	if (!Array.isArray(obj.schema)) {
		console.warn(prefix, 'schema is not an array', obj.schema);
		return false;
	}

	return obj.schema.every(field => IsContentstackField(prefix, field));
}
