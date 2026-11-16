export type StudentStatus = "Active" | "Inactive";

export type Student = {
  id: string;
  name: string;
  rollNumber: string;
  email: string | null;
  className: string;
  section: string;
  status: StudentStatus;
};

export type StudentFormData = {
  name: string;
  rollNumber: string;
  email: string;
  className: string;
  section: string;
};