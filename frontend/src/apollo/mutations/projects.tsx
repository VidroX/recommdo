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

export const GET_PROJECT_QUERY = gql`
    query($projectId: String!) {
        project(projectId: $projectId) {
            id,
            name,
            analyzed,
						imported
        }
    }
`;

export const GET_PROJECTS_QUERY = gql`
    query {
        projects {
            id,
            name,
            analyzed,
						imported
        }
    }
`;

export const GET_PROJECT_PURCHASES_QUERY = gql`
    query ($projectId: String!, $page: Int, $search: Float, $orderBy: String) {
        projectPurchases (projectId: $projectId, page: $page, search: $search, orderBy: $orderBy) {
            purchases {
                id,
                userId,
                weight,
                metadata {
                    id,
                    metaId,
                    name
                },
            }
            currentPage,
            pageAmount,
						totalEntries,
						shownEntries
        }
    }
`;
