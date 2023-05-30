import { dirname } from 'node:path';

export default function SchemaPath() {
	const thisUrl = new URL(import.meta.url);
	const thisPath = thisUrl.pathname;
	return dirname(thisPath);
}
