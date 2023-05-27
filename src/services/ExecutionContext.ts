import { mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { inspect } from 'node:util';

export default class ExecutionContext {
	public readonly managementTokenAlias = managementTokenAlias();

	private constructor(private readonly _workingDirectory: string) {}

	public get branch(): string {
		return process.env.Contentstack_Type_Gen_branch ?? 'main';
	}

	public get paths(): {
		readonly csdx: {
			readonly dataDir: string;
			readonly typesRoot: string;
		};
		readonly workingDirectory: string;
	} {
		const csdxDataDir = resolve(this._workingDirectory, 'csdx');

		return {
			csdx: {
				dataDir: csdxDataDir,
				typesRoot: resolve(csdxDataDir, this.branch, 'content_types')
			},
			workingDirectory: this._workingDirectory
		};
	}

	public static async create(): Promise<ExecutionContext> {
		const resolved = resolve(process.cwd(), dataDirectory());
		const timestamp = new Date().toISOString().replace(/:/gu, '-');
		const prefix = join(resolved, `${timestamp}-`);
		return new ExecutionContext(await mkdtemp(prefix));
	}

	public static async removeStaleRuns(): Promise<string[]> {
		const resolved = resolve(process.cwd(), dataDirectory());
		const entries = await readdir(resolved, { withFileTypes: true });

		const directories = entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => resolve(resolved, entry.name));

		const runs = await Promise.all(
			directories.map(async (directory) => {
				const { birthtime } = await stat(directory);
				return { birthtime, directory };
			})
		);

		const staleMinutes = 10;
		const stateCutoff = new Date();
		stateCutoff.setMinutes(stateCutoff.getMinutes() - staleMinutes);

		const staleRuns = runs
			.filter((run) => run.birthtime < stateCutoff)
			.map((run) => run.directory);

		const keep = 3;

		const recentRunsToKeep = new Set<string>(
			runs
				.sort((a, b) => b.birthtime.getTime() - a.birthtime.getTime())
				.slice(0, keep)
				.map((run) => run.directory)
		);

		const runsToPrune = staleRuns.filter((run) => !recentRunsToKeep.has(run));

		await Promise.all(
			runsToPrune.map(async (run) => {
				return rm(run, { recursive: true });
			})
		);

		return runsToPrune;
	}

	public toString(): string {
		return inspect(
			{
				branch: this.branch,
				paths: this.paths,
				workingDirectory: this._workingDirectory
			},
			{ colors: true }
		);
	}
}

function dataDirectory() {
	const result = process.env.Contentstack_Type_Gen_working_directory;

	if (!result) {
		throw new Error('Contentstack Type Gen working directory not set');
	}

	return result;
}

function managementTokenAlias() {
	const result = process.env.Contentstack_Type_Gen_management_token_alias;

	if (!result) {
		throw new Error('Contentstack Type Gen management token alias not set');
	}

	return result;
}
