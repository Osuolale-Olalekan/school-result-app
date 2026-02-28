import { UserRole, UserStatus } from "@/types/enums";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      // role: UserRole;
      roles: UserRole[];
      activeRole: UserRole;
      status: UserStatus;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    // role: UserRole;
    roles: UserRole[];
    activeRole: UserRole
    status: UserStatus;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    // role: UserRole;
    roles: UserRole[];
    activeRole: UserRole;
    firstName: string;
    lastName: string;
    status: UserStatus;
  }
}
