import { Option } from 'commander';

const BaseUrlOption = new Option('--base-url [url]', 'Base URL');
BaseUrlOption.env('Cs_gen_base_url');

BaseUrlOption.choices([
	'https://api.contentstack.io/',
	'https://eu-api.contentstack.com/',
	'https://azure-na-api.contentstack.com/'
]);

BaseUrlOption.makeOptionMandatory();
BaseUrlOption.argParser((val: string) => new URL(val));

export default BaseUrlOption;
