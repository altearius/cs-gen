export default class ContentstackError extends Error {
	public constructor(
		message: string,
		public readonly code?: number,
		public readonly errors?: unknown
	) {
		super(message);
	}

	public static async throwIfNotOk(response: Response) {
		if (response.ok) {
			return;
		}

		let text: string | undefined;
		let raw: unknown;

		try {
			text = await response.text();
			raw = JSON.parse(text);
		} catch (ex: unknown) {
			if (typeof text === 'string') {
				throw new ContentstackError(text);
			}
		}

		if (isErrorResponse(raw)) {
			throw new ContentstackError(
				raw.error_message,
				typeof raw.error_code === 'number' ? raw.error_code : undefined,
				raw.errors
			);
		}

		throw new ContentstackError(response.statusText);
	}
}

interface IErrorResponse {
	readonly error_message: string;
	readonly error_code?: number;
	readonly errors?: unknown;
}

function isErrorResponse(o: unknown): o is IErrorResponse {
	if (o === null) {
		return false;
	}

	if (typeof o !== 'object') {
		return false;
	}

	if (!('error_message' in o)) {
		return false;
	}

	if (typeof o.error_message !== 'string') {
		return false;
	}

	if ('error_code' in o && typeof o.error_code !== 'number') {
		return false;
	}

	return true;
}
