import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';

// ============================================================
// JOLMES GRUPPE — Total Cost of Ownership Vertriebstool
// ============================================================

const BRANCHEN = {
  industrie: {
    label: 'Industrie & Produktion',
    defaultVolumen: 180000,
    defaultStundensatz: 75,
    multipliers: { qualitaet: 1.4, kommunikation: 1.3, operativ: 1.8, compliance: 1.2, strategisch: 1.1 },
    spezialkategorien: ['produktionsausfall', 'maschinenstillstand', 'atex'],
    compliance: 'ATEX, GMP, Maschinenrichtlinie',
    notfall: 'Produktionsausfall: 5.000-50.000 €/h',
  },
  buero: {
    label: 'Büro & Verwaltung',
    defaultVolumen: 60000,
    defaultStundensatz: 65,
    multipliers: { qualitaet: 1.0, kommunikation: 1.1, operativ: 0.9, compliance: 0.9, strategisch: 1.0 },
    spezialkategorien: ['krankheitsausfaelle', 'repraesentation'],
    compliance: 'ArbStättV, DSGVO',
    notfall: 'Ausfall Büroflächen: ca. 200-500 €/MA/Tag',
  },
  healthcare: {
    label: 'Healthcare (Krankenhäuser, Pflege, Praxen)',
    defaultVolumen: 250000,
    defaultStundensatz: 85,
    multipliers: { qualitaet: 2.5, kommunikation: 1.4, operativ: 1.8, compliance: 2.3, strategisch: 1.3 },
    spezialkategorien: ['nosokomial', 'rki', 'ifsg'],
    compliance: 'IfSG, RKI/KRINKO, MPG, MedBetreibV',
    notfall: 'Stationsschließung: 10.000-30.000 €/Tag',
  },
  retail: {
    label: 'Retail & Einzelhandel',
    defaultVolumen: 80000,
    defaultStundensatz: 60,
    multipliers: { qualitaet: 1.3, kommunikation: 1.2, operativ: 1.4, compliance: 0.9, strategisch: 1.6 },
    spezialkategorien: ['umsatzverlust', 'filialschliessung'],
    compliance: 'LMHV (bei Foodbereich), ArbStättV',
    notfall: 'Filialschließung: 2.000-15.000 €/Tag',
  },
  oeffentlich: {
    label: 'Öffentliche Hand (Behörden, Schulen, Kommunen)',
    defaultVolumen: 120000,
    defaultStundensatz: 70,
    multipliers: { qualitaet: 1.4, kommunikation: 1.3, operativ: 1.0, compliance: 1.8, strategisch: 1.2 },
    spezialkategorien: ['vergabe', 'tariftreue'],
    compliance: 'VgV, UVgO, Tariftreuegesetze NRW (TVgG)',
    notfall: 'Schul-/Behördenschließung: hoher Reputationsschaden',
  },
  hotellerie: {
    label: 'Hotellerie & Gastronomie',
    defaultVolumen: 100000,
    defaultStundensatz: 65,
    multipliers: { qualitaet: 1.7, kommunikation: 1.2, operativ: 1.4, compliance: 1.3, strategisch: 2.0 },
    spezialkategorien: ['bewertung', 'umsatzverlust_hotel'],
    compliance: 'LMHV, HACCP, IfSG',
    notfall: 'Bewertungsverlust: nachhaltiger Umsatzschaden',
  },
  logistik: {
    label: 'Logistik & Lagerhallen',
    defaultVolumen: 90000,
    defaultStundensatz: 70,
    multipliers: { qualitaet: 1.2, kommunikation: 1.2, operativ: 1.5, compliance: 1.1, strategisch: 1.0 },
    spezialkategorien: ['stillstand', 'sicherheit'],
    compliance: 'ArbStättV, DGUV V 68',
    notfall: 'Stillstand Logistikzentrum: 3.000-20.000 €/h',
  },
  bildung: {
    label: 'Bildung (Universitäten, Kitas, Schulen)',
    defaultVolumen: 110000,
    defaultStundensatz: 65,
    multipliers: { qualitaet: 1.5, kommunikation: 1.2, operativ: 1.1, compliance: 1.4, strategisch: 1.0 },
    spezialkategorien: ['aufsichtspflicht', 'krankheit_bildung'],
    compliance: 'IfSG §33/§34, KitaG, Schulgesetze',
    notfall: 'Schließung: Reputationsschaden + Haftung',
  },
  lebensmittel: {
    label: 'Lebensmittelindustrie',
    defaultVolumen: 220000,
    defaultStundensatz: 80,
    multipliers: { qualitaet: 2.2, kommunikation: 1.4, operativ: 1.7, compliance: 2.2, strategisch: 1.6 },
    spezialkategorien: ['ifs', 'rueckruf', 'haccp'],
    compliance: 'HACCP, IFS Food, BRC, LMHV, EU 852/2004',
    notfall: 'Produktrückruf: 0,5-10 Mio. €',
  },
  banken: {
    label: 'Banken & Versicherungen',
    defaultVolumen: 140000,
    defaultStundensatz: 90,
    multipliers: { qualitaet: 1.3, kommunikation: 1.2, operativ: 1.0, compliance: 2.0, strategisch: 1.4 },
    spezialkategorien: ['bait_marisk', 'datenschutz'],
    compliance: 'BAIT, MaRisk, DSGVO, KWG §25b',
    notfall: 'Datenschutzvorfall: bis 4% Jahresumsatz Bußgeld',
  },
};

const KATEGORIEN = [
  // A) QUALITÄT & ZERTIFIZIERUNG
  {
    id: 'iso9001',
    gruppe: 'A',
    titel: 'Fehlende ISO 9001 — höhere Reklamationsquote',
    basisProzent: 0.04,
    multGroup: 'qualitaet',
    begruendung: 'Nicht-zertifizierte Dienstleister haben keine systematische Reklamationsbearbeitung und Korrekturmaßnahmenstruktur. ISO 9001 fordert in Abschnitt 8.4 explizit Lieferantenüberwachung und Eskalationsstufen für externe Anbieter.',
    quelle: 'TÜV SÜD / DIN EN ISO 9001:2015',
    quelleUrl: 'https://www.tuvsud.com/de-de/dienstleistungen/auditierung-und-zertifizierung/audit-services/lieferantenaudit',
  },
  {
    id: 'iso14001',
    gruppe: 'A',
    titel: 'Fehlende ISO 14001 — keine ESG-Daten für CSRD/Lieferketten',
    basisProzent: 0.03,
    multGroup: 'qualitaet',
    begruendung: 'CSRD-pflichtige Unternehmen (>1.000 MA und >450 Mio. € Umsatz) sowie Tier-1-Lieferanten dieser Konzerne benötigen ESG-Daten von Dienstleistern. Ohne ISO 14001 müssen Sie eigene Erhebungen durchführen oder Ausschluss aus Lieferketten riskieren.',
    quelle: 'EU-Omnibus 2026, IHK München, EFRAG VSME',
    quelleUrl: 'https://www.ihk-muenchen.de/de/Service/Nachhaltigkeit-CSR/Nachhaltigkeitsberichterstattung/',
  },
  {
    id: 'amsbgbau',
    gruppe: 'A',
    titel: 'Fehlendes AMS BG Bau — Auswahlverschulden §831 BGB',
    basisProzent: 0.025,
    multGroup: 'compliance',
    begruendung: 'Bei Schäden durch Reinigungspersonal haftet der Auftraggeber nach §831 BGB für Auswahl- und Überwachungsverschulden, sofern Weisungsabhängigkeit besteht. AMS BG Bau ist anerkannter Nachweis für sorgfältige Lieferantenauswahl bei risikobehafteten Tätigkeiten.',
    quelle: '§831 BGB, BGH VI ZR 182/01',
    quelleUrl: 'https://dejure.org/gesetze/BGB/831.html',
  },
  {
    id: 'fehlerdoku',
    gruppe: 'A',
    titel: 'Keine systematische Fehlerdokumentation — wiederkehrende Mängel',
    basisProzent: 0.025,
    multGroup: 'qualitaet',
    begruendung: 'Ohne CAPA-System (Corrective and Preventive Actions) wiederholen sich Mängel an gleichen Stellen. Studien zeigen: Reklamationsquoten reduzieren sich um 30-50% bei systematischer Fehlerdokumentation.',
    quelle: 'BIV — Leitfaden Qualitätssicherung Gebäudereinigung',
    quelleUrl: 'https://www.die-gebaeudedienstleister.de/kunden-und-auftraggeber/ausschreibung-und-vergabe/',
  },

  // B) KOMMUNIKATION & KOORDINATION
  {
    id: 'multivendor',
    gruppe: 'B',
    titel: 'Multi-Vendor-Koordination — interner Zeitaufwand',
    basisStunden: 8,
    multGroup: 'kommunikation',
    isStunden: true,
    begruendung: 'Pro zusätzlichem Dienstleister fallen ca. 8 h/Monat interner Aufwand für Koordination, Abstimmung und Reporting an. Studien zeigen 10-20% Kostenersparnis durch Vendor Consolidation, Gartner berichtet bis 30% reduzierte Support-Kosten.',
    quelle: 'Ramp Vendor Consolidation Study 2025, Gartner / Salesforce TEI Report',
    quelleUrl: 'https://ramp.com/blog/vendor-consolidation',
  },
  {
    id: 'schnittstellen',
    gruppe: 'B',
    titel: 'Schnittstellenverluste zwischen Gewerken',
    basisProzent: 0.03,
    multGroup: 'kommunikation',
    begruendung: 'Wenn Reinigung, Maler und Sanierung unterschiedliche Anbieter haben, fehlen Übergabeprozesse. Beispiel: nach Wasserschaden — Trocknung durch Anbieter A, Malerarbeiten durch B, Endreinigung durch C — jeder Übergang erzeugt Verzögerungen und Doppelarbeit.',
    quelle: 'GEFMA — Facility Management Studie',
    quelleUrl: 'https://www.gefma.de/',
  },
  {
    id: 'ansprechpartner',
    gruppe: 'B',
    titel: 'Mehrere Ansprechpartner statt Single-Point-of-Contact',
    basisStunden: 4,
    multGroup: 'kommunikation',
    isStunden: true,
    begruendung: 'Pro zusätzlichem Dienstleister ca. 4 h/Monat für separate Kommunikation, Eskalation und Statusabfragen. Bei Notfällen verlängert sich Reaktionszeit signifikant.',
    quelle: 'Proven IT — True Cost of Multiple Vendors',
    quelleUrl: 'https://provenit.com/blog/the-true-cost-of-vendor-overload/',
  },
  {
    id: 'verwaltung',
    gruppe: 'B',
    titel: 'Doppelter Verwaltungsaufwand (Verträge, Rechnungen, SLAs)',
    basisStunden: 3,
    multGroup: 'kommunikation',
    isStunden: true,
    begruendung: 'Jeder Dienstleister erzeugt eigene Verträge, monatliche Rechnungen, separate SLAs und Reporting-Formate. Die Konsolidierung administrativer Aufwände ist einer der nachweisbar größten Hebel im Lieferantenmanagement.',
    quelle: 'Diligent / First Citizens Vendor Consolidation',
    quelleUrl: 'https://www.diligent.com/resources/blog/why-vendor-consolidation-is-critical',
  },
  {
    id: 'reporting',
    gruppe: 'B',
    titel: 'Uneinheitliche Reporting-Formate',
    basisStunden: 2,
    multGroup: 'kommunikation',
    isStunden: true,
    begruendung: 'Manuelle Konsolidierung verschiedener Reportingformate für FM-Controlling oder Geschäftsleitung. Bei 5 Dienstleistern und monatlichem Reporting: 10+ Stunden Konsolidierungsaufwand.',
    quelle: 'IFMA / GEFMA Benchmarking',
    quelleUrl: 'https://www.gefma.de/',
  },

  // C) OPERATIVE RISIKEN
  {
    id: 'notfall',
    gruppe: 'C',
    titel: 'Notfall-Reaktionszeit (Brand-/Wasserschaden) ohne Inhouse-Sanierung',
    basisProzent: 0.06,
    multGroup: 'operativ',
    begruendung: 'Bei Wasserschäden steigen Folgekosten exponentiell mit der Verzögerung. Verzögerte Trocknung führt zu Schimmelbildung — Folgeschäden von 25.000 € und mehr bei kleinen Leckagen. Externe Sanierungspartner haben oft 24-48h Reaktionszeit; Jolmes als Inhouse-Partner reagiert binnen Stunden.',
    quelle: 'Bautentrocknungsgewerbe / DSH — Wasserschaden Folgekosten',
    quelleUrl: 'https://deutsche-schadenshilfe.de/wasserschaden/wasserschadensanierung-kosten/',
  },
  {
    id: 'fluktuation',
    gruppe: 'C',
    titel: 'Höhere Mitarbeiterfluktuation — Qualitätsverlust',
    basisProzent: 0.045,
    multGroup: 'operativ',
    begruendung: 'Branchenfluktuation in Gebäudedienstleistung liegt bei 30-40%. Bei jedem Wechsel: Einarbeitung, Schlüsselübergaben, Qualitätseinbruch in den ersten Wochen. Fluktuationskosten pro Stelle: durchschnittlich 43.000 € (Wolf 2017), bei einfachen Positionen anteilig niedriger, aber bei höherer Frequenz.',
    quelle: 'Bundesagentur für Arbeit, Wolf 2017, Workdate Branchenanalyse',
    quelleUrl: 'https://workdate.com/de/wiki/kosten-mitarbeiterfluktuation',
  },
  {
    id: 'objektbegehung',
    gruppe: 'C',
    titel: 'Keine proaktive Objektbegehung durch Führungsteam',
    basisProzent: 0.02,
    multGroup: 'operativ',
    begruendung: 'Ohne regelmäßige Objektbegehung durch Führungskräfte werden Qualitätsprobleme erst nach Reklamation sichtbar. ISO 9001:2015 fordert systematische Leistungsüberwachung externer Anbieter. Begehung durch Dienstleister selbst bedeutet zusätzlichen Aufwand für den Auftraggeber.',
    quelle: 'BIV Qualitätssicherung, ISO 9001:2015 Abschnitt 9.1',
    quelleUrl: 'https://www.die-gebaeudedienstleister.de/',
  },
  {
    id: 'personalvermittlung',
    gruppe: 'C',
    titel: 'Externe Personalvermittlung bei Kapazitätsspitzen',
    basisProzent: 0.025,
    multGroup: 'operativ',
    begruendung: 'Spitzenlasten (Großveranstaltungen, Schadensfälle, Personalausfall) müssen extern eingekauft werden. Vermittlungsprovisionen 15-25% des Stundensatzes. Jolmes verfügt über eigenen Personalvermittlungsbereich.',
    quelle: 'BAP — Bundesarbeitgeberverband Personaldienstleister',
    quelleUrl: 'https://www.personaldienstleister.de/',
  },

  // D) COMPLIANCE & HAFTUNG
  {
    id: 'audit',
    gruppe: 'D',
    titel: 'Audit-Aufwand bei nicht-zertifizierten Lieferanten',
    basisStunden: 16,
    multGroup: 'compliance',
    isStunden: true,
    isJaehrlich: true,
    begruendung: 'ISO 9001 schreibt für Auftraggeber Lieferantenaudits vor, wenn der Lieferant nicht selbst zertifiziert ist. Kunden des Auftraggebers (CSRD-pflichtige Unternehmen) verlangen zunehmend dokumentierte Lieferantenaudits. 1-2 Tage Aufwand pro Audit, jährlich.',
    quelle: 'ISO 9001:2015 §8.4, ISO 19011',
    quelleUrl: 'https://www.innolytics.de/was-ist-ein-lieferantenaudit/',
  },
  {
    id: 'haftung',
    gruppe: 'D',
    titel: 'Haftungsrisiko bei Arbeitsunfällen (§831 BGB)',
    basisProzent: 0.02,
    multGroup: 'compliance',
    begruendung: 'Bei nicht-zertifizierten Subunternehmern muss der Auftraggeber selbst Eignung, Einweisung und Überwachung dokumentieren — sonst greift Auswahl- und Überwachungsverschulden. BGH-Rechtsprechung verlangt nachvollziehbare Maßnahmen, nicht bloße Behauptungen.',
    quelle: '§831 BGB, BGH VI ZR 182/01, BGH VI ZR 215/93',
    quelleUrl: 'https://www.anwalt.de/rechtstipps/haftung-fuer-verrichtungsgehilfen-gemaess-831-bgb-262627.html',
  },
  {
    id: 'lksg',
    gruppe: 'D',
    titel: 'Lieferkettensorgfaltspflichtengesetz (LkSG) — Dokumentationsaufwand',
    basisStunden: 6,
    multGroup: 'compliance',
    isStunden: true,
    isJaehrlich: true,
    begruendung: 'LkSG-pflichtige Unternehmen (>1.000 MA) müssen Risikoanalysen für Dienstleister durchführen. Bei zertifizierten Anbietern reduziert sich der Aufwand erheblich, da Nachweise standardisiert vorliegen.',
    quelle: 'LkSG (BGBl. I 2021 S. 2959), BAFA Handreichung',
    quelleUrl: 'https://www.bafa.de/DE/Lieferketten/lieferketten_node.html',
  },
  {
    id: 'versicherung',
    gruppe: 'D',
    titel: 'Versicherungsprämien-Risiko bei Schäden durch Subunternehmer',
    basisProzent: 0.015,
    multGroup: 'compliance',
    begruendung: 'Häufige Schadensfälle durch Subunternehmer wirken sich auf die Sachversicherung des Auftraggebers aus. Versicherer fordern zunehmend Nachweise über Lieferantenauswahl bei Risikobewertung.',
    quelle: 'GDV — Gesamtverband der Deutschen Versicherungswirtschaft',
    quelleUrl: 'https://www.gdv.de/',
  },

  // E) STRATEGISCHE KOSTEN
  {
    id: 'wechsel',
    gruppe: 'E',
    titel: 'Wechselkosten bei Dienstleisterwechsel (Onboarding)',
    basisProzent: 0.03,
    multGroup: 'strategisch',
    begruendung: 'Bei Anbieterwechsel: Neueinarbeitung, Objektübergabe, Schlüsselverwaltung, Wiederaufbau von Reinigungsstandards. Diese Kosten fallen bei häufigem Wechsel (durch Qualitätsprobleme) regelmäßig an.',
    quelle: 'BIV Branchenanalyse',
    quelleUrl: 'https://www.die-gebaeudedienstleister.de/',
  },
  {
    id: 'knowhow',
    gruppe: 'E',
    titel: 'Verlust von Prozess-Know-how bei Anbieterwechsel',
    basisProzent: 0.02,
    multGroup: 'strategisch',
    begruendung: 'Erfahrungswissen über Objektbesonderheiten (Materialempfindlichkeiten, Zugangsregeln, Sonderwünsche) geht beim Wechsel verloren. Stabile Partner bauen Know-how kontinuierlich aus.',
    quelle: 'GEFMA — Whitepaper Service Continuity',
    quelleUrl: 'https://www.gefma.de/',
  },
  {
    id: 'reputation',
    gruppe: 'E',
    titel: 'Reputationsrisiko bei sichtbaren Qualitätsmängeln',
    basisProzent: 0.025,
    multGroup: 'strategisch',
    begruendung: 'Verschmutzte Eingangsbereiche, Glasflächen oder Sanitäranlagen wirken direkt auf Kundenwahrnehmung und Mitarbeiterzufriedenheit. Studien zeigen messbaren Einfluss auf Kundenkonversion und Mitarbeiterbindung.',
    quelle: 'ISSA — Cleaning Industry Research, GEFMA',
    quelleUrl: 'https://www.issa.com/',
  },

  // BRANCHENSPEZIFISCH

  // Healthcare
  {
    id: 'nosokomial',
    gruppe: 'B-spez',
    titel: 'Risiko nosokomialer Infektionen — RKI/DGKH',
    basisProzent: 0.05,
    multGroup: 'qualitaet',
    branchen: ['healthcare'],
    begruendung: 'In Deutschland ca. 600.000 nosokomiale Infektionen jährlich, bis zu 20.000 € Mehrkosten pro Infektion durch verlängerte Verweildauer. Die DGKH schätzt sogar 900.000 Fälle. Bis zu 1/3 sind durch konsequente Hygienemaßnahmen vermeidbar.',
    quelle: 'RKI, BVMed, DGKH',
    quelleUrl: 'https://www.bvmed.de/themen/infektionsschutz/nosokomiale-infektionen',
  },
  {
    id: 'rki',
    gruppe: 'B-spez',
    titel: 'Verstoß RKI/KRINKO-Richtlinien — Bußgelder, Schließung',
    basisProzent: 0.04,
    multGroup: 'compliance',
    branchen: ['healthcare'],
    begruendung: 'IfSG §23 verpflichtet zur Einhaltung KRINKO-Standards. Bei Verstößen drohen Bußgelder, in schweren Fällen Stationsschließungen. Reinigungspersonal muss nach §23 IfSG geschult sein.',
    quelle: 'IfSG §23, KRINKO-Empfehlungen',
    quelleUrl: 'https://www.rki.de/DE/Themen/Infektionskrankheiten/Krankenhaushygiene/Krankenhaushygiene_node.html',
  },

  // Lebensmittel
  {
    id: 'ifs',
    gruppe: 'B-spez',
    titel: 'Auditverlust IFS Food / BRC — Kundenverlust',
    basisProzent: 0.06,
    multGroup: 'compliance',
    branchen: ['lebensmittel'],
    begruendung: 'IFS Food und BRC sind Pflicht-Audits für Lieferanten an LEH. Hygienemängel durch ungeschulte Reinigungskräfte können zur Abwertung führen — der Verlust eines Großkunden wiegt deutlich schwerer als die Reinigungskosten.',
    quelle: 'IFS Management GmbH',
    quelleUrl: 'https://www.ifs-certification.com/',
  },
  {
    id: 'rueckruf',
    gruppe: 'B-spez',
    titel: 'Produktrückruf durch Kontamination',
    basisProzent: 0.04,
    multGroup: 'operativ',
    branchen: ['lebensmittel'],
    begruendung: 'Mikrobielle Kontaminationen aus mangelhafter Reinigung können Rückrufe auslösen. Durchschnittliche Rückrufkosten in der Lebensmittelindustrie: 0,5-10 Mio. €. HACCP-Verstöße sind §§ 5, 39 LFGB-relevant.',
    quelle: 'BLL/Lebensmittelverband, EU 852/2004',
    quelleUrl: 'https://www.bvl.bund.de/DE/01_Lebensmittel/lebensmittel_node.html',
  },

  // Industrie
  {
    id: 'produktionsausfall',
    gruppe: 'B-spez',
    titel: 'Produktionsausfallkosten pro Stunde',
    basisProzent: 0.05,
    multGroup: 'operativ',
    branchen: ['industrie'],
    begruendung: 'Verschmutzungen oder Schäden in Produktionsbereichen können Linienstillstände verursachen. Stillstandskosten in der Industrie: 5.000-50.000 €/Stunde. Schnelle Reinigung und Sanierung aus einer Hand minimiert Ausfallzeit.',
    quelle: 'VDMA, Bitkom — Studie Produktionsstillstand',
    quelleUrl: 'https://www.vdma.org/',
  },
  {
    id: 'atex',
    gruppe: 'B-spez',
    titel: 'ATEX-Konformität in Ex-Bereichen',
    basisProzent: 0.02,
    multGroup: 'compliance',
    branchen: ['industrie'],
    begruendung: 'In Ex-Schutzbereichen darf nur entsprechend geschultes Personal mit zugelassenem Equipment arbeiten (BetrSichV, TRBS 2152). Verstöße können zum Verlust der Ex-Schutz-Zulassung führen.',
    quelle: 'BetrSichV, TRBS 2152, ATEX 137',
    quelleUrl: 'https://www.baua.de/',
  },

  // Retail
  {
    id: 'umsatzverlust',
    gruppe: 'B-spez',
    titel: 'Umsatzverlust durch sichtbare Mängel',
    basisProzent: 0.05,
    multGroup: 'strategisch',
    branchen: ['retail'],
    begruendung: 'Untersuchungen zeigen einen direkten Zusammenhang zwischen Sauberkeit und Conversion Rate. Verschmutzte Sanitäranlagen oder Eingangsbereiche reduzieren Wiederbesuchsrate signifikant.',
    quelle: 'EHI Retail Institute',
    quelleUrl: 'https://www.ehi.org/',
  },

  // Öffentliche Hand
  {
    id: 'vergabe',
    gruppe: 'B-spez',
    titel: 'Vergaberechtliche Probleme bei nicht-zertifizierten Subunternehmern',
    basisProzent: 0.03,
    multGroup: 'compliance',
    branchen: ['oeffentlich'],
    begruendung: 'Öffentliche Auftraggeber sind nach §128 GWB verpflichtet, Eignung von Nachunternehmern zu prüfen. Bei Aufdeckung von Verstößen drohen Vertragsauflösung und Ausschluss von künftigen Vergaben.',
    quelle: '§128 GWB, VgV, UVgO',
    quelleUrl: 'https://www.gesetze-im-internet.de/gwb/__128.html',
  },
  {
    id: 'tariftreue',
    gruppe: 'B-spez',
    titel: 'Tariftreueverstöße — Vertragsstrafen',
    basisProzent: 0.025,
    multGroup: 'compliance',
    branchen: ['oeffentlich'],
    begruendung: 'TVgG NRW und vergleichbare Landesgesetze fordern Tariftreueerklärungen. Bei Verstößen Vertragsstrafen bis 1% Auftragssumme/Monat möglich. Kontrollpflicht des Auftraggebers!',
    quelle: 'TVgG NRW, LTTG RLP, BayTariftreueG',
    quelleUrl: 'https://recht.nrw.de/lmi/owa/br_text_anzeigen?v_id=2820111014104536067',
  },

  // Banken
  {
    id: 'bait_marisk',
    gruppe: 'B-spez',
    titel: 'BAIT/MaRisk-Auditrisiko bei Lieferantenmanagement',
    basisProzent: 0.025,
    multGroup: 'compliance',
    branchen: ['banken'],
    begruendung: 'BAIT (Bankaufsichtliche Anforderungen an die IT) und MaRisk AT 9 fordern dokumentiertes Auslagerungs- und Lieferantenmanagement. Bei Reinigungsdienstleistern in sensiblen Bereichen (Server, Vorstandsräume) sind erhöhte Sorgfaltspflichten zu beachten.',
    quelle: 'BAIT 2021, MaRisk AT 9, KWG §25b',
    quelleUrl: 'https://www.bafin.de/DE/Aufsicht/BankenFinanzdienstleister/Risikomanagement/MaRisk/marisk_node.html',
  },
  {
    id: 'datenschutz',
    gruppe: 'B-spez',
    titel: 'Datenschutzrisiken bei Reinigung sensibler Bereiche',
    basisProzent: 0.025,
    multGroup: 'compliance',
    branchen: ['banken'],
    begruendung: 'Reinigungspersonal hat Zugang zu Bürobereichen mit personenbezogenen Daten. Auftragsverarbeitungsverträge nach Art. 28 DSGVO oder spezielle Verschwiegenheitsverpflichtungen sind erforderlich. Bußgelder bei DSGVO-Verstößen bis 4% Jahresumsatz.',
    quelle: 'DSGVO Art. 28, BfDI',
    quelleUrl: 'https://www.bfdi.bund.de/',
  },

  // Hotellerie
  {
    id: 'bewertung',
    gruppe: 'B-spez',
    titel: 'Bewertungsverlust bei Hygienemängeln',
    basisProzent: 0.045,
    multGroup: 'strategisch',
    branchen: ['hotellerie'],
    begruendung: 'Hygiene ist Top-Bewertungskriterium auf TripAdvisor, Booking.com und HolidayCheck. Ein Punkt weniger im Schnitt kann bis 20% Buchungsverlust bedeuten. Negativbewertungen bleiben dauerhaft sichtbar.',
    quelle: 'STR / Cornell Hotel Studies',
    quelleUrl: 'https://www.str.com/',
  },

  // Logistik
  {
    id: 'stillstand',
    gruppe: 'B-spez',
    titel: 'Stillstand durch Bodenschäden',
    basisProzent: 0.035,
    multGroup: 'operativ',
    branchen: ['logistik'],
    begruendung: 'Beschädigte Industrieböden (durch falsche Reinigungschemie, Beschichtungsfehler) führen zu Staplerstillstand und Umschlagverzögerungen. Inhouse-Bodenbeschichter (wie Jolmes) reagiert sofort.',
    quelle: 'BVL — Bundesvereinigung Logistik',
    quelleUrl: 'https://www.bvl.de/',
  },
  {
    id: 'sicherheit',
    gruppe: 'B-spez',
    titel: 'Sicherheitsrisiken durch Verschmutzung',
    basisProzent: 0.02,
    multGroup: 'operativ',
    branchen: ['logistik'],
    begruendung: 'Rutschunfälle in Lagerhallen sind häufigste Unfallursache (DGUV Statistik). Versicherungsregress, Ausfallzeiten, BG-Beitragserhöhung als Folgekosten.',
    quelle: 'DGUV — Statistik Arbeitsunfälle',
    quelleUrl: 'https://www.dguv.de/',
  },

  // Bildung
  {
    id: 'aufsichtspflicht',
    gruppe: 'B-spez',
    titel: 'Aufsichtspflicht-Risiken bei Reinigungspersonal',
    basisProzent: 0.025,
    multGroup: 'compliance',
    branchen: ['bildung'],
    begruendung: 'In Kitas und Schulen muss Personal nach §72a SGB VIII erweitertes Führungszeugnis vorlegen. Schulungspflichten nach IfSG §33/§34. Nicht-zertifizierte Anbieter dokumentieren oft unzureichend.',
    quelle: '§72a SGB VIII, IfSG §33, §34',
    quelleUrl: 'https://www.gesetze-im-internet.de/sgb_8/__72a.html',
  },
  {
    id: 'krankheit_bildung',
    gruppe: 'B-spez',
    titel: 'Krankheitsausfälle bei Hygienemängeln',
    basisProzent: 0.02,
    multGroup: 'qualitaet',
    branchen: ['bildung'],
    begruendung: 'Mangelnde Sanitärhygiene führt zu erhöhten Krankheitsausfällen bei Schülern und Personal. Vertretungskosten, organisatorischer Aufwand, Lernrückstände als Folge.',
    quelle: 'Robert Koch-Institut',
    quelleUrl: 'https://www.rki.de/',
  },

  // Büro
  {
    id: 'krankheitsausfaelle',
    gruppe: 'B-spez',
    titel: 'Krankheitsausfälle Mitarbeiter durch Hygienemängel',
    basisProzent: 0.02,
    multGroup: 'operativ',
    branchen: ['buero'],
    begruendung: 'Hygiene in Sanitärbereichen, Türklinken und Gemeinschaftsflächen reduziert Krankheitsausfälle messbar. BKK-Daten zeigen 1-2 Krankheitstage Differenz bei Bürobeschäftigten je nach Hygienequalität.',
    quelle: 'BKK Gesundheitsreport',
    quelleUrl: 'https://www.bkk-dachverband.de/',
  },
  {
    id: 'repraesentation',
    gruppe: 'B-spez',
    titel: 'Repräsentationsrisiko bei Kundenbesuchen',
    basisProzent: 0.015,
    multGroup: 'strategisch',
    branchen: ['buero'],
    begruendung: 'Glasflächen, Empfangsbereiche und Konferenzräume prägen Kundenwahrnehmung in den ersten Sekunden. Gerade bei beratungsintensiven Geschäften wirkt sich Eindruck auf Abschlussquote aus.',
    quelle: 'GEFMA — Workplace Studie',
    quelleUrl: 'https://www.gefma.de/',
  },

  // Hotellerie weitere
  {
    id: 'umsatzverlust_hotel',
    gruppe: 'B-spez',
    titel: 'Umsatzverlust durch schlechte Bewertungen',
    basisProzent: 0.035,
    multGroup: 'strategisch',
    branchen: ['hotellerie'],
    begruendung: 'Studien (Cornell School of Hotel Administration) belegen: 1 Punkt höhere Bewertung erlaubt 11% höhere Preise bei gleicher Auslastung.',
    quelle: 'Cornell University SHA',
    quelleUrl: 'https://sha.cornell.edu/',
  },

  // Retail Filialschließung
  {
    id: 'filialschliessung',
    gruppe: 'B-spez',
    titel: 'Filialschließung bei Schadensfall',
    basisProzent: 0.03,
    multGroup: 'operativ',
    branchen: ['retail'],
    begruendung: 'Bei Wasser-/Brandschaden: Filialschließung bis Sanierung. Tagesumsatzverlust 2.000-15.000 €. Inhouse-Sanierung verkürzt Schließzeit drastisch.',
    quelle: 'EHI Retail Institute',
    quelleUrl: 'https://www.ehi.org/',
  },

  // Healthcare IfSG
  {
    id: 'ifsg',
    gruppe: 'B-spez',
    titel: 'Fehlende Schulung nach §23 IfSG',
    basisProzent: 0.02,
    multGroup: 'compliance',
    branchen: ['healthcare'],
    begruendung: 'IfSG §23 fordert Hygieneschulung und Belehrung des gesamten Personals in medizinischen Einrichtungen — auch Reinigungspersonal. Unbelehrtes Fremdpersonal ist Verstoß und Haftungsrisiko für Einrichtungsleitung.',
    quelle: 'IfSG §23, RKI Empfehlungen',
    quelleUrl: 'https://www.gesetze-im-internet.de/ifsg/__23.html',
  },

  // Lebensmittel HACCP
  {
    id: 'haccp',
    gruppe: 'B-spez',
    titel: 'HACCP-Verstoß durch Reinigungsfehler',
    basisProzent: 0.025,
    multGroup: 'compliance',
    branchen: ['lebensmittel'],
    begruendung: 'HACCP-Konzept verlangt validierte Reinigungs- und Desinfektionspläne. Abweichungen können zu CCP-Verlust und Produktionsstopp führen. EU 852/2004 + LMHV verpflichtend.',
    quelle: 'EU-VO 852/2004, LMHV §4',
    quelleUrl: 'https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=celex%3A32004R0852',
  },

  // Industrie Maschinenstillstand
  {
    id: 'maschinenstillstand',
    gruppe: 'B-spez',
    titel: 'Maschinenstillstand durch verzögerte Sanierung',
    basisProzent: 0.03,
    multGroup: 'operativ',
    branchen: ['industrie'],
    begruendung: 'Wasserschäden an Steuerungstechnik, Elektrik oder hydraulischen Systemen erfordern schnelle Reaktion. Externe Koordination zwischen Reinigung, Trocknung, Maler verlängert Stillstand um Tage.',
    quelle: 'VDMA Maintenance Studie',
    quelleUrl: 'https://www.vdma.org/',
  },
];

const GRUPPEN_LABELS = {
  A: 'Qualität & Zertifizierung',
  B: 'Kommunikation & Koordination',
  C: 'Operative Risiken',
  D: 'Compliance & Haftung',
  E: 'Strategische Kosten',
  'B-spez': 'Branchenspezifisch',
};

const GRUPPEN_COLORS = {
  A: '#0E7490',
  B: '#0F766E',
  C: '#B45309',
  D: '#1D4ED8',
  E: '#334155',
  'B-spez': '#9F1239',
};

// Visuelle Tokens — kühles Industriebüro statt Creme/Terrakotta
const T = {
  bg: '#E8EDF2',
  card: '#FFFFFF',
  ink: '#0A1628',
  muted: '#5A6B7D',
  line: '#C9D3DE',
  soft: '#F3F6F9',
  accent: '#0E7490',
  accentSoft: '#E0F2FE',
  cost: '#C2410C',
  costSoft: '#FFF1E8',
  good: '#0F766E',
  goodSoft: '#E6F5F1',
  dark: '#0A1628',
  dark2: '#152238',
};

// Aktuelles Jolmes-Leistungsportfolio (Quelle: jolmes.de — jeder Eintrag entspricht
// einer aktuell erreichbaren Leistungsseite). `branchen: null` = für alle Branchen
// relevant; ein Array engt auf bestimmte Branchen ein.
const SERVICES = [
  // Reinigung
  { id: 'unterhaltsreinigung', label: 'Unterhaltsreinigung', kategorie: 'Reinigung', branchen: null },
  { id: 'glasreinigung', label: 'Glasreinigung', kategorie: 'Reinigung', branchen: null },
  { id: 'fassadenreinigung', label: 'Fassadenreinigung', kategorie: 'Reinigung', branchen: null },
  { id: 'industriereinigung', label: 'Industriereinigung', kategorie: 'Reinigung', branchen: ['industrie', 'logistik', 'lebensmittel'] },
  { id: 'bauschlussreinigung', label: 'Bauschluss-/Sonderreinigung', kategorie: 'Reinigung', branchen: null },
  { id: 'desinfektion', label: 'Desinfektionsreinigung', kategorie: 'Reinigung', branchen: ['healthcare', 'lebensmittel', 'hotellerie', 'bildung'] },
  { id: 'polster', label: 'Polsterreinigung', kategorie: 'Reinigung', branchen: ['buero', 'hotellerie', 'healthcare', 'oeffentlich', 'banken'] },
  { id: 'geruch', label: 'Geruchsneutralisation', kategorie: 'Reinigung', branchen: ['hotellerie', 'healthcare', 'lebensmittel'] },
  { id: 'messie', label: 'Messiewohnungen / Entrümpelung', kategorie: 'Reinigung', branchen: ['oeffentlich', 'healthcare'] },
  { id: 'gartenpflege', label: 'Gartenpflege & Außenanlagen', kategorie: 'Reinigung', branchen: null },
  { id: 'winterdienst', label: 'Winterdienst', kategorie: 'Reinigung', branchen: null },
  // Sanierung
  { id: 'brandschaden', label: 'Brandschadensanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'wasserschaden', label: 'Wasserschadensanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'schimmel', label: 'Schimmelpilzsanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'bestand', label: 'Sanierung im Bestand', kategorie: 'Sanierung', branchen: null },
  { id: 'fassadensanierung', label: 'Fassadensanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'mauerwerk', label: 'Mauerwerksabdichtung', kategorie: 'Sanierung', branchen: null },
  { id: 'keller', label: 'Kellerwerksabdichtung', kategorie: 'Sanierung', branchen: null },
  { id: 'risse', label: 'Risssanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'bodensanierung', label: 'Bodensanierung', kategorie: 'Sanierung', branchen: null },
  { id: 'bautrocknung', label: 'Bautrocknung', kategorie: 'Sanierung', branchen: null },
  // Handwerk
  { id: 'maler', label: 'Malerarbeiten', kategorie: 'Handwerk', branchen: null },
  { id: 'trockenbau', label: 'Trockenbau', kategorie: 'Handwerk', branchen: null },
  { id: 'bodenbelag', label: 'Bodenbelagsarbeiten', kategorie: 'Handwerk', branchen: null },
  { id: 'industriehallenbeschichtung', label: 'Industriehallenbeschichtung', kategorie: 'Handwerk', branchen: ['industrie', 'logistik'] },
  // Personal
  { id: 'arbeitnehmerueberlassung', label: 'Arbeitnehmerüberlassung / Zeitarbeit', kategorie: 'Personal', branchen: ['industrie', 'logistik', 'healthcare', 'hotellerie', 'lebensmittel'] },
  { id: 'direktvermittlung', label: 'Direktvermittlung & Headhunting', kategorie: 'Personal', branchen: null },
  // Energie
  { id: 'photovoltaik', label: 'Photovoltaik (Beratung & Anlage)', kategorie: 'Energie', branchen: null },
  { id: 'batteriespeicher', label: 'Batteriespeicher', kategorie: 'Energie', branchen: null },
];

// Zertifikate. Jeder Eintrag enthält den Geltungsbereich (Firmen-IDs) und ein
// optionales downloadUrl — entweder direkt auf eine PDF (z. B. unter
// public/zertifikate/) oder auf eine Übersichtsseite. Der Renderer unterscheidet
// anhand des .pdf-Suffixes zwischen "↓ PDF" und "↗ ansehen".
const FIRMEN = [
  { id: 'gebaeudereinigung', label: 'Jolmes Gebäudereinigung' },
  { id: 'handwerk',          label: 'Jolmes Handwerk' },
  { id: 'energie',           label: 'Jolmes Energie- & Personalservice' },
];

const JOLMES_CERT_PAGE = 'https://jolmes.de/zertifikate/';
// `firmen` = offiziell zertifiziert / Mitgliedschaft / Befähigungsschein.
// `nachKonformitaet` = arbeitet nach der Norm, ist dort aber nicht zertifiziert.
// Beispiel: Jolmes Handwerk arbeitet nach ISO 9001/14001, hat aber kein
// eigenes Zertifikat — kommunizieren wir transparent und ohne falsche Behauptung.
const ZERTIFIKATE = [
  { id: 'iso9001',    label: 'DIN EN ISO 9001 (Qualität)',                 firmen: ['gebaeudereinigung'], nachKonformitaet: ['handwerk'], downloadUrl: JOLMES_CERT_PAGE },
  { id: 'iso14001',   label: 'DIN EN ISO 14001 (Umwelt)',                  firmen: ['gebaeudereinigung'], nachKonformitaet: ['handwerk'], downloadUrl: JOLMES_CERT_PAGE },
  { id: 'amsbgbau',   label: 'AMS BG Bau (Arbeitsschutz)',                 firmen: ['gebaeudereinigung'],                                 downloadUrl: JOLMES_CERT_PAGE },
  { id: 'dguv201028', label: 'DGUV 201-028 (Schimmelsanierung)',           firmen: ['handwerk'],                                          downloadUrl: JOLMES_CERT_PAGE },
  { id: 'innung',     label: 'Innungsmitglied (Gebäudereiniger-Innung)',   firmen: ['gebaeudereinigung'],                                 downloadUrl: JOLMES_CERT_PAGE },
  { id: 'meister',    label: 'Meisterbetrieb',                             firmen: ['gebaeudereinigung', 'handwerk'],                     downloadUrl: JOLMES_CERT_PAGE },
  { id: 'asbest',     label: 'TRGS 519 / Asbest-Sachkunde',                firmen: ['handwerk'],                                          downloadUrl: JOLMES_CERT_PAGE },
];

const SERVICE_KATEGORIEN = ['Reinigung', 'Sanierung', 'Handwerk', 'Personal', 'Energie'];

// Welche Service-Kategorien deckt eine Jolmes-Firma ab? Damit lässt sich aus
// der Kundenrelevanz einer Leistung automatisch ableiten, welche Zertifikate
// im Vergleich überhaupt zählen — der Vertrieb hakt nichts doppelt an.
const FIRMA_TO_KATEGORIEN = {
  gebaeudereinigung: ['Reinigung'],
  handwerk: ['Sanierung', 'Handwerk'],
  energie: ['Personal', 'Energie'],
};

const isInBranche = (s, branche) => s.branchen === null || s.branchen.includes(branche);

// Vorbelegung "kundenrelevant": alle Leistungen, die für die gewählte Branche
// typisch sind — unabhängig vom Angebots-Gewerk. Das eigentliche Preisangebot
// betrifft ggf. nur Reinigung, der Kunde braucht aber oft auch Handwerk o.ä.
// Genau diese Cross-Sell-Leistungen sind das Bündel-Argument bei höherem Preis.
function defaultKundenrelevantFor(branche) {
  const result = {};
  SERVICES.forEach(s => {
    if (isInBranche(s, branche)) result[s.id] = true;
  });
  return result;
}

const formatEUR = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

export default function App() {
  const [branche, setBranche] = useState('industrie');
  const [volumen, setVolumen] = useState(BRANCHEN['industrie'].defaultVolumen);
  const [jolmesAngebot, setJolmesAngebot] = useState(Math.round(BRANCHEN['industrie'].defaultVolumen * 1.08));
  const [eingabeModus, setEingabeModus] = useState('gesamt'); // 'gesamt' oder 'objekt'
  const [objekte, setObjekte] = useState(1);
  const [dienstleister, setDienstleister] = useState(3);
  const [stundensatz, setStundensatz] = useState(BRANCHEN['industrie'].defaultStundensatz);
  const [kundenname, setKundenname] = useState('');
  const [aktiveCategories, setAktiveCategories] = useState({});
  const [zeigAnnahmen, setZeigAnnahmen] = useState(false);
  const [expandedCat, setExpandedCat] = useState(null);
  const [forceOpenAll, setForceOpenAll] = useState(false);
  // Was kann der Wettbewerb? Default: nur Basis-Reinigung, kein Zertifikat.
  const [wettbewerbServices, setWettbewerbServices] = useState({ unterhaltsreinigung: true, glasreinigung: true });
  const [wettbewerbZertifikate, setWettbewerbZertifikate] = useState({});
  // Welche Jolmes-Gewerke betrifft das konkrete Preisangebot (z.B. nur Reinigung)?
  // Markiert Leistungen als "im Angebot" — beeinflusst aber NICHT, welche
  // anderen Leistungen kundenrelevant sein können (Cross-Sell-Argument).
  const [aktiveGewerke, setAktiveGewerke] = useState(() => new Set(SERVICE_KATEGORIEN));
  // Welche Leistungen braucht der Kunde tatsächlich — über das aktuelle Angebot
  // hinaus? Diese Menge ist Nenner für die Wettbewerbs-Abdeckung und damit für
  // die Mehrkosten-Dämpfung.
  const [kundenrelevant, setKundenrelevant] = useState(() =>
    defaultKundenrelevantFor('industrie')
  );
  // Hybrid-Filter: standardmäßig nur branchenrelevante Leistungen einblenden;
  // Sales kann per Toggle alle 29 Leistungen sichtbar machen.
  const [showAllServices, setShowAllServices] = useState(false);
  // Akkordeon: Leistungskategorien und Zertifikate standardmäßig zugeklappt
  const [openServiceKats, setOpenServiceKats] = useState(() => new Set());
  const [certsOpen, setCertsOpen] = useState(false);
  const [showAllGaps, setShowAllGaps] = useState(false);

  const scrollToErgebnis = () => {
    document.getElementById('ergebnis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const toggleServiceKat = (kat) => {
    setOpenServiceKats(prev => {
      const next = new Set(prev);
      if (next.has(kat)) next.delete(kat); else next.add(kat);
      return next;
    });
  };

  // Live-Zertifikatsdaten aus /zertifikate/index.json (vom täglichen Sync-Workflow
  // geschrieben). Fallback auf die hardcoded ZERTIFIKATE-Konstante, falls die
  // Datei beim Bundle-Build noch nicht existiert oder fetch fehlschlägt.
  const [liveCerts, setLiveCerts] = useState(null);
  const [certsSyncedAt, setCertsSyncedAt] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}zertifikate/index.json`;
    fetch(url, { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data || !Array.isArray(data.entries) || data.entries.length === 0) return;
        setLiveCerts(data.entries);
        setCertsSyncedAt(data.syncedAt || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const aktiveZertifikate = liveCerts || ZERTIFIKATE;
  const resolveCertUrl = (u) => {
    if (!u) return null;
    if (/^https?:\/\//i.test(u)) return u;
    return `${import.meta.env.BASE_URL}${u.replace(/^\/+/, '')}`;
  };
  const today = new Date().toISOString().slice(0, 10);
  const certStatus = (gueltigBis) => {
    if (!gueltigBis) return null;
    const days = Math.floor((new Date(gueltigBis) - new Date(today)) / 86400000);
    if (days < 0)   return { color: '#9F1239', bg: '#FFF1F2', label: `abgelaufen (${gueltigBis})` };
    if (days < 30)  return { color: '#9F1239', bg: '#FFF1F2', label: `läuft in ${days} T ab (${gueltigBis})` };
    if (days < 90)  return { color: '#B45309', bg: '#FFFBEB', label: `läuft in ${days} T ab (${gueltigBis})` };
    return { color: T.good, bg: T.goodSoft, label: `gültig bis ${gueltigBis}` };
  };

  useEffect(() => {
    const onBefore = () => setForceOpenAll(true);
    const onAfter = () => setForceOpenAll(false);
    window.addEventListener('beforeprint', onBefore);
    window.addEventListener('afterprint', onAfter);
    return () => {
      window.removeEventListener('beforeprint', onBefore);
      window.removeEventListener('afterprint', onAfter);
    };
  }, []);

  const handlePrint = () => {
    setForceOpenAll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      window.print();
      setTimeout(() => setForceOpenAll(false), 300);
    }));
  };

  const toggleService = (id) => setWettbewerbServices(s => ({ ...s, [id]: !s[id] }));
  const toggleZert = (id) => setWettbewerbZertifikate(z => ({ ...z, [id]: !z[id] }));
  const toggleKundenrelevant = (id) => setKundenrelevant(k => ({ ...k, [id]: !k[id] }));
  const toggleGewerk = (kat) => {
    setAktiveGewerke(prev => {
      const next = new Set(prev);
      if (next.has(kat)) next.delete(kat); else next.add(kat);
      return next;
    });
  };

  // Effektive Jahressummen je nach Modus
  const volumenWettbewerb = eingabeModus === 'objekt' ? volumen * objekte : volumen;
  const volumenJolmes = eingabeModus === 'objekt' ? jolmesAngebot * objekte : jolmesAngebot;
  const preisDifferenz = volumenJolmes - volumenWettbewerb; // positiv = Jolmes teurer

  const handleBrancheChange = (newBranche) => {
    setBranche(newBranche);
    const v = BRANCHEN[newBranche].defaultVolumen;
    setVolumen(v);
    setJolmesAngebot(Math.round(v * 1.08));
    setStundensatz(BRANCHEN[newBranche].defaultStundensatz);
    setKundenrelevant(defaultKundenrelevantFor(newBranche));
  };

  const reset = () => {
    setBranche('industrie');
    const v = BRANCHEN['industrie'].defaultVolumen;
    setVolumen(v);
    setJolmesAngebot(Math.round(v * 1.08));
    setEingabeModus('gesamt');
    setObjekte(1);
    setDienstleister(3);
    setStundensatz(BRANCHEN['industrie'].defaultStundensatz);
    setKundenname('');
    setAktiveCategories({});
    setWettbewerbServices({ unterhaltsreinigung: true, glasreinigung: true });
    setWettbewerbZertifikate({});
    setAktiveGewerke(new Set(SERVICE_KATEGORIEN));
    setKundenrelevant(defaultKundenrelevantFor('industrie'));
    setShowAllServices(false);
    setOpenServiceKats(new Set());
    setCertsOpen(false);
    setShowAllGaps(false);
  };

  // Branche-spezifische Service-Auswahl. branchen===null = universell relevant.
  const isServiceRelevant = (s) => isInBranche(s, branche);
  const isImAngebot = (s) => aktiveGewerke.has(s.kategorie);
  // Standard-Ansicht: alle branchenrelevanten Leistungen (gewerkübergreifend) —
  // damit Cross-Sell sichtbar bleibt. "Alle anzeigen" lockert den Branchen-Filter.
  const sichtbareServices = showAllServices
    ? SERVICES
    : SERVICES.filter(isServiceRelevant);
  const kundenrelevanteServices = SERVICES.filter(s => kundenrelevant[s.id]);

  const relevantCats = useMemo(() => {
    return KATEGORIEN.filter(k => !k.branchen || k.branchen.includes(branche));
  }, [branche]);

  const calcKosten = (kat) => {
    const mult = BRANCHEN[branche].multipliers[kat.multGroup] || 1;
    let raw;
    if (kat.isStunden) {
      const monate = kat.isJaehrlich ? 1 : 12;
      raw = kat.basisStunden * stundensatz * monate * (dienstleister - 1) * mult;
    } else {
      raw = volumenWettbewerb * kat.basisProzent * mult * (kat.gruppe === 'B' ? Math.max(1, dienstleister - 1) / 2 : 1);
    }
    return raw * coverageFactor(kat);
  };

  // Wettbewerbs-Abdeckung dämpft die Mehrkosten: wenn der Wettbewerb dieselben
  // Leistungen / Zertifikate wie Jolmes anbietet, fallen die entsprechenden
  // Risiko-/Konsolidierungskosten weg. Ohne diese Dämpfung würde das Tool auch
  // dann hohe Einsparungen ausweisen, wenn der Wettbewerb fachlich gleichwertig ist.
  // Ein Zertifikat zählt im Vergleich nur, wenn mindestens eine Leistung aus
  // dem Geltungsbereich seiner Firma(en) kundenrelevant ist. So entfallen z.B.
  // Asbest/TRGS 519 automatisch, sobald der Kunde keine Handwerks-/Sanierungs-
  // leistungen braucht.
  const istZertRelevant = (z) => {
    const cats = [...(z.firmen || []), ...(z.nachKonformitaet || [])]
      .flatMap(f => FIRMA_TO_KATEGORIEN[f] || []);
    if (cats.length === 0) return true;
    return SERVICES.some(s => kundenrelevant[s.id] && cats.includes(s.kategorie));
  };

  const wettbewerbCoverage = useMemo(() => {
    const relIds = SERVICES.filter(s => kundenrelevant[s.id]).map(s => s.id);
    const totalSrv = relIds.length || 1;
    const checkedSrv = relIds.filter(id => wettbewerbServices[id]).length;
    const relevanteZerts = aktiveZertifikate.filter(istZertRelevant);
    const totalCert = relevanteZerts.length || 1;
    const checkedCert = relevanteZerts.filter(z => wettbewerbZertifikate[z.id]).length;
    const service = checkedSrv / totalSrv;
    const cert = checkedCert / totalCert;
    return {
      service, cert, overall: (service + cert) / 2,
      checkedSrv, totalSrv, checkedCert, totalCert,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wettbewerbServices, wettbewerbZertifikate, kundenrelevant, aktiveZertifikate]);

  // multGroup → welcher Coverage-Anteil dämpft diese Kostengruppe?
  function coverageFactor(kat) {
    const c = wettbewerbCoverage;
    switch (kat.multGroup) {
      case 'kommunikation': return Math.max(0, 1 - c.service);   // Lieferanten-Konsolidierung
      case 'compliance':    return Math.max(0, 1 - c.cert);      // Audit/Haftung wenn keine Zerts
      case 'operativ':      return Math.max(0, 1 - c.service);   // Notfall/Personal-Lücken
      case 'qualitaet':     return Math.max(0, 1 - c.overall);   // Qualitäts-Risiko
      case 'strategisch':   return Math.max(0, 1 - c.overall);   // Wechsel-/Reputationsrisiko
      default:              return Math.max(0, 1 - c.overall);
    }
  }

  const ergebnisse = useMemo(() => {
    return relevantCats.map(kat => ({
      ...kat,
      kosten: calcKosten(kat),
      aktiv: aktiveCategories[kat.id] !== false,
    }));
  }, [relevantCats, volumenWettbewerb, objekte, dienstleister, stundensatz, branche, aktiveCategories, wettbewerbCoverage]);

  const aktiveErgebnisse = ergebnisse.filter(e => e.aktiv);
  const gesamtMehrkosten = aktiveErgebnisse.reduce((sum, e) => sum + e.kosten, 0);

  const top10 = [...aktiveErgebnisse].sort((a, b) => b.kosten - a.kosten).slice(0, 10).map(e => ({
    name: e.titel.length > 50 ? e.titel.substring(0, 50) + '…' : e.titel,
    kosten: Math.round(e.kosten),
    fill: GRUPPEN_COLORS[e.gruppe],
  }));

  const gruppenSummen = Object.keys(GRUPPEN_LABELS).map(g => {
    const summe = aktiveErgebnisse.filter(e => e.gruppe === g).reduce((s, e) => s + e.kosten, 0);
    return { name: GRUPPEN_LABELS[g], value: Math.round(summe), fill: GRUPPEN_COLORS[g] };
  }).filter(g => g.value > 0);

  const zeitreihe = [1, 2, 3, 4, 5].map(jahr => ({
    jahr: `Jahr ${jahr}`,
    kumuliert: Math.round(gesamtMehrkosten * jahr),
  }));

  // Netto-Vorteil: Mehrkosten beim Wettbewerb minus echte Preisdifferenz
  // preisDifferenz > 0 = Jolmes ist teurer (zieht ab), < 0 = Jolmes günstiger (addiert)
  const nettoVorteil = gesamtMehrkosten - preisDifferenz;
  const preisDifferenzProzent = volumenWettbewerb > 0 ? (preisDifferenz / volumenWettbewerb) * 100 : 0;

  const GAP_LIMIT = 5;
  const lueckenServices = kundenrelevanteServices.filter(s => !wettbewerbServices[s.id]);
  const luckenImAngebot = lueckenServices.filter(isImAngebot);
  const luckenCrossSell = lueckenServices.filter(s => !isImAngebot(s));
  const fehlendeZert = aktiveZertifikate.filter(z => istZertRelevant(z) && !wettbewerbZertifikate[z.id]);

  return (
    <div style={{ fontFamily: '"Sora", "Segoe UI", sans-serif', backgroundColor: T.bg, minHeight: '100vh', color: T.ink, padding: 'clamp(12px, 3vw, 24px)', paddingBottom: '96px' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,500;6..72,700;6..72,800&family=Sora:wght@400;500;600;700&display=swap');
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .print-keep { break-inside: avoid; }
          details > *:not(summary) { display: block !important; }
          details summary { cursor: default !important; }
          .accordion-body,
          .accordion-body.is-collapsed { display: block !important; }
        }
        .accordion-body.is-collapsed { display: none; }
        @media (max-width: 640px) {
          details summary { gap: 8px !important; }
          details summary > div:first-child { gap: 8px !important; }
        }
        .display { font-family: 'Newsreader', Georgia, serif; }
        .card-hover:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(10,22,40,0.08); }
        .card-hover { transition: all 0.2s ease; }
        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        input[type="range"] { accent-color: ${T.accent}; }
        .gradient-text {
          background: linear-gradient(135deg, ${T.cost} 0%, #9A3412 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .sticky-jump {
          position: sticky; top: 0; z-index: 40;
          background: rgba(232,237,242,0.92);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid ${T.line};
          margin: -12px -12px 20px;
          padding: 10px clamp(12px, 3vw, 24px);
        }
        @media (min-width: 768px) {
          .sticky-jump { margin-left: calc(50% - 50vw); margin-right: calc(50% - 50vw); padding-left: max(24px, calc(50vw - 640px)); padding-right: max(24px, calc(50vw - 640px)); }
        }
      `}</style>

      {/* Sticky Navigation */}
      <div className="sticky-jump no-print">
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: T.ink }}>
            Jolmes TCO{kundenname ? ` · ${kundenname}` : ''}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" onClick={scrollToErgebnis} style={btnPrimary}>↓ Zum Ergebnis</button>
            <button type="button" onClick={handlePrint} style={btnSecondary}>Als PDF drucken</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: `2px solid ${T.ink}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.05 }}>
                Jolmes
              </div>
              <div style={{ display: 'inline-block', padding: '3px 10px', background: T.ink, color: '#E8EDF2', fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
                TCO-Vertriebstool · Paderborn
              </div>
              <h1 className="display" style={{ fontSize: 'clamp(26px, 5vw, 44px)', lineHeight: 1.1, fontWeight: 700, margin: 0, letterSpacing: '-0.02em', maxWidth: '720px' }}>
                Was kostet es, uns <span className="gradient-text" style={{ fontStyle: 'italic' }}>nicht</span> zu beauftragen?
              </h1>
              <p style={{ fontSize: '16px', color: T.muted, marginTop: '12px', maxWidth: '640px', lineHeight: 1.5 }}>
                Versteckte Mehrkosten bei nicht-zertifizierten Einzeldienstleistern — Total Cost of Ownership statt Stückpreis.
              </p>
            </div>
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button type="button" onClick={reset} style={btnSecondary}>Werte zurücksetzen</button>
              <button type="button" onClick={() => setZeigAnnahmen(!zeigAnnahmen)} style={btnSecondary}>
                {zeigAnnahmen ? 'Annahmen verbergen' : 'Annahmen anzeigen'}
              </button>
            </div>
          </div>
        </header>

        {/* 1. SZENARIO */}
        <section style={cardStyle}>
          <h2 className="display" style={h2Style}>1. Ihr Szenario</h2>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Branche (steuert alle Berechnungen)</label>
            <select
              value={branche}
              onChange={(e) => handleBrancheChange(e.target.value)}
              style={{ ...inputStyle, fontSize: '16px', fontWeight: 600 }}
            >
              {Object.entries(BRANCHEN).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={badge(T.ink, '#E8EDF2')}>{BRANCHEN[branche].label}</span>
              <span style={badge(T.accent, 'white')}>Compliance: {BRANCHEN[branche].compliance}</span>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Worüber machen wir gerade ein Angebot? (Gewerk)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {SERVICE_KATEGORIEN.map(kat => {
                const aktiv = aktiveGewerke.has(kat);
                return (
                  <button
                    key={kat}
                    type="button"
                    onClick={() => toggleGewerk(kat)}
                    style={{
                      padding: '8px 14px',
                      background: aktiv ? T.ink : 'white',
                      color: aktiv ? '#E8EDF2' : T.ink,
                      border: `1px solid ${aktiv ? T.ink : T.line}`,
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {aktiv ? '✓ ' : ''}{kat}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: '8px', fontSize: '12px', color: T.muted }}>
              Markiert Leistungen im aktuellen Preisangebot. Andere kundenrelevante Leistungen bleiben im Vergleich als Bündel-Argument.
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Eingabe der Angebote</label>
            <div style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', border: `1px solid ${T.line}`, width: 'fit-content' }}>
              <button
                type="button"
                onClick={() => setEingabeModus('gesamt')}
                style={{
                  padding: '10px 20px',
                  background: eingabeModus === 'gesamt' ? T.ink : 'white',
                  color: eingabeModus === 'gesamt' ? '#E8EDF2' : T.ink,
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Gesamtsumme / Jahr
              </button>
              <button
                type="button"
                onClick={() => setEingabeModus('objekt')}
                style={{
                  padding: '10px 20px',
                  background: eingabeModus === 'objekt' ? T.ink : 'white',
                  color: eingabeModus === 'objekt' ? '#E8EDF2' : T.ink,
                  border: 'none',
                  borderLeft: `1px solid ${T.line}`,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Pro Objekt × Anzahl
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px', padding: '20px', background: T.soft, border: `1px solid ${T.line}`, borderRadius: '8px' }}>
            <div>
              <label style={{ ...labelStyle, color: T.cost }}>
                Angebot Wettbewerb {eingabeModus === 'objekt' ? '(€/Jahr/Objekt)' : '(€/Jahr)'}
              </label>
              <input
                type="number"
                value={volumen}
                onChange={(e) => setVolumen(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: T.cost, borderWidth: '2px' }}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, color: T.good }}>
                Ihr Angebot Jolmes {eingabeModus === 'objekt' ? '(€/Jahr/Objekt)' : '(€/Jahr)'}
              </label>
              <input
                type="number"
                value={jolmesAngebot}
                onChange={(e) => setJolmesAngebot(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: T.good, borderWidth: '2px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px', padding: '14px 18px', background: preisDifferenz > 0 ? T.costSoft : T.goodSoft, borderRadius: '6px', border: `1px solid ${preisDifferenz > 0 ? '#FDBA74' : '#99D5C5'}` }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '2px' }}>Wettbewerb gesamt/Jahr</div>
              <div className="display" style={{ fontSize: '20px', fontWeight: 700 }}>{formatEUR(volumenWettbewerb)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '2px' }}>Jolmes gesamt/Jahr</div>
              <div className="display" style={{ fontSize: '20px', fontWeight: 700 }}>{formatEUR(volumenJolmes)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '2px' }}>
                {preisDifferenz > 0 ? 'Mehrpreis Jolmes' : preisDifferenz < 0 ? 'Ersparnis Jolmes' : 'Gleicher Preis'}
              </div>
              <div className="display" style={{ fontSize: '20px', fontWeight: 700, color: preisDifferenz > 0 ? T.cost : T.good }}>
                {preisDifferenz > 0 ? '+' : ''}{formatEUR(preisDifferenz)}
                <span style={{ fontSize: '12px', color: T.muted, marginLeft: '6px', fontWeight: 400 }}>
                  ({preisDifferenz > 0 ? '+' : ''}{preisDifferenzProzent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Anzahl Objekte</label>
              <input type="number" min="1" value={objekte} onChange={(e) => setObjekte(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Unterschiedl. Dienstleistungsarten</label>
              <input type="number" min="1" max="10" value={dienstleister} onChange={(e) => setDienstleister(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Interner Stundensatz (€)</label>
              <input type="number" value={stundensatz} onChange={(e) => setStundensatz(Number(e.target.value))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Kundenname (optional)</label>
              <input type="text" value={kundenname} onChange={(e) => setKundenname(e.target.value)} placeholder="z.B. Muster GmbH" style={inputStyle} />
            </div>
          </div>
        </section>

        {/* 2. ERGEBNIS — früh sichtbar */}
        <section id="ergebnis" style={{ ...cardStyle, background: `linear-gradient(145deg, ${T.dark} 0%, ${T.dark2} 100%)`, color: '#E8EDF2', position: 'relative', overflow: 'hidden', scrollMarginTop: '64px' }} className="print-keep">
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '260px', height: '260px', background: 'radial-gradient(circle, rgba(14,116,144,0.25) 0%, transparent 70%)' }} />

          <h2 className="display" style={{ ...h2Style, color: '#E8EDF2', borderColor: 'rgba(232,237,242,0.18)' }}>
            2. Ihre versteckten Mehrkosten
          </h2>

          {kundenname && <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '8px' }}>Kalkulation für: <strong>{kundenname}</strong></p>}

          {(() => {
            const c = wettbewerbCoverage;
            const srvPct = Math.round(c.service * 100);
            const certPct = Math.round(c.cert * 100);
            const allCovered = c.service >= 1 && c.cert >= 1;
            const noneCovered = c.service === 0 && c.cert === 0;
            const bg = allCovered ? 'rgba(15,118,110,0.2)' : noneCovered ? 'rgba(194,65,12,0.2)' : 'rgba(232,237,242,0.08)';
            const border = allCovered ? T.good : T.cost;
            return (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: bg, borderLeft: `3px solid ${border}`, borderRadius: '4px', fontSize: '13px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                <span style={{ opacity: 0.9 }}>
                  Wettbewerb deckt ab: <strong>{c.checkedSrv}/{c.totalSrv}</strong> Leistungen ({srvPct}%) · <strong>{c.checkedCert}/{c.totalCert}</strong> Zertifikate ({certPct}%)
                </span>
                <span style={{ opacity: 0.7, fontSize: '12px' }}>
                  {allCovered
                    ? '→ kein Versorgungsrisiko, Mehrkosten = 0.'
                    : noneCovered
                    ? '→ volles Risikoprofil.'
                    : '→ Mehrkosten je Risikogruppe entsprechend gedämpft.'}
                </span>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>Mehrkosten / Jahr</div>
              <div className="display" style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 800, color: '#FB923C', lineHeight: 1, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten)}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
                = {volumenWettbewerb > 0 ? ((gesamtMehrkosten / volumenWettbewerb) * 100).toFixed(1) : '0'}% des Wettbewerbs-Volumens
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>3-Jahres-Hochrechnung</div>
              <div className="display" style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 600, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten * 3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>5-Jahres-Hochrechnung</div>
              <div className="display" style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 600, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten * 5)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '28px', padding: '20px', background: 'rgba(232,237,242,0.08)', borderRadius: '8px', borderLeft: `3px solid ${nettoVorteil > 0 ? T.good : T.cost}` }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7, marginBottom: '12px' }}>
              Vergleichsrechnung Total Cost of Ownership
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  {preisDifferenz > 0
                    ? `Mehrpreis Jolmes (+${preisDifferenzProzent.toFixed(1)}%)`
                    : preisDifferenz < 0
                    ? `Ersparnis Jolmes (${preisDifferenzProzent.toFixed(1)}%)`
                    : 'Preisgleich mit Wettbewerb'}
                </div>
                <div className="display" style={{ fontSize: '24px', fontWeight: 600 }}>
                  {preisDifferenz > 0 ? '+' : ''}{formatEUR(preisDifferenz)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>Versteckte Mehrkosten Wettbewerb</div>
                <div className="display" style={{ fontSize: '24px', fontWeight: 600, color: '#FB923C' }}>
                  {formatEUR(gesamtMehrkosten)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  {nettoVorteil > 0 ? 'Effektiver Vorteil Jolmes' : 'Effektiver Nachteil Jolmes'}
                </div>
                <div className="display" style={{ fontSize: '28px', fontWeight: 700, color: nettoVorteil > 0 ? '#5EEAD4' : '#FB923C' }}>
                  {nettoVorteil > 0 ? '+' : ''}{formatEUR(nettoVorteil)} / Jahr
                </div>
              </div>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(232,237,242,0.15)', fontSize: '12px', opacity: 0.75, fontFamily: 'monospace' }}>
              Rechnung: {formatEUR(gesamtMehrkosten)} {preisDifferenz >= 0 ? '−' : '+'} {formatEUR(Math.abs(preisDifferenz))} = {formatEUR(nettoVorteil)}
            </div>
          </div>

          <div className="no-print" style={{ marginTop: '20px', fontSize: '13px', opacity: 0.75 }}>
            Feinabstimmung zu Leistungen & Zertifikaten folgt unten — ändert die Zahlen live.
          </div>
        </section>

        {/* 3. LEISTUNGEN — einklappbar */}
        <section style={cardStyle} className="print-keep">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
            <h2 className="display" style={{ ...h2Style, marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>3. Leistungsspektrum & Zertifikate</h2>
            <button
              type="button"
              className="no-print"
              onClick={() => setShowAllServices(v => !v)}
              style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}
            >
              {showAllServices ? '← Nur branchenrelevante' : 'Alle Leistungen'}
            </button>
          </div>
          <p style={{ fontSize: '14px', color: T.muted, marginBottom: '16px' }}>
            Kategorien aufklappen zum Anpassen. <strong>Kunde braucht</strong> / <strong>Wettbewerb kann</strong>. Das Badge „Angebot“ erscheint nur bei Lücken: im aktuellen Angebot, vom Kunden gebraucht, Wettbewerb kann es nicht.
          </p>

          {/* Kompakt-Zusammenfassung */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '18px', padding: '14px 16px', background: T.soft, borderRadius: '8px', border: `1px solid ${T.line}` }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Kundenrelevant</div>
              <div className="display" style={{ fontSize: '22px', fontWeight: 700 }}>{wettbewerbCoverage.totalSrv}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Vom Wettbewerb</div>
              <div className="display" style={{ fontSize: '22px', fontWeight: 700 }}>{wettbewerbCoverage.checkedSrv}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Zertifikate fehlt</div>
              <div className="display" style={{ fontSize: '22px', fontWeight: 700, color: T.cost }}>{fehlendeZert.length}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted }}>Lücken Leistungen</div>
              <div className="display" style={{ fontSize: '22px', fontWeight: 700, color: T.cost }}>{lueckenServices.length}</div>
            </div>
          </div>

          {SERVICE_KATEGORIEN.map(kat => {
            const items = sichtbareServices.filter(s => s.kategorie === kat);
            if (items.length === 0) return null;
            const kundenZahl = items.filter(s => kundenrelevant[s.id]).length;
            const abgedeckt = items.filter(s => kundenrelevant[s.id] && wettbewerbServices[s.id]).length;
            const offen = openServiceKats.has(kat);
            return (
              <div key={kat} style={{ marginBottom: '10px', border: `1px solid ${T.line}`, borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
                <button
                  type="button"
                  onClick={() => toggleServiceKat(kat)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                    padding: '14px 16px',
                    background: offen ? T.soft : 'white',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="no-print" style={{ fontSize: '14px', color: T.muted, width: '16px' }}>{offen ? '▾' : '▸'}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kat}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: T.muted }}>
                    {kundenZahl} kundenrelevant · {abgedeckt} abgedeckt · {kundenZahl - abgedeckt} Lücke{kundenZahl - abgedeckt === 1 ? '' : 'n'}
                  </span>
                </button>
                <div className={`accordion-body${offen ? '' : ' is-collapsed'}`} style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.line}` }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', paddingTop: '14px' }}>
                      {items.map(s => {
                        const kunde = !!kundenrelevant[s.id];
                        const wettb = !!wettbewerbServices[s.id];
                        const branchenfremd = !isServiceRelevant(s);
                        const imAngebot = isImAngebot(s);
                        const showAngebotBadge = imAngebot && kunde && !wettb;
                        return (
                          <div
                            key={s.id}
                            style={{
                              padding: '12px 14px',
                              border: `1px solid ${kunde ? T.line : '#E2E8F0'}`,
                              borderLeft: `3px solid ${showAngebotBadge ? T.accent : kunde ? T.ink : 'transparent'}`,
                              borderRadius: '6px',
                              background: kunde ? 'white' : T.soft,
                              fontSize: '14px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', minHeight: '20px' }}>
                              <span style={{ flex: 1, fontWeight: kunde ? 500 : 400, color: kunde ? T.ink : T.muted, lineHeight: 1.3, wordBreak: 'break-word' }}>
                                {s.label}
                              </span>
                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0, alignItems: 'center' }}>
                                {showAngebotBadge && (
                                  <span title="Im aktuellen Angebot und kundenrelevant" style={{ fontSize: '9px', padding: '2px 6px', background: T.accent, color: 'white', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                    Angebot
                                  </span>
                                )}
                                {branchenfremd && (
                                  <span title="für die gewählte Branche untypisch" style={{ fontSize: '9px', padding: '2px 6px', background: '#E2E8F0', color: T.muted, borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    extra
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', paddingTop: '8px', borderTop: `1px solid ${T.line}` }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: kunde ? T.ink : T.muted, fontWeight: kunde ? 600 : 500, flex: 1 }}>
                                <input type="checkbox" checked={kunde} onChange={() => toggleKundenrelevant(s.id)} style={{ width: '15px', height: '15px', cursor: 'pointer', margin: 0, accentColor: T.ink }} />
                                Kunde braucht
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: wettb ? T.good : T.muted, fontWeight: wettb ? 600 : 500, flex: 1 }}>
                                <input type="checkbox" checked={wettb} onChange={() => toggleService(s.id)} style={{ width: '15px', height: '15px', cursor: 'pointer', margin: 0, accentColor: T.good }} />
                                Wettbewerb kann
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
              </div>
            );
          })}

          {/* Zertifikate Akkordeon */}
          <div style={{ marginTop: '16px', border: `1px solid ${T.line}`, borderRadius: '8px', overflow: 'hidden', background: 'white' }}>
            <button
              type="button"
              onClick={() => setCertsOpen(v => !v)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
                padding: '14px 16px',
                background: certsOpen ? T.soft : 'white',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="no-print" style={{ fontSize: '14px', color: T.muted, width: '16px' }}>{certsOpen ? '▾' : '▸'}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: T.ink, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Zertifikate</span>
                {certsSyncedAt && (
                  <span style={{ fontSize: '11px', color: T.muted }}>Sync: {new Date(certsSyncedAt).toLocaleDateString('de-DE')}</span>
                )}
              </div>
              <span style={{ fontSize: '12px', color: T.muted }}>
                {wettbewerbCoverage.checkedCert}/{wettbewerbCoverage.totalCert} beim Wettbewerb · {fehlendeZert.length} fehlend
              </span>
            </button>
            <div className={`accordion-body${certsOpen ? '' : ' is-collapsed'}`} style={{ padding: '0 16px 16px', borderTop: `1px solid ${T.line}` }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '10px', paddingTop: '14px' }}>
                  {aktiveZertifikate.map(z => {
                    const checked = !!wettbewerbZertifikate[z.id];
                    const relevant = istZertRelevant(z);
                    const url = resolveCertUrl(z.downloadUrl);
                    const isPdf = url && /\.pdf(\?|#|$)/i.test(url);
                    const linkLabel = isPdf ? '↓ PDF' : '↗ Ansehen';
                    const status = certStatus(z.gueltigBis);
                    return (
                      <div
                        key={z.id}
                        style={{
                          padding: '12px 14px',
                          border: `1px solid ${T.line}`,
                          borderLeft: `3px solid ${relevant && checked ? T.good : 'transparent'}`,
                          borderRadius: '6px',
                          background: relevant ? 'white' : T.soft,
                          fontSize: '14px',
                          opacity: relevant ? 1 : 0.6,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', minHeight: '20px' }}>
                          <span style={{ flex: 1, fontWeight: 500, color: T.ink, lineHeight: 1.3, wordBreak: 'break-word' }}>
                            {z.label}
                          </span>
                          {url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" {...(isPdf ? { download: true } : {})}
                               style={{ fontSize: '11px', color: T.accent, textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 600, padding: '2px 8px', border: `1px solid ${T.accent}`, borderRadius: '3px', background: 'white', flexShrink: 0 }}>
                              {linkLabel}
                            </a>
                          ) : (
                            <span style={{ fontSize: '10px', color: T.muted, whiteSpace: 'nowrap', fontStyle: 'italic', flexShrink: 0 }}>PDF folgt</span>
                          )}
                        </div>
                        {(z.firmen?.length || z.nachKonformitaet?.length || status) && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
                            {(z.firmen || []).map(fid => {
                              const firma = FIRMEN.find(f => f.id === fid);
                              if (!firma) return null;
                              return <span key={fid} title="Offiziell zertifiziert" style={{ fontSize: '9px', padding: '2px 6px', background: T.ink, color: '#E8EDF2', borderRadius: '3px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{firma.label}</span>;
                            })}
                            {(z.nachKonformitaet || []).map(fid => {
                              const firma = FIRMEN.find(f => f.id === fid);
                              if (!firma) return null;
                              return <span key={`k-${fid}`} title="Arbeitet nach der Norm, nicht zertifiziert" style={{ fontSize: '9px', padding: '2px 6px', background: 'white', color: T.muted, border: `1px dashed ${T.line}`, borderRadius: '3px', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>{firma.label} · nach Norm</span>;
                            })}
                            {status && (
                              <span style={{ fontSize: '9px', padding: '2px 6px', background: status.bg, color: status.color, borderRadius: '3px', letterSpacing: '0.04em', fontWeight: 700, textTransform: 'uppercase' }}>
                                {status.label}
                              </span>
                            )}
                          </div>
                        )}
                        <div style={{ paddingTop: '8px', borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: relevant ? 'pointer' : 'not-allowed', fontSize: '12px', color: checked && relevant ? T.good : T.muted, fontWeight: checked && relevant ? 600 : 500 }}>
                            <input type="checkbox" checked={checked} disabled={!relevant} onChange={() => toggleZert(z.id)} style={{ width: '15px', height: '15px', cursor: relevant ? 'pointer' : 'not-allowed', margin: 0, accentColor: T.good }} />
                            Wettbewerb hat dieses Zertifikat
                          </label>
                          {!relevant && (
                            <span style={{ fontSize: '9px', padding: '2px 6px', background: '#E2E8F0', color: T.muted, borderRadius: '3px', letterSpacing: '0.05em', fontWeight: 600, textTransform: 'uppercase' }}>
                              nicht im Scope
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>

          {/* Lücken — Top-N */}
          <div style={{ marginTop: '20px', padding: '16px 18px', background: T.costSoft, border: '1px solid #FDBA74', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '10px', fontWeight: 600 }}>
              Wichtigste Lücken beim Wettbewerb — {BRANCHEN[branche].label}
            </div>
            {(() => {
              if (lueckenServices.length === 0 && fehlendeZert.length === 0) {
                return <div style={{ fontSize: '13px', color: T.ink }}>Wettbewerb deckt alles ab — Differenzierung über TCO und Service-Qualität.</div>;
              }
              const Chip = ({ label, accent }) => (
                <span style={{ display: 'inline-block', padding: '4px 10px', background: 'white', border: `1px solid ${accent}`, borderRadius: '4px', fontSize: '12px', color: T.ink }}>{label}</span>
              );
              const slice = (arr) => showAllGaps ? arr : arr.slice(0, GAP_LIMIT);
              const hasMore = !showAllGaps && (
                luckenImAngebot.length > GAP_LIMIT ||
                luckenCrossSell.length > GAP_LIMIT ||
                fehlendeZert.length > GAP_LIMIT
              );
              return (
                <>
                  {luckenImAngebot.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: T.muted, marginBottom: '6px' }}>
                        Direkt im Angebot fehlend ({luckenImAngebot.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {slice(luckenImAngebot).map(s => <Chip key={s.id} label={s.label} accent={T.accent} />)}
                        {!showAllGaps && luckenImAngebot.length > GAP_LIMIT && (
                          <span style={{ fontSize: '12px', color: T.muted, alignSelf: 'center' }}>+{luckenImAngebot.length - GAP_LIMIT} weitere</span>
                        )}
                      </div>
                    </div>
                  )}
                  {luckenCrossSell.length > 0 && (
                    <div style={{ marginBottom: fehlendeZert.length > 0 || hasMore ? '12px' : 0 }}>
                      <div style={{ fontSize: '12px', color: T.muted, marginBottom: '6px' }}>
                        Cross-Sell / Bündel ({luckenCrossSell.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {slice(luckenCrossSell).map(s => <Chip key={s.id} label={s.label} accent="#FDBA74" />)}
                        {!showAllGaps && luckenCrossSell.length > GAP_LIMIT && (
                          <span style={{ fontSize: '12px', color: T.muted, alignSelf: 'center' }}>+{luckenCrossSell.length - GAP_LIMIT} weitere</span>
                        )}
                      </div>
                    </div>
                  )}
                  {fehlendeZert.length > 0 && (
                    <div style={{ marginBottom: hasMore ? '12px' : 0 }}>
                      <div style={{ fontSize: '12px', color: T.muted, marginBottom: '6px' }}>
                        Fehlende Zertifikate ({fehlendeZert.length}):
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {slice(fehlendeZert).map(z => <Chip key={z.id} label={z.label} accent="#FDBA74" />)}
                        {!showAllGaps && fehlendeZert.length > GAP_LIMIT && (
                          <span style={{ fontSize: '12px', color: T.muted, alignSelf: 'center' }}>+{fehlendeZert.length - GAP_LIMIT} weitere</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(hasMore || showAllGaps) && (luckenImAngebot.length > GAP_LIMIT || luckenCrossSell.length > GAP_LIMIT || fehlendeZert.length > GAP_LIMIT) && (
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => setShowAllGaps(v => !v)}
                      style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px', marginTop: '4px' }}
                    >
                      {showAllGaps ? 'Nur Top-Lücken zeigen' : 'Alle Lücken anzeigen'}
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* 4. DIAGRAMME */}
        <section style={{ ...cardStyle }} className="page-break print-keep">
          <h2 className="display" style={h2Style}>4. Visuelle Aufschlüsselung</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '32px' }}>
            <div>
              <h3 style={h3Style}>Top 10 Kostentreiber</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.line} />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke={T.muted} fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke={T.muted} fontSize={10} width={160} />
                  <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: T.dark, color: '#E8EDF2', border: 'none' }} />
                  <Bar dataKey="kosten" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div>
              <h3 style={h3Style}>Verteilung nach Kategorien</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={gruppenSummen} dataKey="value" nameKey="name" cx="50%" cy="45%" innerRadius={60} outerRadius={120} paddingAngle={2}>
                    {gruppenSummen.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: T.dark, color: '#E8EDF2', border: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={h3Style}>Kumulierte Mehrkosten über 5 Jahre</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={zeitreihe}>
                <CartesianGrid strokeDasharray="2 4" stroke={T.line} />
                <XAxis dataKey="jahr" stroke={T.muted} fontSize={11} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke={T.muted} fontSize={11} />
                <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: T.dark, color: '#E8EDF2', border: 'none' }} />
                <Line type="monotone" dataKey="kumuliert" stroke={T.cost} strokeWidth={3} dot={{ fill: T.cost, r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5. KATEGORIEN */}
        <section style={{ ...cardStyle }} className="page-break">
          <h2 className="display" style={h2Style}>5. Kostenkategorien im Detail</h2>
          <p style={{ fontSize: '14px', color: T.muted, marginBottom: '20px' }}>
            Kategorie aufklappen für Begründung und Quelle. Über den Schalter einzelne Posten aus der Berechnung nehmen.
          </p>

          {Object.keys(GRUPPEN_LABELS).map(grp => {
            const gruppeCats = ergebnisse.filter(e => e.gruppe === grp);
            if (gruppeCats.length === 0) return null;
            const gruppenSumme = gruppeCats.filter(e => e.aktiv).reduce((s, e) => s + e.kosten, 0);

            return (
              <div key={grp} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${GRUPPEN_COLORS[grp]}` }}>
                  <div style={{ width: '12px', height: '12px', background: GRUPPEN_COLORS[grp], borderRadius: '50%' }} />
                  <h3 className="display" style={{ fontSize: '22px', fontWeight: 600, margin: 0, flex: 1 }}>
                    {grp !== 'B-spez' && `${grp}. `}{GRUPPEN_LABELS[grp]}
                  </h3>
                  <div style={{ fontSize: '14px', color: T.muted }}>
                    Summe: <strong style={{ color: T.ink }}>{formatEUR(gruppenSumme)}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gap: '8px' }}>
                  {gruppeCats.map(kat => (
                    <details
                      key={kat.id}
                      open={forceOpenAll || expandedCat === kat.id}
                      onToggle={(e) => {
                        if (forceOpenAll) return;
                        if (e.target.open) setExpandedCat(kat.id);
                      }}
                      style={{
                        background: kat.aktiv ? 'white' : '#E2E8F0',
                        border: `1px solid ${kat.aktiv ? T.line : '#CBD5E1'}`,
                        borderRadius: '6px',
                        padding: '14px 16px',
                        opacity: kat.aktiv ? 1 : 0.55,
                      }}
                      className="card-hover"
                    >
                      <summary style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                          <input
                            type="checkbox"
                            checked={kat.aktiv}
                            onClick={(e) => e.stopPropagation()}
                            onChange={() => setAktiveCategories({ ...aktiveCategories, [kat.id]: !kat.aktiv })}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 500, fontSize: '14px', flex: 1 }}>{kat.titel}</span>
                          {kat.branchen && (
                            <span style={{ ...badge(GRUPPEN_COLORS[grp], 'white'), fontSize: '10px' }}>
                              {BRANCHEN[branche].label.split(' ')[0]}
                            </span>
                          )}
                        </div>
                        <div className="display" style={{ fontSize: '20px', fontWeight: 600, color: kat.aktiv ? T.cost : T.muted, minWidth: '120px', textAlign: 'right' }}>
                          {formatEUR(kat.kosten)}
                        </div>
                      </summary>

                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${T.line}`, fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 12px 0' }}>{kat.begruendung}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <a href={kat.quelleUrl} target="_blank" rel="noopener noreferrer" style={{ color: T.accent, textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}>
                            ↗ Quelle: {kat.quelle}
                          </a>
                          {zeigAnnahmen && (
                            <span style={{ fontSize: '11px', color: T.muted, fontFamily: 'monospace' }}>
                              {kat.isStunden
                                ? `${kat.basisStunden}h × ${stundensatz}€ × ${kat.isJaehrlich ? '1' : '12'} Mon × (${dienstleister}-1) × ${BRANCHEN[branche].multipliers[kat.multGroup]}`
                                : `${(kat.basisProzent * 100).toFixed(2)}% × ${formatEUR(volumenWettbewerb)} × ${BRANCHEN[branche].multipliers[kat.multGroup]}`
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* 6. QUELLEN */}
        <section style={cardStyle} className="page-break">
          <h2 className="display" style={h2Style}>6. Quellenverzeichnis</h2>
          <p style={{ fontSize: '13px', color: T.muted, marginBottom: '16px' }}>Stand der Recherche: {new Date().toLocaleDateString('de-DE')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '12px' }}>Branche & Verbände</h4>
              <ul style={listStyle}>
                <li><a href="https://www.die-gebaeudedienstleister.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>BIV — Bundesinnungsverband Gebäudereiniger</a></li>
                <li><a href="https://www.gefma.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>GEFMA — Facility Management</a></li>
                <li><a href="https://www.dguv.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>DGUV</a></li>
                <li><a href="https://www.bgbau.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>BG BAU — AMS BG Bau</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '12px' }}>Rechtliche Grundlagen</h4>
              <ul style={listStyle}>
                <li><a href="https://dejure.org/gesetze/BGB/831.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>§831 BGB</a></li>
                <li><a href="https://www.bafa.de/DE/Lieferketten/lieferketten_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>LkSG — BAFA</a></li>
                <li><a href="https://www.umweltbundesamt.de/umweltberichterstattung-csr-richtlinie" target="_blank" rel="noopener noreferrer" style={linkStyle}>CSRD — UBA</a></li>
                <li><a href="https://www.gesetze-im-internet.de/ifsg/" target="_blank" rel="noopener noreferrer" style={linkStyle}>IfSG</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '12px' }}>Studien & Reports</h4>
              <ul style={listStyle}>
                <li><a href="https://ramp.com/blog/vendor-consolidation" target="_blank" rel="noopener noreferrer" style={linkStyle}>Ramp — Vendor Consolidation</a></li>
                <li><a href="https://www.bvmed.de/themen/infektionsschutz/nosokomiale-infektionen" target="_blank" rel="noopener noreferrer" style={linkStyle}>BVMed/RKI — Nosokomiale Infektionen</a></li>
                <li><a href="https://workdate.com/de/wiki/kosten-mitarbeiterfluktuation" target="_blank" rel="noopener noreferrer" style={linkStyle}>Workdate — Fluktuationskosten</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted, marginBottom: '12px' }}>Zertifizierung & Audits</h4>
              <ul style={listStyle}>
                <li><a href="https://www.tuvsud.com/de-de/dienstleistungen/auditierung-und-zertifizierung/audit-services/lieferantenaudit" target="_blank" rel="noopener noreferrer" style={linkStyle}>TÜV SÜD — Lieferantenaudit</a></li>
                <li><a href="https://www.bafin.de/DE/Aufsicht/BankenFinanzdienstleister/Risikomanagement/MaRisk/marisk_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>BaFin — MaRisk / BAIT</a></li>
                <li><a href="https://www.ifs-certification.com/" target="_blank" rel="noopener noreferrer" style={linkStyle}>IFS Food</a></li>
                <li><a href="https://www.rki.de/DE/Themen/Infektionskrankheiten/Krankenhaushygiene/Krankenhaushygiene_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>RKI/KRINKO</a></li>
              </ul>
            </div>
          </div>
        </section>

        <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: `2px solid ${T.ink}`, textAlign: 'center', color: T.muted, fontSize: '12px' }}>
          <div className="display" style={{ fontSize: '22px', color: T.ink, fontWeight: 700, marginBottom: '4px' }}>Jolmes Gruppe</div>
          <div>Gebäudereinigung · Sanierung · Handwerk · Personal · Energie</div>
          <div style={{ marginTop: '8px' }}>ISO 9001 · ISO 14001 · AMS BG Bau · Paderborn</div>
          <div style={{ marginTop: '12px', fontStyle: 'italic', maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
            Die dargestellten Werte sind modellhafte Berechnungen auf Basis öffentlich verfügbarer Quellen. Tatsächliche Werte können abweichen und sollten im Beratungsgespräch validiert werden.
          </div>
        </footer>

      </div>
    </div>
  );
}

// STYLES
const cardStyle = { background: T.card, borderRadius: '10px', padding: 'clamp(18px, 4vw, 32px)', marginBottom: '20px', boxShadow: '0 1px 3px rgba(10,22,40,0.06)', border: `1px solid ${T.line}` };
const h2Style = { fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: `1px solid ${T.line}`, letterSpacing: '-0.01em' };
const h3Style = { fontSize: '14px', fontWeight: 600, color: T.ink, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const labelStyle = { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, marginBottom: '6px', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '10px 14px', border: `1px solid ${T.line}`, borderRadius: '6px', fontSize: '16px', background: T.soft, boxSizing: 'border-box', fontFamily: 'inherit', color: T.ink };
const btnPrimary = { padding: '10px 16px', background: T.accent, color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 16px', background: 'transparent', color: T.ink, border: `1px solid ${T.ink}`, borderRadius: '6px', fontWeight: 500, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' };
const linkStyle = { color: T.ink, textDecoration: 'none', borderBottom: `1px dotted ${T.muted}`, fontSize: '13px' };
const listStyle = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' };
const badge = (bg, fg) => ({ display: 'inline-block', padding: '3px 10px', background: bg, color: fg, fontSize: '11px', fontWeight: 600, borderRadius: '4px', letterSpacing: '0.02em' });
