export default interface IOptions {
	readonly apiKey: string;
	readonly baseUrl: string;
	readonly branch: string;
	readonly managementToken: string;
	readonly outputJsonSchema?: string;
	readonly outputTypescriptDefinitions?: string;
	readonly outputValidationCode?: string;
	readonly prefix: string;
	readonly responsePath?: string;
}
