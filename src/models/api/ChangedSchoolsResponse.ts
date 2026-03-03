import type { School } from "@/models/school/School";
import type { ChangedSchool } from "@/models/school/ChangedSchool";

export interface ChangedSchoolsResponse {
  changedSchools: ChangedSchool[];
  newSchools: School[];
  notExistingSchools: School[];
  corruptedRSPO: number[];
  schoolsCount: number;
}
