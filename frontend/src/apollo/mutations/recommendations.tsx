import { gql } from '@apollo/client';

export const CREATE_PROJECT_MUTATION = gql`
	mutation($files: [Upload!]!, $projectName: String!, $projectMetadataInput: ProjectMetadataInput) {
		createProject(files: $files, projectName: $projectName, projectMetadata: $projectMetadataInput) {
				project {
            id,
						name,
						files {
								id,
								name,
								location
						}
        }
		}
	}
`;
