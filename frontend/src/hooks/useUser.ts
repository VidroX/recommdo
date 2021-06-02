import { useQuery } from '@apollo/client';
import { GET_USER_QUERY } from '../apollo/queries/user';

export interface UserAccessLevel {
	id: string;
	description: string;
	isStaff: boolean;
	level: number;
	name: string;
}

export interface User {
	id: string;
	accessLevel: UserAccessLevel;
	email: string;
	firstName: string;
	lastName: string;
	middleName: string;
}

interface UserQuery {
	user: User;
}

const useUser = (): User | null => {
	const { data } = useQuery<UserQuery>(GET_USER_QUERY);

	return data?.user ?? null;
};

export default useUser;
