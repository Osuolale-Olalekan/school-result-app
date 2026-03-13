import AssignmentManagement from "@/components/shared/AssignmentManagement"
       import { UserRole } from "@/types/enums"
       export default function Page() { return <AssignmentManagement role={UserRole.TEACHER} /> }