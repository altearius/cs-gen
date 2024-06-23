export default class ContentstackError extends Error {
	public constructor(
		message: string,
		public readonly code: number,
		public readonly details: Record<string, readonly string[]>,
		public readonly context?: string
	) {
		super(message);
	}

	public static throwIfError(error: unknown, context?: string) {
		if (isErrorResponse(error)) {
			throw new ContentstackError(
				error.error_message,
				error.error_code,
				error.errors,
				context
			);
		}
	}
}

interface ErrorResponse {
	readonly error_message: string;
	readonly error_code: number;
	readonly errors: Record<string, string[]>;
}

function isErrorResponse(o: unknown): o is ErrorResponse {
	if (typeof o !== 'object' || o === null) {
		return false;
	}

	const r = o as Record<string, unknown>;

	if (typeof r.error_message !== 'string') {
		return false;
	}

	if (typeof r.error_code !== 'number') {
		return false;
	}

	const { errors } = r;

	if (typeof errors !== 'object' || errors === null) {
		return false;
	}

	for (const values of Object.values(errors)) {
		if (!Array.isArray(values)) {
			return false;
		}

		for (const value of values) {
			if (typeof value !== 'string') {
				return false;
			}
		}
	}

	return true;
}
