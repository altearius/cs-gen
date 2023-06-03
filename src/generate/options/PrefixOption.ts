import { Option } from 'commander';

const PrefixOption = new Option(
	'--prefix <prefix>',
	'Add a prefix for TypeScript interface names.'
);

PrefixOption.default('I-');
PrefixOption.env('Cs_gen_prefix');
export default PrefixOption;
