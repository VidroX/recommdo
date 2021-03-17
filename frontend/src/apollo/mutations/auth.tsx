import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
	mutation($email: String!, $password: String!) {
		login(email: $email, password: $password) {
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
			tokens {
				accessToken,
				refreshToken
			}
		}
	}
`;
