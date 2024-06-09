import { spawnSync } from 'node:child_process';

export default function compileTs() {
	spawnSync('yarn', ['tsc', '--build', './tsconfig.json'], {
		stdio: 'inherit'
	});
}
