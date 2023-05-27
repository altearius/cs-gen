import type IContentstackField from "./IContentstackField.js";

export default interface IContentstackContentType {
	readonly description?: string;
	readonly schema: readonly IContentstackField[];
	readonly title: string;
	readonly uid: string;
}
