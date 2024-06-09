import { copyFile } from 'node:fs/promises';
import { basename } from 'node:path';
import fg from 'fast-glob';

export default async function copySchema() {
	const files = await fg('./src/pull/*.schema.json', {
		onlyFiles: true,
		absolute: true
	});

	await Promise.all(
		files.map((absPath) =>
			copyFile(absPath, `./dist/pull/${basename(absPath)}`)
		)
	);
}
