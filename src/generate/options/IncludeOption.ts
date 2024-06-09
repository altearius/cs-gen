import { Option } from 'commander';

const IncludeOption = new Option(
	'--include <uid...>',
	'Include content types by UID'
);

export default IncludeOption;
