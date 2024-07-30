import { Option } from 'commander';

const description =
	'Maximum number of unioned tuples to emit when representing bounded-size ' +
	'array types before falling back to emitting unbounded arrays. Set it to ' +
	'`-1` to ignore `minItems` and `maxItems`.';

const TsMaxItemsOption = new Option('--ts-max-items <maxItems>', description);

TsMaxItemsOption.argParser((value) => {
	const parsed = parseInt(value, 10);

	if (isNaN(parsed)) {
		throw new Error('Invalid number');
	}

	return parsed;
});

TsMaxItemsOption.default(10);

export default TsMaxItemsOption;
