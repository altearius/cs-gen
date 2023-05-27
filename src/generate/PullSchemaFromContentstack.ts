import { spawn } from 'child_process';

import c from 'ansi-colors';
import { glob } from 'glob';

import type ExecutionContext from '../services/ExecutionContext.js';

export default async function PullSchemaFromContentstack(
	ctx: ExecutionContext
) {
	await executeCsdx(ctx);
	return resolveTypeFiles(ctx);
}

async function executeCsdx(ctx: ExecutionContext) {
	const cmd = process.platform === 'win32' ? 'yarn.cmd' : 'yarn';

	const args = [
		'csdx',
		'cm:stacks:export',
		`--alias=${ctx.managementTokenAlias}`,
		`--data-dir=${ctx.paths.csdx.dataDir}`,
		`--branch=${ctx.branch}`,
		'--module=content-types'
	];

	console.info(c.gray([cmd, ...args].join(' ')));
	const childProcess = spawn(cmd, args, { stdio: 'inherit' });

	return new Promise<void>((resolve, reject) => {
		childProcess.on('exit', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`csdx exited with code ${code ?? '-'}`));
			}
		});
	});
}

async function resolveTypeFiles(ctx: ExecutionContext) {
	return glob('*.json', { absolute: true, cwd: ctx.paths.csdx.typesRoot });
}
