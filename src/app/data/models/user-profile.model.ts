export interface UserProfile {
  userId: number;
  employeeId: number;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  designationTitle?: string | null;
  photoUrl?: string | null;
  emailID?: string | null;
}
