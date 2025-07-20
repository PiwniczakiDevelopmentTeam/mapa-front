import { GeographyDTO } from './geographyDTO';

export interface School {
  id: number;
  numerRspo: number;
  geography: GeographyDTO;
  typ?: string;
  statusPublicznoPrawny?: string;
  nazwa: string;
  wojewodztwo?: string;
  gmina?: string;
  powiat?: string;
  miejscowosc?: string;
  gminaRodzaj?: string;
  kodPocztowy?: string;
  ulica?: string;
  numerBudynku?: string;
  numerLokalu?: string;
  email?: string;
  telefon?: string;
  stronaInternetowa?: string;
  dyrektorImie?: string;
  dyrektorNazwisko?: string;
  nip?: string;
  regon?: string;
  dataRozpoczecia?: string;
  dataZalozenia?: string;
  dataZakonczenia?: string;
  dataLikwidacji?: string;
  liczbaUczniow?: number;
  kategoriaUczniow?: string;
  specyfikaSzkoly?: string;
  podmiotProwadzacy?: string;
  podmiotProwadzacyTyp?: string;
}
export interface ChangedSchool {
  schoolBeforeChanges: School;
  schoolsAfterChanges: School;
}

export interface ChangedSchoolsResponse {
  changedSchools: ChangedSchool[];
  newSchools: School[];
  notExistingSchools: School[];
  corruptedRSPO: number[];
  schoolsCount: number;
}