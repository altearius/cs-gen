export default interface IOptions {
	readonly apiKey: string;
	readonly baseUrl: string;
	readonly branch: string;
	readonly managementToken: string;
	readonly jsonSchemaPath?: string;
	readonly typescriptPath?: string;
	readonly validationPath?: string;
	readonly prefix: string;
	readonly responsePath?: string;
}
