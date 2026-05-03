export interface GenericDropdownDto {
  id: number | string;
  text: string;
  value?: any;
}

export interface Department {
  depId: number;
  depCode: string;
  departmentName: string;
  hod?: string | null;
}

export interface Designation {
  designationId: number;
  title: string;
}

export interface EmployeeListItem {
  userId: number;
  empCode?: string | null;
  empName?: string | null;
}

export interface EmployeeFilterRequest {
  searchText?: string | null;
  departmentId?: number | null;
  designationId?: number | null;
  status?: string | null;
  hireDateFrom?: string | null;
  hireDateTo?: string | null;
}

export interface CreateEmployeePayload {
  username: string;
  password: string;
  empCode: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fathersName?: string | null;
  mothersName?: string | null;
  dateOfBirth: string;
  gender: string;
  address?: string | null;
  email: string;
  phoneNumber?: string | null;
  hireDate: string;
  designationId: number;
  departmentId: number;
  reportingManagerIds?: number[];
  pan?: string | null;
  aadhaarCard?: string | null;
  bankAccountNumber?: string | null;
  photo?: File | null;
}
