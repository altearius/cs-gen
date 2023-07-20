import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import prettier from 'prettier';

type IParser = NonNullable<Parameters<typeof prettier.format>[1]>['parser'];

export default async function FormatAndSave(
	filepath: string,
	parser: IParser,
	value: string
) {
	const config = await prettier.resolveConfig(filepath, { editorconfig: true });

	const pretty = await prettier.format(value, {
		...config,
		filepath,
		parser
	});

	await mkdir(dirname(filepath), { recursive: true });
	await writeFile(filepath, pretty, 'utf8');
}
