import type { Options } from 'json-schema-to-typescript';

/**
 * Represents the options for configuring the ContentStack Type Generator.
 */
export default interface IOptions {
	/**
	 * ContentStack API key.
	 */
	readonly apiKey: string;

	/**
	 * The base URL of the ContentStack API.
	 * @example https://api.contentstack.io/
	 */
	readonly baseUrl: URL;

	/**
	 * The branch to use for generating types.
	 * @default main
	 */
	readonly branch?: string;

	/**
	 * An optional filter function to include/exclude specific entries based
	 * on their UID.
	 */
	readonly filter?: (uid: string) => boolean;

	/**
	 * The file path to save a generated JSON schema, including file name.
	 */
	readonly jsonSchemaPath?: string;

	/**
	 * ContentStack management token.
	 */
	readonly managementToken: string;

	/**
	 * An optional prefix to add to the generated type names.
	 */
	readonly prefix?: string;

	/**
	 * The directory path to save the API responses. Multiple files will be
	 * generated into this folder.
	 */
	readonly responsePath?: string;

	/**
	 * The file path to save the generated TypeScript types, including file name.
	 */
	readonly typescriptPath?: string;

	/**
	 * The directory path to save the validation functions. Multiple files will
	 * be generated into this folder.
	 */
	readonly validationPath?: string;

	/**
	 * Options to pass to json-schema-to-typescript.
	 */
	readonly typescriptOptions: Pick<
		Partial<Options>,
		'bannerComment' | 'maxItems'
	>;
}
