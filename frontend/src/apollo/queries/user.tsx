import { gql } from '@apollo/client';

export const CURRENT_USER = gql`
    query {
        user {
            id,
            email,
            firstName,
            lastName,
            middleName,
            accessLevel {
                level,
                isStaff,
                name,
                description
            }
        }
    }
`;