import { Option } from 'commander';

const ApiKeyOption = new Option('--api-key [prefix]', 'Contentstack API key');
ApiKeyOption.env('Cs_gen_api_key');
ApiKeyOption.makeOptionMandatory();
export default ApiKeyOption;
