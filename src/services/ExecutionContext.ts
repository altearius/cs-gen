import { mkdir, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { inspect } from 'node:util';

export default class ExecutionContext {
	public readonly apiKey = apiKey();
	public readonly baseUrl = new URL(baseUrl());

	public readonly branch: string =
		process.env.Contentstack_Type_Gen_branch ?? 'main';

	public readonly managementToken = managementToken();

	private constructor(private readonly _workingDirectory: string) {}

	public get paths(): {
		readonly workingDirectory: string;
	} {
		return {
			workingDirectory: this._workingDirectory
		};
	}

	public static async create(): Promise<ExecutionContext> {
		const resolved = resolve(process.cwd(), dataDirectory());
		const timestamp = new Date().toISOString().replace(/:/gu, '-');
		const prefix = join(resolved, `${timestamp}-`);
		await mkdir(resolved, { recursive: true });
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

function apiKey() {
	const result = process.env.Contentstack_Type_Gen_api_key;

	if (!result) {
		throw new Error('Contentstack Type Gen API key not set');
	}

	return result;
}

function baseUrl() {
	const result = process.env.Contentstack_Type_Gen_base_url;

	if (!result) {
		throw new Error('Contentstack Type Gen base URL not set');
	}

	return result;
}

function managementToken() {
	const result = process.env.Contentstack_Type_Gen_management_token;

	if (!result) {
		throw new Error('Contentstack Type Gen management token not set');
	}

	return result;
}
