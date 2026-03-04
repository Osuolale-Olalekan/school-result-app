import { UserRole, UserStatus } from "@/types/enums";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      surname: string;
      firstName: string;
      otherName: string;
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
    surname
    firstName: string;
    otherName: string;
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
    surname: string;
    firstName: string;
    otherName: string;
    status: UserStatus;
  }
}
