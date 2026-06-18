import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { connectDB } from "@/lib/db";
import UserModel from "@/models/User";
import { UserRole, UserStatus } from "@/types/enums";
import type { IUser } from "@/types";
import StudentModel from "@/models/Student";

export const authConfig: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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

       
        // ─────────────────────────────────────────────────────────────
// 1. PARENT LOGIN — via child's admission number OR own email + password
// ─────────────────────────────────────────────────────────────
if (loginType === "parent") {
  const admissionNumber = credentials.admissionNumber as string;
  const email = credentials.email as string;
  const password = credentials.password as string;

  if (!password) return null;

  const ParentModel = (await import("@/models/Parent")).default;

  let parent;

  if (admissionNumber) {
    // Lookup via child's admission number
    const StudentModel = (await import("@/models/Student")).default;

    const student = await StudentModel.findOne({
      admissionNumber: admissionNumber.toUpperCase(),
    }).lean();

    if (!student) return null;

    parent = await ParentModel.findOne({
      children: student._id,
      status: UserStatus.ACTIVE,
    })
      .select("+password")
      .lean();
  } else if (email) {
    // Lookup via parent's own email
    parent = await ParentModel.findOne({
      email: email.toLowerCase(),
      status: UserStatus.ACTIVE,
    })
      .select("+password")
      .lean();
  } else {
    return null;
  }

  if (!parent) return null;

  const passwordMatch = await bcrypt.compare(
    password,
    (parent as unknown as { password: string }).password
  );
  if (!passwordMatch) return null;

  const parentTyped = parent as unknown as IUser;

  await UserModel.findByIdAndUpdate(parent._id, { lastLogin: new Date() });

  return {
    id: parent._id.toString(),
    email: parentTyped.email,
    surname: parentTyped.surname,
    firstName: parentTyped.firstName,
    otherName: parentTyped.otherName,
    roles: parentTyped.roles,
    activeRole: UserRole.PARENT,
    status: parentTyped.status,
  };
}

        // ─────────────────────────────────────────────────────────────
        // 2. STUDENT LOGIN — via admission number + own password
        // ─────────────────────────────────────────────────────────────
        if (loginType === "student") {
  const admissionNumber = credentials.admissionNumber as string;
  const email = credentials.email as string;
  const password = credentials.password as string;

  if (!password) return null;

  let student;

  if (admissionNumber) {
    student = await StudentModel.findOne({
      admissionNumber: admissionNumber.toUpperCase(),
      studentStatus: "active",
    }).lean();
  } else if (email) {
    student = await StudentModel.findOne({
      email: email.toLowerCase(),
      studentStatus: "active",
    }).lean();
  } else {
    return null;
  }

  if (!student) return null;

  const user = await UserModel.findById(student._id).select("+password").lean();

          if (!user) return null;

          const typedUser = user as unknown as IUser & { password: string };

          const passwordMatch = await bcrypt.compare(
            password,
            typedUser.password
          );
          if (!passwordMatch) return null;

          if (typedUser.status !== UserStatus.ACTIVE) return null;

          // Update last login
          await UserModel.findByIdAndUpdate(typedUser._id, {
            lastLogin: new Date(),
          });

          return {
            id: typedUser._id.toString(),
            email: typedUser.email,
            surname: typedUser.surname,
            firstName: typedUser.firstName,
            otherName: typedUser.otherName,
            roles: typedUser.roles,
            activeRole: UserRole.STUDENT,
            status: typedUser.status,
          };
        }

        // ─────────────────────────────────────────────────────────────
        // 3. STANDARD LOGIN — admin / teacher / student via email + password
        // ─────────────────────────────────────────────────────────────
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        const user = await UserModel.findOne({ email: email.toLowerCase() })
          .select("+password")
          .lean();

        if (!user) return null;

        const typedUser = user as unknown as IUser & { password: string };

        // ✅ Add this — block parents and students from staff login
        const allowedStaffRoles = [UserRole.ADMIN, UserRole.TEACHER];
        const hasStaffRole = typedUser.roles.some((r) => allowedStaffRoles.includes(r));
        if (!hasStaffRole) return null;

        const passwordMatch = await bcrypt.compare(password, typedUser.password);
        if (!passwordMatch) return null;

        if (typedUser.status !== UserStatus.ACTIVE) return null;

        // Update last login
        await UserModel.findByIdAndUpdate(typedUser._id, {
          lastLogin: new Date(),
        });

        return {
          id: typedUser._id.toString(),
          email: typedUser.email,
          surname: typedUser.surname,
          firstName: typedUser.firstName,
          otherName: typedUser.otherName,
          roles: typedUser.roles,
          activeRole: typedUser.roles[0],
          status: typedUser.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.activeRole = user.activeRole;
        token.surname = user.surname;
        token.firstName = user.firstName;
        token.otherName = user.otherName;
        token.status = user.status;
      }
      // Fires when the frontend calls update({ activeRole: "..." })
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
        session.user.surname = token.surname as string;
        session.user.firstName = token.firstName as string;
        session.user.otherName = token.otherName as string;
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
