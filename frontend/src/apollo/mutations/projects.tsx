import { gql } from '@apollo/client';

export const CREATE_PROJECT_MUTATION = gql`
	mutation($files: [Upload!]!, $projectName: String!, $projectMetadataInput: ProjectMetadataInput!) {
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

export const UPDATE_PROJECT_ALLOWED_USERS_MUTATION = gql`
    mutation ($projectId: String!, $users: [ID]!) {
        updateProjectAllowedUsers (projectId: $projectId, users: $users) {
            message
        }
    }
`;

export const UPDATE_PROJECT_NAME_MUTATION = gql`
    mutation ($projectId: String!, $name: String!) {
        updateProjectName (projectId: $projectId, name: $name) {
            message
        }
    }
`;

export const DELETE_PROJECT_MUTATION = gql`
    mutation ($projectId: String!) {
        deleteProject (projectId: $projectId) {
            message
        }
    }
`;
