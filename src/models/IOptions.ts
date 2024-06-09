export default interface IOptions {
	readonly apiKey: string;
	readonly baseUrl: string;
	readonly branch: string;
	readonly filter?: (uid: string) => boolean;
	readonly jsonSchemaPath?: string;
	readonly managementToken: string;
	readonly prefix?: string;
	readonly responsePath?: string;
	readonly typescriptPath?: string;
	readonly validationPath?: string;
}
