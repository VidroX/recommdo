import { useQuery } from '@apollo/client';
import { CURRENT_USER } from '../apollo/queries/user';

export interface UserAccessLevel {
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
	user: User
}

const useUser = (): User | null => {
	const { data } = useQuery<UserQuery>(CURRENT_USER);

	return data?.user ?? null;
};

export default useUser;