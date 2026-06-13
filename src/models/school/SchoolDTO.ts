import type { GeographyDTO } from "@/models/common/GeographyDTO";

export interface SchoolDTO {
  id: number;
  numerRspo: number;
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
  podmiotProwadzacyTyp?: string;
  podmiotProwadzacyNazwa?: string;
  geography?: GeographyDTO;
  autoUpdate?: boolean;
}
