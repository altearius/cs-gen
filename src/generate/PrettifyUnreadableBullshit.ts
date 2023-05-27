import { readFile, writeFile } from 'node:fs/promises';

import prettier from 'prettier';

import type ExecutionContext from '../services/ExecutionContext.js';

// jesus christ
// i'm not a robot
// why is this minified to begin with
//
// are you saving bandwidth costs?
// for a low-frequency operation just for developers?
export default async function PrettifyUnreadableBullshit(
	ctx: ExecutionContext,
	files: string[]
) {
	const config = await prettier.resolveConfig(ctx.paths.csdx.typesRoot, {
		editorconfig: true
	});

	const prettified = await Promise.all(
		files.map(async (filepath) => {
			const raw = await readFile(filepath, 'utf-8');
			const fileConfig = { ...config, filepath, parser: 'json' };
			const prettified = prettier.format(raw, fileConfig);
			await writeFile(filepath, prettified, 'utf-8');
			return prettified;
		})
	);

	return files.reduce((map, file, idx) => {
		map.set(file, prettified[idx]);
		return map;
	}, new Map<string, string | undefined>());
}
