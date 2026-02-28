import { cookies } from "next/headers";
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { UserRole, UserStatus } from "@/types/enums";
import type { IUser } from "@/types";

export const authConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
   session: { 
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        admissionNumber: { label: "Admission Number", type: "text" },
        loginType: { label: "Login Type", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;

        await connectDB();

        const loginType = credentials.loginType as string;
       

        // Parent login via admission number
        if (loginType === "parent") {
          const admissionNumber = credentials.admissionNumber as string;
          if (!admissionNumber) return null;

          const StudentModel = (await import("@/models/Student")).default;
          const ParentModel = (await import("@/models/Parent")).default;

          const student = await StudentModel.findOne({ admissionNumber: admissionNumber.toUpperCase() }).lean();
          if (!student) return null;

          const parent = await ParentModel.findOne({
            children: student._id,
            status: UserStatus.ACTIVE,
          }).select("+password").lean();

          if (!parent) return null;

          const passwordMatch = await bcrypt.compare(
            credentials.password as string,
            (parent as unknown as { password: string }).password
          );
          if (!passwordMatch) return null;

          const parentTyped = parent as unknown as IUser;
          return {
            id: parent._id.toString(),
            email: (parent as unknown as IUser).email,
            firstName: (parent as unknown as IUser).firstName,
            lastName: (parent as unknown as IUser).lastName,
            // role: UserRole.PARENT,
            roles: parentTyped.roles,
            activeRole: UserRole.PARENT,
            status: (parent as unknown as IUser).status,
          };
        }

        // Standard login for admin, teacher, student
        const email = credentials.email as string;
        const password = credentials.password as string;
        if (!email || !password) return null;

       

        const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password').lean();
       

        if (!user) return null;

        const typedUser = user as unknown as IUser & { password: string };
        

        const passwordMatch = await bcrypt.compare(password, typedUser.password);
      

        if (!passwordMatch) return null;

        if (typedUser.status !== UserStatus.ACTIVE) return null;

        // Update last login
        await UserModel.findByIdAndUpdate(typedUser._id, { lastLogin: new Date() });

        return {
          id: typedUser._id.toString(),
          email: typedUser.email,
          firstName: typedUser.firstName,
          lastName: typedUser.lastName,
          roles: typedUser.roles,
          activeRole: typedUser.roles[0],
          status: typedUser.status,
        };
      },
    }),
  ],
  // session: { strategy: "jwt" },
  callbacks: {
   async jwt({ token, user, trigger, session }) {
  if (user) {
    
    token.id = user.id;
    token.roles = user.roles;
    token.activeRole = user.activeRole;
    token.firstName = user.firstName;
    token.lastName = user.lastName;
    token.status = user.status;
  }
  // fires when frontend calls update({ activeRole: "parent" })
  if (trigger === "update" && session?.activeRole) {
    if ((token.roles as UserRole[]).includes(session.activeRole)) {
      token.activeRole = session.activeRole;
    }
  }
  return token;
},

async session({ session, token }) {
  if (token) {
    session.user.id = token.id as string;
    session.user.roles = token.roles as UserRole[];
    session.user.activeRole = token.activeRole as UserRole;
    session.user.firstName = token.firstName as string;
    session.user.lastName = token.lastName as string;
    session.user.status = token.status as UserStatus;
  }
  return session;
},
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
};

export default NextAuth(authConfig);