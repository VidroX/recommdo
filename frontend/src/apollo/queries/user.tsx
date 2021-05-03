import { gql } from '@apollo/client';

export const GET_USER_QUERY = gql`
    query ($userId: ID) {
        user (userId: $userId) {
            id,
            email,
            firstName,
            lastName,
            middleName,
            accessLevel {
                id,
                level,
                isStaff,
                name,
                description
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
                id,
                level,
                isStaff,
                name,
                description
            }
        }
    }
`;

export const GET_ACCESS_LEVELS_QUERY = gql`
    query {
        accessLevels {
            id,
            name,
            description,
            level,
            isStaff
        }
    }
`;
