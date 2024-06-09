import { spawnSync } from 'node:child_process';

export default function compileTs() {
	spawnSync('yarn', ['tsc', '--build', './src/tsconfig.json'], {
		stdio: 'inherit'
	});
}
