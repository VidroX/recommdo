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

export const GET_PROJECT_QUERY = gql`
    query($projectId: String!) {
        project(projectId: $projectId) {
            id,
            name,
            analyzed,
						imported,
            allowedUsers {
                id,
                firstName,
                lastName,
                middleName,
                accessLevel {
                    level,
                    name,
                    isStaff,
                    description
                }
            }
        }
    }
`;

export const GET_USERS_LIST_QUERY = gql`
    query ($skipAdmins: Boolean) {
        users (skipAdmins: $skipAdmins) {
            id,
            firstName,
            lastName,
            middleName,
            accessLevel {
                level,
                name,
                description
            }
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

export const GET_PROJECT_STATISTICS_QUERY = gql`
    query ($projectId: String!, $itemId: Int) {
        projectStatistics (projectId: $projectId, itemId: $itemId) {
            statistics {
                stars,
                count,
                percentage
            },
            metadata {
                id,
								metaId,
                name
            },
            project {
                id,
                name,
                analyzed,
                imported,
                allowedUsers {
                    id,
                    firstName,
                    lastName,
                    middleName,
                    accessLevel {
                        level,
                        name,
                        isStaff,
                        description
                    }
                }
                files {
                    name,
                    location
                }
            }
        }
    }
`;

export const GET_PROJECT_METADATA_QUERY = gql`
    query ($projectId: String!) {
        allMetadata (projectId: $projectId) {
            id,
            name,
            metaId
        }
    }
`;

export const GET_PROJECT_RECOMMENDATIONS_QUERY = gql`
    query ($projectId: String!, $page: Int, $search: Float, $orderBy: String, $itemId: String!, $stars: Int) {
        projectRecommendations (projectId: $projectId, page: $page, search: $search, orderBy: $orderBy, stars: $stars, itemId: $itemId) {
            recommendations {
                id,
                userId,
                userItemWeight,
                score,
                metadata {
                    id,
                    metaId,
                    name
                },
                project {
                    name,
                    analyzed,
                    allowedUsers {
                        id,
                        firstName,
                        lastName,
                        middleName,
                        accessLevel {
                            level,
                            name,
                            isStaff,
                            description
                        }
                    }
                    files {
                        name,
                        location
                    }
                }
            }
            currentPage,
            pageAmount,
            shownEntries,
            totalEntries
        }
    }
`;

export const GET_USER_PURCHASES_QUERY = gql`
    query ($projectId: String!, $userId: Int!) {
        userPurchases (projectId: $projectId, userId: $userId) {
            id,
            userId,
            weight,
            metadata {
                id,
                metaId,
                name
            },
            project {
                name,
                analyzed,
                allowedUsers {
                    id,
                    firstName,
                    lastName,
                    middleName,
                    accessLevel {
                        level,
                        name,
                        isStaff,
                        description
                    }
                }
                files {
                    name,
                    location
                }
            }
        }
    }
`;

export const GET_USER_RECOMMENDATIONS_QUERY = gql`
    query ($projectId: String!, $userId: Int!) {
        userRecommendations (projectId: $projectId, userId: $userId) {
            id,
            userId,
            score,
            userItemWeight,
            metadata {
                id,
                metaId,
                name
            },
            project {
                name,
                analyzed,
                allowedUsers {
                    id,
                    firstName,
                    lastName,
                    middleName,
                    accessLevel {
                        level,
                        name,
                        isStaff,
                        description
                    }
                }
                files {
                    name,
                    location
                }
            }
        }
    }
`;
