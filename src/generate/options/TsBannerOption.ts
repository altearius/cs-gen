import { Option } from 'commander';

const TsBannerOption = new Option(
	'--ts-banner <bannerComment>',
	'Specify the TypeScript banner comment'
);

export default TsBannerOption;
