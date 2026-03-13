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
        // 1. PARENT LOGIN — via child's admission number + own password
        // ─────────────────────────────────────────────────────────────
        if (loginType === "parent") {
          const admissionNumber = credentials.admissionNumber as string;
          const password = credentials.password as string;

          if (!admissionNumber || !password) return null;

          const StudentModel = (await import("@/models/Student")).default;
          const ParentModel = (await import("@/models/Parent")).default;

          // Find the student by admission number
          const student = await StudentModel.findOne({
            admissionNumber: admissionNumber.toUpperCase(),
          }).lean();

          if (!student) return null;

          // Find the parent linked to this student
          const parent = await ParentModel.findOne({
            children: student._id,
            status: UserStatus.ACTIVE,
          })
            .select("+password")
            .lean();

          if (!parent) return null;

          const passwordMatch = await bcrypt.compare(
            password,
            (parent as unknown as { password: string }).password
          );
          if (!passwordMatch) return null;

          const parentTyped = parent as unknown as IUser;

          // Update last login
          await UserModel.findByIdAndUpdate(parent._id, {
            lastLogin: new Date(),
          });

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
          const password = credentials.password as string;

          if (!admissionNumber || !password) return null;

          const StudentModel = (await import("@/models/Student")).default;

          // Find student by admission number
          const student = await StudentModel.findOne({
            admissionNumber: admissionNumber.toUpperCase(),
            studentStatus: "active",
          }).lean();

          if (!student) return null;

          // The student's password lives on the base User document (same _id,
          // discriminator pattern), so we fetch it from UserModel directly.
          const user = await UserModel.findById(student._id)
            .select("+password")
            .lean();

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
// import { cookies } from "next/headers";
// import NextAuth, { type NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcrypt";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import { UserRole, UserStatus } from "@/types/enums";
// import type { IUser } from "@/types";

// export const authConfig: NextAuthOptions = {
//   secret: process.env.NEXTAUTH_SECRET,
//    session: { 
//     strategy: "jwt",
//     maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
//   },
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//         admissionNumber: { label: "Admission Number", type: "text" },
//         loginType: { label: "Login Type", type: "text" },
//       },
//       async authorize(credentials) {
//         if (!credentials) return null;

//         await connectDB();

//         const loginType = credentials.loginType as string;
       

//         // Parent login via admission number
//         if (loginType === "parent") {
//           const admissionNumber = credentials.admissionNumber as string;
//           if (!admissionNumber) return null;

//           const StudentModel = (await import("@/models/Student")).default;
//           const ParentModel = (await import("@/models/Parent")).default;

//           const student = await StudentModel.findOne({ admissionNumber: admissionNumber.toUpperCase() }).lean();
//           if (!student) return null;

//           const parent = await ParentModel.findOne({
//             children: student._id,
//             status: UserStatus.ACTIVE,
//           }).select("+password").lean();

//           if (!parent) return null;

//           const passwordMatch = await bcrypt.compare(
//             credentials.password as string,
//             (parent as unknown as { password: string }).password
//           );
//           if (!passwordMatch) return null;

//           const parentTyped = parent as unknown as IUser;
//           return {
//             id: parent._id.toString(),
//             email: (parent as unknown as IUser).email,
//             surname: (parent as unknown as IUser).surname,
//             firstName: (parent as unknown as IUser).firstName,
//             otherName: (parent as unknown as IUser).otherName,
//             // role: UserRole.PARENT,
//             roles: parentTyped.roles,
//             activeRole: UserRole.PARENT,
//             status: (parent as unknown as IUser).status,
//           };
//         }

//         // Standard login for admin, teacher, student
//         const email = credentials.email as string;
//         const password = credentials.password as string;
//         if (!email || !password) return null;

       

//         const user = await UserModel.findOne({ email: email.toLowerCase() }).select('+password').lean();
       

//         if (!user) return null;

//         const typedUser = user as unknown as IUser & { password: string };
        

//         const passwordMatch = await bcrypt.compare(password, typedUser.password);
      

//         if (!passwordMatch) return null;

//         if (typedUser.status !== UserStatus.ACTIVE) return null;

//         // Update last login
//         await UserModel.findByIdAndUpdate(typedUser._id, { lastLogin: new Date() });

//         return {
//           id: typedUser._id.toString(),
//           email: typedUser.email,
//           surname: typedUser.surname,
//           firstName: typedUser.firstName,
//           otherName: typedUser.otherName,
//           roles: typedUser.roles,
//           activeRole: typedUser.roles[0],
//           status: typedUser.status,
//         };
//       },
//     }),
//   ],
//   // session: { strategy: "jwt" },
//   callbacks: {
//    async jwt({ token, user, trigger, session }) {
//   if (user) {
    
//     token.id = user.id;
//     token.roles = user.roles;
//     token.activeRole = user.activeRole;
//     token.surname = user.surname;
//     token.firstName = user.firstName;
//     token.otherName = user.otherName;
//     token.status = user.status;
//   }
//   // fires when frontend calls update({ activeRole: "parent" })
//   if (trigger === "update" && session?.activeRole) {
//     if ((token.roles as UserRole[]).includes(session.activeRole)) {
//       token.activeRole = session.activeRole;
//     }
//   }
//   return token;
// },

// async session({ session, token }) {
//   if (token) {
//     session.user.id = token.id as string;
//     session.user.roles = token.roles as UserRole[];
//     session.user.activeRole = token.activeRole as UserRole;
//     session.user.surname = token.surname as string;
//     session.user.firstName = token.firstName as string;
//     session.user.otherName = token.otherName as string;
//     session.user.status = token.status as UserStatus;
//   }
//   return session;
// },
//   },
//   pages: {
//     signIn: "/sign-in",
//     error: "/sign-in",
//   },
// };

// export default NextAuth(authConfig);

// import NextAuth, { type NextAuthOptions } from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcrypt";
// import { connectDB } from "@/lib/db";
// import UserModel from "@/models/User";
// import { UserRole, UserStatus } from "@/types/enums";
// import type { IUser } from "@/types";

// export const authConfig: NextAuthOptions = {
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//     maxAge: 7 * 24 * 60 * 60,
//   },
//   providers: [
//     CredentialsProvider({
//       name: "credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//         admissionNumber: { label: "Admission Number", type: "text" },
//         loginType: { label: "Login Type", type: "text" },
//       },
//       async authorize(credentials) {
//         if (!credentials) return null;

//         await connectDB();

//         const loginType = credentials.loginType as string;

//         // Parent login via admission number
//         if (loginType === "parent") {
//           const admissionNumber = credentials.admissionNumber as string;
//           if (!admissionNumber) return null;

//           const StudentModel = (await import("@/models/Student")).default;
//           const ParentModel = (await import("@/models/Parent")).default;

//           const student = await StudentModel.findOne({
//             admissionNumber: admissionNumber.toUpperCase(),
//           }).lean();
//           if (!student) return null;

//           const parent = await ParentModel.findOne({
//             children: student._id,
//             status: UserStatus.ACTIVE,
//           })
//             .select("+password")
//             .lean();
//           if (!parent) return null;

//           const parentWithPassword = parent as unknown as IUser & {
//             password: string;
//           };

//           const passwordMatch = await bcrypt.compare(
//             credentials.password as string,
//             parentWithPassword.password
//           );
//           if (!passwordMatch) return null;

//           return {
//             id: parentWithPassword._id.toString(),
//             email: parentWithPassword.email,
//             surname: parentWithPassword.surname,
//             firstName: parentWithPassword.firstName,
//             otherName: parentWithPassword.otherName,
//             roles: parentWithPassword.roles,
//             activeRole: UserRole.PARENT,
//             status: parentWithPassword.status,
//           };
//         }

//         // Standard login for admin, teacher, student
//         const email = credentials.email as string;
//         const password = credentials.password as string;
//         if (!email || !password) return null;

//         const user = await UserModel.findOne({
//           email: email.toLowerCase(),
//         })
//           .select("+password")
//           .lean();
//         if (!user) return null;

//         const typedUser = user as unknown as IUser & { password: string };

//         const passwordMatch = await bcrypt.compare(password, typedUser.password);
//         if (!passwordMatch) return null;

//         if (typedUser.status !== UserStatus.ACTIVE) return null;

//         await UserModel.findByIdAndUpdate(typedUser._id, {
//           lastLogin: new Date(),
//         });

//         return {
//           id: typedUser._id.toString(),
//           email: typedUser.email,
//           surname: typedUser.surname,
//           firstName: typedUser.firstName,
//           otherName: typedUser.otherName,
//           roles: typedUser.roles,
//           activeRole: typedUser.roles[0],
//           status: typedUser.status,
//         };
//       },
//     }),
//   ],

//   callbacks: {
//     async jwt({ token, user, trigger, session }) {
//       // On initial sign in, populate token from user object
//       if (user) {
//         token.id = user.id;
//         token.roles = user.roles;
//         token.activeRole = user.activeRole;
//         token.surname = user.surname;
//         token.firstName = user.firstName;
//         token.otherName = user.otherName;
//         token.status = user.status;
//       }

//       // On every subsequent request, verify user still exists and is active
//       if (!user && token.id) {
//         await connectDB();
//         const dbUser = await UserModel.findById(token.id)
//           .select("status")
//           .lean();
//         const typedDbUser = dbUser as { status: UserStatus } | null;

//         if (!typedDbUser || typedDbUser.status !== UserStatus.ACTIVE) {
//           token.id = "";
//           token.roles = [];
//           token.activeRole = undefined;
//           token.status = undefined;
//         }
//       }

//       // Handle active role switching
//       if (trigger === "update" && session?.activeRole) {
//         if ((token.roles as UserRole[]).includes(session.activeRole)) {
//           token.activeRole = session.activeRole;
//         }
//       }

//       return token;
//     },

//     async session({ session, token }) {
//       // If token was cleared, return session without user to force sign out
//       if (!token.id) {
//         return { ...session, user: undefined };
//       }

//       session.user.id = token.id as string;
//       session.user.roles = token.roles as UserRole[];
//       session.user.activeRole = token.activeRole as UserRole;
//       session.user.surname = token.surname as string;
//       session.user.firstName = token.firstName as string;
//       session.user.otherName = token.otherName as string;
//       session.user.status = token.status as UserStatus;

//       return session;
//     },
//   },

//   pages: {
//     signIn: "/sign-in",
//     error: "/sign-in",
//   },
// };

// export default NextAuth(authConfig);