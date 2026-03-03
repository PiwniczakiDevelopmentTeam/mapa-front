import type { School } from "@/models/school/School";

export interface ChangedSchool {
  schoolBeforeChanges: School;
  schoolsAfterChanges: School;
}
