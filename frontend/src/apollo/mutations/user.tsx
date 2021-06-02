import { gql } from '@apollo/client';

export const REMOVE_USER_MUTATION = gql`
    mutation ($userId: ID!) {
        removeUser (userId: $userId) {
            message
        }
    }
`;

export const CREATE_NEW_USER_MUTATION = gql`
    mutation ($email: String!, $password: String!, $firstName: String!, $lastName: String!, $middleName: String, $accessLevel: Int) {
        register(email: $email, password: $password, firstName: $firstName, lastName: $lastName, middleName: $middleName, accessLevel: $accessLevel) {
            user {
                firstName
            }
        }
    }
`;