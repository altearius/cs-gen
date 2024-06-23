import createClient from 'openapi-fetch';
import IOptions from '../models/IOptions.js';
import type { paths } from '../models/cma-openapi-3.json';

type Client = ReturnType<typeof CreateClient>;
export default Client;

export function CreateClient(options: IOptions) {
	const client = createClient<paths>({ baseUrl: options.baseUrl.toString() });

	client.use({
		onRequest: (o) => {
			o.request.headers.set('api_key', options.apiKey);
			o.request.headers.set('authorization', options.managementToken);
			o.request.headers.set('branch', options.branch);
		}
	});

	return client;
}
