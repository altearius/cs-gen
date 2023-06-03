import { Option } from 'commander';

const ManagementTokenOption = new Option(
	'--management-token [token]',
	'Contentstack management token'
);

ManagementTokenOption.env('Cs_gen_management_token');
ManagementTokenOption.makeOptionMandatory();
export default ManagementTokenOption;
