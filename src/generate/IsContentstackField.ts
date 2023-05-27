import c from 'ansi-colors';

import type IContentstackField from "./IContentstackField.js";

export default function IsContentstackField(prefix: string, o: unknown): o is IContentstackField {
	if (typeof o !== 'object' || o === null) {
		return false;
	}

	const r = o as Record<string, unknown>;
	const { data_type: dataType, uid } = r;

	if (typeof uid !== 'string') {
		console.warn(prefix, 'uid is not a string', r);
		return false;
	}

	const localPrefix = `${prefix}::[${c.yellow(uid)}]`;

	if (typeof dataType !== 'string') {
		console.warn(localPrefix, 'data_type is not a string:', dataType);
		return false;
	}

	const knownDataTypes = ['group', 'text'];
	if (!knownDataTypes.includes(dataType)) {
		console.warn(localPrefix, 'data_type is not known:', dataType);
		return false;
	}

	return true;
}

