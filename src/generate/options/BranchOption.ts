import { Option } from 'commander';

const BranchOption = new Option('--branch [name]', 'Contentstack Branch');
BranchOption.env('Cs_gen_branch');
BranchOption.default('main');
BranchOption.makeOptionMandatory();
export default BranchOption;
