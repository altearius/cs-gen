import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import prettier from 'prettier';

import type ExecutionContext from './ExecutionContext.js';

type IParser = NonNullable<Parameters<typeof prettier.format>[1]>['parser'];

export default async function FormatAndSave(
	ctx: ExecutionContext,
	name: string,
	parser: IParser,
	value: string
) {
	const config = await resolveConfiguration(ctx.paths.workingDirectory);
	const filepath = join(ctx.paths.workingDirectory, name);

	const pretty = prettier.format(value, {
		...config,
		filepath,
		parser
	});

	await writeFile(filepath, pretty, 'utf8');
}

let prettierConfig: Promise<prettier.Options | null> | undefined;

async function resolveConfiguration(outputPath: string) {
	return (prettierConfig ??= (async () => {
		const filepath = join(outputPath, 'any.json');
		return prettier.resolveConfig(filepath, { editorconfig: true });
	})());
}
