import { gql } from '@apollo/client';

export const CREATE_PROJECT_MUTATION = gql`
	mutation($files: [Upload!]!) {
		createProject(files: $files) {
			message
		}
	}
`;
