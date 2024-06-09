import { Option } from 'commander';

const ExcludeOption = new Option(
	'--exclude <uid...>',
	'Exclude content types by UID'
);

export default ExcludeOption;
