import { chmod } from 'node:fs/promises';

export default async function setExec() {
	await chmod('./dist/cs-gen.js', 0o755);
}
