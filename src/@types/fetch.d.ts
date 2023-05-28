/* eslint-disable @typescript-eslint/naming-convention */
// Justification: Defines pre-existing global types that we do not control.

// From https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924

import type {
	FormData as FormDataType,
	Headers as HeadersType,
	Request as RequestType,
	Response as ResponseType,
	fetch as fetchType
} from 'undici';

declare global {
	// Re-export undici fetch function and various classes to global scope.
	// These are classes and functions expected to be at global scope according
	// to Node.js v18 API documentation.
	//
	// See: https://nodejs.org/dist/latest-v18.x/docs/api/globals.html
	export const {
		FormData,
		Headers,
		Request,
		Response,
		fetch
	}: {
		FormData: typeof FormDataType;
		Headers: typeof HeadersType;
		Request: typeof RequestType;
		Response: typeof ResponseType;
		fetch: typeof fetchType;
	};

	type FormData = FormDataType;
	type Headers = HeadersType;
	type Request = RequestType;
	type Response = ResponseType;
}
