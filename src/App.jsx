import React, { useState, useMemo, useEffect } from 'react';
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
  A: '#E8743B',
  B: '#19A979',
  C: '#945ECF',
  D: '#13A4B4',
  E: '#525DF4',
  'B-spez': '#BF399E',
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
const ZERTIFIKATE = [
  { id: 'iso9001',    label: 'DIN EN ISO 9001 (Qualität)',                 firmen: ['gebaeudereinigung', 'handwerk', 'energie'], downloadUrl: JOLMES_CERT_PAGE },
  { id: 'iso14001',   label: 'DIN EN ISO 14001 (Umwelt)',                  firmen: ['gebaeudereinigung', 'handwerk', 'energie'], downloadUrl: JOLMES_CERT_PAGE },
  { id: 'amsbgbau',   label: 'AMS BG Bau (Arbeitsschutz)',                 firmen: ['gebaeudereinigung'],                       downloadUrl: JOLMES_CERT_PAGE },
  { id: 'dguv201028', label: 'DGUV 201-028 (Schimmelsanierung)',           firmen: ['handwerk'],                                downloadUrl: JOLMES_CERT_PAGE },
  { id: 'innung',     label: 'Innungsmitglied (Gebäudereiniger-Innung)',   firmen: ['gebaeudereinigung'],                       downloadUrl: JOLMES_CERT_PAGE },
  { id: 'meister',    label: 'Meisterbetrieb',                             firmen: ['gebaeudereinigung', 'handwerk'],           downloadUrl: JOLMES_CERT_PAGE },
  { id: 'asbest',     label: 'TRGS 519 / Asbest-Sachkunde',                firmen: ['handwerk'],                                downloadUrl: JOLMES_CERT_PAGE },
];

const SERVICE_KATEGORIEN = ['Reinigung', 'Sanierung', 'Handwerk', 'Personal', 'Energie'];

const formatEUR = (n) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const formatNum = (n) => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n);

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
  // Hybrid-Filter: standardmäßig nur Branchen-relevante Jolmes-Leistungen einblenden;
  // Sales kann per Toggle alle 29 Leistungen sichtbar machen.
  const [showAllServices, setShowAllServices] = useState(false);

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
    setShowAllServices(false);
  };

  // Branche-spezifische Service-Auswahl. branchen===null = universell relevant.
  const isServiceRelevant = (s) => s.branchen === null || s.branchen.includes(branche);
  const sichtbareServices = showAllServices ? SERVICES : SERVICES.filter(isServiceRelevant);
  const branchenrelevanteServices = SERVICES.filter(isServiceRelevant);

  const relevantCats = useMemo(() => {
    return KATEGORIEN.filter(k => !k.branchen || k.branchen.includes(branche));
  }, [branche]);

  const calcKosten = (kat) => {
    const mult = BRANCHEN[branche].multipliers[kat.multGroup] || 1;
    if (kat.isStunden) {
      const monate = kat.isJaehrlich ? 1 : 12;
      return kat.basisStunden * stundensatz * monate * (dienstleister - 1) * mult;
    }
    return volumenWettbewerb * kat.basisProzent * mult * (kat.gruppe === 'B' ? Math.max(1, dienstleister - 1) / 2 : 1);
  };

  const ergebnisse = useMemo(() => {
    return relevantCats.map(kat => ({
      ...kat,
      kosten: calcKosten(kat),
      aktiv: aktiveCategories[kat.id] !== false,
    }));
  }, [relevantCats, volumenWettbewerb, objekte, dienstleister, stundensatz, branche, aktiveCategories]);

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

  return (
    <div style={{ fontFamily: '"Inter", "Segoe UI", -apple-system, sans-serif', backgroundColor: '#F5F1EA', minHeight: '100vh', color: '#1A2332', padding: 'clamp(12px, 3vw, 24px)' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800&family=Inter:wght@300;400;500;600;700&display=swap');
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          .print-keep { break-inside: avoid; }
          /* Kategorien-Details im PDF-Druck immer ausgeklappt */
          details > *:not(summary) { display: block !important; }
          details summary { cursor: default !important; }
        }
        @media (max-width: 640px) {
          details summary { gap: 8px !important; }
          details summary > div:first-child { gap: 8px !important; }
        }
        .fraunces { font-family: 'Fraunces', Georgia, serif; }
        .inter { font-family: 'Inter', sans-serif; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .card-hover { transition: all 0.2s ease; }
        details summary { list-style: none; cursor: pointer; }
        details summary::-webkit-details-marker { display: none; }
        input[type="range"] { accent-color: #E8743B; }
        .gradient-text {
          background: linear-gradient(135deg, #E8743B 0%, #C0492A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* HEADER */}
        <header style={{ marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px solid #1A2332' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#1A2332', color: '#F5F1EA', fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '12px' }}>
                Jolmes Gruppe · Paderborn
              </div>
              <h1 className="fraunces" style={{ fontSize: 'clamp(30px, 6vw, 52px)', lineHeight: 1.05, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Was kostet es, uns <span className="gradient-text" style={{ fontStyle: 'italic' }}>nicht</span><br />zu beauftragen?
              </h1>
              <p style={{ fontSize: '17px', color: '#5A6478', marginTop: '12px', maxWidth: '720px' }}>
                Versteckte Mehrkosten bei nicht-zertifizierten Einzeldienstleistern — Total Cost of Ownership statt Stückpreis.
              </p>
            </div>
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handlePrint} style={btnPrimary}>📄 Als PDF drucken</button>
              <button onClick={reset} style={btnSecondary}>↻ Werte zurücksetzen</button>
              <button onClick={() => setZeigAnnahmen(!zeigAnnahmen)} style={btnSecondary}>
                {zeigAnnahmen ? '◐ Annahmen verbergen' : '◑ Annahmen anzeigen'}
              </button>
            </div>
          </div>
        </header>

        {/* INPUT-BEREICH */}
        <section style={cardStyle}>
          <h2 className="fraunces" style={h2Style}>1. Ihr Szenario</h2>

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
              <span style={badge('#1A2332', '#F5F1EA')}>Aktive Branche: {BRANCHEN[branche].label}</span>
              <span style={badge('#E8743B', 'white')}>Compliance: {BRANCHEN[branche].compliance}</span>
            </div>
          </div>

          {/* Modus-Toggle */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Eingabe der Angebote</label>
            <div style={{ display: 'flex', gap: '0', borderRadius: '6px', overflow: 'hidden', border: '1px solid #D5CFC4', width: 'fit-content' }}>
              <button
                onClick={() => setEingabeModus('gesamt')}
                style={{
                  padding: '10px 20px',
                  background: eingabeModus === 'gesamt' ? '#1A2332' : 'white',
                  color: eingabeModus === 'gesamt' ? '#F5F1EA' : '#1A2332',
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
                onClick={() => setEingabeModus('objekt')}
                style={{
                  padding: '10px 20px',
                  background: eingabeModus === 'objekt' ? '#1A2332' : 'white',
                  color: eingabeModus === 'objekt' ? '#F5F1EA' : '#1A2332',
                  border: 'none',
                  borderLeft: '1px solid #D5CFC4',
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

          {/* Angebotspaar — visuell hervorgehoben */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px', padding: '20px', background: '#FCFAF6', border: '1px solid #EDE7DD', borderRadius: '8px' }}>
            <div>
              <label style={{ ...labelStyle, color: '#C0492A' }}>
                Angebot Wettbewerb {eingabeModus === 'objekt' ? '(€/Jahr/Objekt)' : '(€/Jahr)'}
              </label>
              <input
                type="number"
                value={volumen}
                onChange={(e) => setVolumen(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: '#C0492A', borderWidth: '2px' }}
              />
            </div>
            <div>
              <label style={{ ...labelStyle, color: '#19A979' }}>
                Ihr Angebot Jolmes {eingabeModus === 'objekt' ? '(€/Jahr/Objekt)' : '(€/Jahr)'}
              </label>
              <input
                type="number"
                value={jolmesAngebot}
                onChange={(e) => setJolmesAngebot(Number(e.target.value))}
                style={{ ...inputStyle, borderColor: '#19A979', borderWidth: '2px' }}
              />
            </div>
          </div>

          {/* Live-Vorschau Preisdifferenz */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px', padding: '14px 18px', background: preisDifferenz > 0 ? '#FFF4ED' : '#EDF9F3', borderRadius: '6px', border: `1px solid ${preisDifferenz > 0 ? '#FFD4BB' : '#B8E5D2'}` }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '2px' }}>Wettbewerb gesamt/Jahr</div>
              <div className="fraunces" style={{ fontSize: '20px', fontWeight: 600 }}>{formatEUR(volumenWettbewerb)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '2px' }}>Jolmes gesamt/Jahr</div>
              <div className="fraunces" style={{ fontSize: '20px', fontWeight: 600 }}>{formatEUR(volumenJolmes)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '2px' }}>
                {preisDifferenz > 0 ? 'Mehrpreis Jolmes' : preisDifferenz < 0 ? 'Ersparnis Jolmes' : 'Gleicher Preis'}
              </div>
              <div className="fraunces" style={{ fontSize: '20px', fontWeight: 700, color: preisDifferenz > 0 ? '#C0492A' : '#19A979' }}>
                {preisDifferenz > 0 ? '+' : ''}{formatEUR(preisDifferenz)}
                <span style={{ fontSize: '12px', color: '#5A6478', marginLeft: '6px', fontWeight: 400 }}>
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

        {/* LEISTUNGSSPEKTRUM & ZERTIFIKATE WETTBEWERB */}
        <section style={cardStyle} className="print-keep">
          <h2 className="fraunces" style={h2Style}>Leistungsspektrum & Zertifikate des Wettbewerbs</h2>
          <p style={{ fontSize: '14px', color: '#5A6478', marginBottom: '20px' }}>
            Haken Sie an, was der bisherige Dienstleister tatsächlich abdeckt. Alles, was offen bleibt, muss extern oder intern kompensiert werden — und wird im PDF als Versorgungslücke ausgewiesen.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <h3 style={{ ...h3Style, marginBottom: 0 }}>Dienstleistungen</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#5A6478' }}>
                {showAllServices
                  ? `Alle ${SERVICES.length} Jolmes-Leistungen`
                  : `${branchenrelevanteServices.length} von ${SERVICES.length} (${BRANCHEN[branche].label})`}
              </span>
              <button
                onClick={() => setShowAllServices(v => !v)}
                style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}
              >
                {showAllServices ? '← Nur branchenrelevante' : 'Alle Leistungen anzeigen →'}
              </button>
            </div>
          </div>
          {SERVICE_KATEGORIEN.map(kat => {
            const items = sichtbareServices.filter(s => s.kategorie === kat);
            if (items.length === 0) return null;
            const abgedeckt = items.filter(s => wettbewerbServices[s.id]).length;
            return (
              <div key={kat} style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A2332', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kat}</div>
                  <div style={{ fontSize: '12px', color: '#5A6478' }}>{abgedeckt} von {items.length} abgedeckt</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                  {items.map(s => {
                    const checked = !!wettbewerbServices[s.id];
                    const branchenfremd = !isServiceRelevant(s);
                    return (
                      <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: `1px solid ${checked ? '#B8E5D2' : '#D5CFC4'}`, borderRadius: '6px', background: checked ? '#EDF9F3' : '#FCFAF6', cursor: 'pointer', fontSize: '14px', opacity: branchenfremd ? 0.6 : 1 }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleService(s.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#19A979' }} />
                        <span style={{ flex: 1 }}>{s.label}</span>
                        {branchenfremd && <span style={{ fontSize: '10px', color: '#9A9485', textTransform: 'uppercase', letterSpacing: '0.05em' }} title="für die gewählte Branche untypisch">extra</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <h3 style={{ ...h3Style, marginTop: '24px' }}>Zertifikate (Jolmes-Nachweise zum Download)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
            {ZERTIFIKATE.map(z => {
              const checked = !!wettbewerbZertifikate[z.id];
              const isPdf = z.downloadUrl && /\.pdf(\?|#|$)/i.test(z.downloadUrl);
              const linkLabel = isPdf ? '↓ PDF' : '↗ Ansehen';
              return (
                <div key={z.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', border: `1px solid ${checked ? '#B8E5D2' : '#D5CFC4'}`, borderRadius: '6px', background: checked ? '#EDF9F3' : '#FCFAF6', fontSize: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minWidth: 0 }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleZert(z.id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#19A979', flexShrink: 0 }} />
                      <span style={{ minWidth: 0, fontWeight: 500 }}>{z.label}</span>
                    </label>
                    {z.downloadUrl ? (
                      <a href={z.downloadUrl} target="_blank" rel="noopener noreferrer" {...(isPdf ? { download: true } : {})}
                         style={{ fontSize: '12px', color: '#E8743B', textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 600, padding: '4px 8px', border: '1px solid #FFD4BB', borderRadius: '4px', background: 'white' }}>
                        {linkLabel}
                      </a>
                    ) : (
                      <span title="Zertifikat-PDF unter public/zertifikate/ hinterlegen, dann downloadUrl setzen"
                            style={{ fontSize: '11px', color: '#9A9485', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                        PDF folgt
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {(z.firmen || []).map(fid => {
                      const firma = FIRMEN.find(f => f.id === fid);
                      if (!firma) return null;
                      return <span key={fid} style={{ fontSize: '10px', padding: '2px 8px', background: '#1A2332', color: '#F5F1EA', borderRadius: '3px', letterSpacing: '0.02em' }}>{firma.label}</span>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zusammenfassung Lücken — auf branchen-relevante Leistungen beschränkt */}
          <div style={{ marginTop: '24px', padding: '16px 18px', background: '#FFF4ED', border: '1px solid #FFD4BB', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '10px', fontWeight: 600 }}>
              Lücken beim Wettbewerb (Jolmes deckt es ab) — {BRANCHEN[branche].label}
            </div>
            {(() => {
              const luecken = branchenrelevanteServices.filter(s => !wettbewerbServices[s.id]);
              const fehlendeZert = ZERTIFIKATE.filter(z => !wettbewerbZertifikate[z.id]);
              if (luecken.length === 0 && fehlendeZert.length === 0) {
                return <div style={{ fontSize: '13px', color: '#1A2332' }}>Wettbewerb deckt alle Leistungen und Zertifikate ab — Differenzierung über TCO und Service-Qualität.</div>;
              }
              return (
                <>
                  {luecken.length > 0 && (
                    <div style={{ marginBottom: fehlendeZert.length > 0 ? '12px' : 0 }}>
                      <div style={{ fontSize: '12px', color: '#5A6478', marginBottom: '6px' }}>Fehlende Leistungen ({luecken.length}):</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {luecken.map(s => (
                          <span key={s.id} style={{ display: 'inline-block', padding: '4px 10px', background: 'white', border: '1px solid #FFD4BB', borderRadius: '4px', fontSize: '12px', color: '#1A2332' }}>{s.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {fehlendeZert.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', color: '#5A6478', marginBottom: '6px' }}>Fehlende Zertifikate ({fehlendeZert.length}):</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {fehlendeZert.map(z => (
                          <span key={z.id} style={{ display: 'inline-block', padding: '4px 10px', background: 'white', border: '1px solid #FFD4BB', borderRadius: '4px', fontSize: '12px', color: '#1A2332' }}>{z.label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </section>

        {/* HAUPTERGEBNIS */}
        <section style={{ ...cardStyle, background: 'linear-gradient(135deg, #1A2332 0%, #2D3D55 100%)', color: '#F5F1EA', position: 'relative', overflow: 'hidden' }} className="print-keep">
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(232,116,59,0.15) 0%, transparent 70%)' }}></div>

          <h2 className="fraunces" style={{ ...h2Style, color: '#F5F1EA', borderColor: 'rgba(245,241,234,0.2)' }}>
            2. Ihre versteckten Mehrkosten
          </h2>

          {kundenname && <p style={{ opacity: 0.7, fontSize: '14px', marginBottom: '8px' }}>Kalkulation für: <strong>{kundenname}</strong></p>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginTop: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>Mehrkosten / Jahr</div>
              <div className="fraunces" style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 800, color: '#E8743B', lineHeight: 1, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten)}
              </div>
              <div style={{ fontSize: '13px', opacity: 0.6, marginTop: '4px' }}>
                = {volumenWettbewerb > 0 ? ((gesamtMehrkosten / volumenWettbewerb) * 100).toFixed(1) : '0'}% des Wettbewerbs-Auftragsvolumens
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>3-Jahres-Hochrechnung</div>
              <div className="fraunces" style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 600, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten * 3)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7 }}>5-Jahres-Hochrechnung</div>
              <div className="fraunces" style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 600, marginTop: '4px' }}>
                {formatEUR(gesamtMehrkosten * 5)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(245,241,234,0.08)', borderRadius: '8px', borderLeft: `3px solid ${nettoVorteil > 0 ? '#19A979' : '#E8743B'}` }}>
            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.15em', opacity: 0.7, marginBottom: '12px' }}>
              Vergleichsrechnung Total Cost of Ownership
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  {preisDifferenz > 0
                    ? `Mehrpreis Jolmes-Angebot (+${preisDifferenzProzent.toFixed(1)}%)`
                    : preisDifferenz < 0
                    ? `Ersparnis Jolmes-Angebot (${preisDifferenzProzent.toFixed(1)}%)`
                    : 'Preisgleich mit Wettbewerb'}
                </div>
                <div className="fraunces" style={{ fontSize: '24px', fontWeight: 600, color: '#F5F1EA' }}>
                  {preisDifferenz > 0 ? '+' : ''}{formatEUR(preisDifferenz)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>Versteckte Mehrkosten Wettbewerb</div>
                <div className="fraunces" style={{ fontSize: '24px', fontWeight: 600, color: '#E8743B' }}>
                  {formatEUR(gesamtMehrkosten)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  {nettoVorteil > 0 ? 'Effektiver Vorteil Jolmes' : 'Effektiver Nachteil Jolmes'}
                </div>
                <div className="fraunces" style={{ fontSize: '28px', fontWeight: 700, color: nettoVorteil > 0 ? '#19A979' : '#E8743B' }}>
                  {nettoVorteil > 0 ? '+' : ''}{formatEUR(nettoVorteil)} / Jahr
                </div>
              </div>
            </div>
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(245,241,234,0.15)', fontSize: '12px', opacity: 0.75, fontFamily: 'monospace' }}>
              Rechnung: versteckte Mehrkosten Wettbewerb ({formatEUR(gesamtMehrkosten)}) {preisDifferenz >= 0 ? '−' : '+'} {preisDifferenz >= 0 ? 'Mehrpreis Jolmes' : 'Ersparnis Jolmes'} ({formatEUR(Math.abs(preisDifferenz))}) = {formatEUR(nettoVorteil)}
            </div>
          </div>
        </section>

        {/* DIAGRAMME */}
        <section style={{ ...cardStyle }} className="page-break print-keep">
          <h2 className="fraunces" style={h2Style}>3. Visuelle Aufschlüsselung</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
            <div>
              <h3 style={h3Style}>Top 10 Kostentreiber</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={top10} layout="vertical" margin={{ left: 0, right: 30 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#D5CFC4" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#5A6478" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#5A6478" fontSize={10} width={180} />
                  <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: '#1A2332', color: '#F5F1EA', border: 'none' }} />
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
                  <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: '#1A2332', color: '#F5F1EA', border: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <h3 style={h3Style}>Kumulierte Mehrkosten über 5 Jahre</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={zeitreihe}>
                <CartesianGrid strokeDasharray="2 4" stroke="#D5CFC4" />
                <XAxis dataKey="jahr" stroke="#5A6478" fontSize={11} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="#5A6478" fontSize={11} />
                <Tooltip formatter={(v) => formatEUR(v)} contentStyle={{ background: '#1A2332', color: '#F5F1EA', border: 'none' }} />
                <Line type="monotone" dataKey="kumuliert" stroke="#E8743B" strokeWidth={3} dot={{ fill: '#E8743B', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* KATEGORIEN */}
        <section style={{ ...cardStyle }} className="page-break">
          <h2 className="fraunces" style={h2Style}>4. Kostenkategorien im Detail</h2>
          <p style={{ fontSize: '14px', color: '#5A6478', marginBottom: '20px' }}>
            Klicken Sie eine Kategorie an, um Begründung, Quelle und Annahmen zu sehen. Über den Schalter können Sie einzelne Posten aus der Berechnung ausschließen.
          </p>

          {Object.keys(GRUPPEN_LABELS).map(grp => {
            const gruppeCats = ergebnisse.filter(e => e.gruppe === grp);
            if (gruppeCats.length === 0) return null;
            const gruppenSumme = gruppeCats.filter(e => e.aktiv).reduce((s, e) => s + e.kosten, 0);

            return (
              <div key={grp} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${GRUPPEN_COLORS[grp]}` }}>
                  <div style={{ width: '12px', height: '12px', background: GRUPPEN_COLORS[grp], borderRadius: '50%' }}></div>
                  <h3 className="fraunces" style={{ fontSize: '22px', fontWeight: 600, margin: 0, flex: 1 }}>
                    {grp !== 'B-spez' && `${grp}. `}{GRUPPEN_LABELS[grp]}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#5A6478' }}>
                    Summe: <strong style={{ color: '#1A2332' }}>{formatEUR(gruppenSumme)}</strong>
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
                        background: kat.aktiv ? 'white' : '#EDE7DD',
                        border: `1px solid ${kat.aktiv ? '#D5CFC4' : '#C0B9AC'}`,
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
                        <div className="fraunces" style={{ fontSize: '20px', fontWeight: 600, color: kat.aktiv ? '#E8743B' : '#5A6478', minWidth: '120px', textAlign: 'right' }}>
                          {formatEUR(kat.kosten)}
                        </div>
                      </summary>

                      <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #EDE7DD', fontSize: '13px', color: '#3A4456', lineHeight: 1.6 }}>
                        <p style={{ margin: '0 0 12px 0' }}>{kat.begruendung}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <a href={kat.quelleUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#E8743B', textDecoration: 'none', fontWeight: 600, fontSize: '12px' }}>
                            ↗ Quelle: {kat.quelle}
                          </a>
                          {zeigAnnahmen && (
                            <span style={{ fontSize: '11px', color: '#5A6478', fontFamily: 'monospace' }}>
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

        {/* QUELLEN */}
        <section style={cardStyle} className="page-break">
          <h2 className="fraunces" style={h2Style}>5. Quellenverzeichnis</h2>
          <p style={{ fontSize: '13px', color: '#5A6478', marginBottom: '16px' }}>Stand der Recherche: {new Date().toLocaleDateString('de-DE')}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '12px' }}>Branche & Verbände</h4>
              <ul style={listStyle}>
                <li><a href="https://www.die-gebaeudedienstleister.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>BIV — Bundesinnungsverband Gebäudereiniger</a></li>
                <li><a href="https://www.gefma.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>GEFMA — Deutscher Verband Facility Management</a></li>
                <li><a href="https://www.dguv.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>DGUV — Deutsche Gesetzliche Unfallversicherung</a></li>
                <li><a href="https://www.bgbau.de/" target="_blank" rel="noopener noreferrer" style={linkStyle}>BG BAU — AMS BG Bau</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '12px' }}>Rechtliche Grundlagen</h4>
              <ul style={listStyle}>
                <li><a href="https://dejure.org/gesetze/BGB/831.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>§831 BGB — Auswahl-/Überwachungsverschulden</a></li>
                <li><a href="https://www.bafa.de/DE/Lieferketten/lieferketten_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>LkSG — Lieferkettensorgfaltspflichtengesetz</a></li>
                <li><a href="https://www.umweltbundesamt.de/umweltberichterstattung-csr-richtlinie" target="_blank" rel="noopener noreferrer" style={linkStyle}>CSRD — UBA</a></li>
                <li><a href="https://www.gesetze-im-internet.de/ifsg/" target="_blank" rel="noopener noreferrer" style={linkStyle}>IfSG — Infektionsschutzgesetz</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '12px' }}>Studien & Reports</h4>
              <ul style={listStyle}>
                <li><a href="https://ramp.com/blog/vendor-consolidation" target="_blank" rel="noopener noreferrer" style={linkStyle}>Ramp — Vendor Consolidation 2025</a></li>
                <li><a href="https://www.bvmed.de/themen/infektionsschutz/nosokomiale-infektionen" target="_blank" rel="noopener noreferrer" style={linkStyle}>BVMed/RKI — Nosokomiale Infektionen</a></li>
                <li><a href="https://workdate.com/de/wiki/kosten-mitarbeiterfluktuation" target="_blank" rel="noopener noreferrer" style={linkStyle}>Workdate — Fluktuationskosten</a></li>
                <li><a href="https://www.creditreform.de/aktuelles-wissen/pressemeldungen-fachbeitraege/news-details/show/neue-eu-vorgaben-2026-herausforderungen-fuer-den-mittelstand" target="_blank" rel="noopener noreferrer" style={linkStyle}>Creditreform — EU-Vorgaben 2026</a></li>
              </ul>
            </div>

            <div>
              <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '12px' }}>Zertifizierung & Audits</h4>
              <ul style={listStyle}>
                <li><a href="https://www.tuvsud.com/de-de/dienstleistungen/auditierung-und-zertifizierung/audit-services/lieferantenaudit" target="_blank" rel="noopener noreferrer" style={linkStyle}>TÜV SÜD — Lieferantenaudit</a></li>
                <li><a href="https://www.bafin.de/DE/Aufsicht/BankenFinanzdienstleister/Risikomanagement/MaRisk/marisk_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>BaFin — MaRisk / BAIT</a></li>
                <li><a href="https://www.ifs-certification.com/" target="_blank" rel="noopener noreferrer" style={linkStyle}>IFS Food</a></li>
                <li><a href="https://www.rki.de/DE/Themen/Infektionskrankheiten/Krankenhaushygiene/Krankenhaushygiene_node.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>RKI/KRINKO</a></li>
              </ul>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '2px solid #1A2332', textAlign: 'center', color: '#5A6478', fontSize: '12px' }}>
          <div className="fraunces" style={{ fontSize: '20px', color: '#1A2332', fontWeight: 600, marginBottom: '4px' }}>Jolmes Gruppe</div>
          <div>Gebäudereinigung · Brand-/Wasserschadensanierung · Malerarbeiten · Bodenbeschichtung · Personalvermittlung · Glasreinigung · Unterhaltsreinigung</div>
          <div style={{ marginTop: '8px' }}>Zertifiziert nach ISO 9001 · ISO 14001 · AMS BG Bau · Paderborn</div>
          <div style={{ marginTop: '12px', fontStyle: 'italic' }}>
            Die dargestellten Werte sind modellhafte Berechnungen auf Basis öffentlich verfügbarer Quellen und Branchenstudien. Tatsächliche Werte können abweichen und sollten im individuellen Beratungsgespräch validiert werden.
          </div>
        </footer>

      </div>
    </div>
  );
}

// STYLES
const cardStyle = { background: 'white', borderRadius: '12px', padding: 'clamp(18px, 4vw, 32px)', marginBottom: '24px', boxShadow: '0 2px 8px rgba(26,35,50,0.06)' };
const h2Style = { fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 700, margin: '0 0 24px 0', paddingBottom: '12px', borderBottom: '1px solid #EDE7DD', letterSpacing: '-0.01em' };
const h3Style = { fontSize: '15px', fontWeight: 600, color: '#1A2332', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const labelStyle = { display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5A6478', marginBottom: '6px', fontWeight: 600 };
const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid #D5CFC4', borderRadius: '6px', fontSize: '16px', background: '#FCFAF6', boxSizing: 'border-box', fontFamily: 'inherit' };
const btnPrimary = { padding: '10px 18px', background: '#E8743B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' };
const btnSecondary = { padding: '10px 18px', background: 'transparent', color: '#1A2332', border: '1px solid #1A2332', borderRadius: '6px', fontWeight: 500, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' };
const linkStyle = { color: '#1A2332', textDecoration: 'none', borderBottom: '1px dotted #5A6478', fontSize: '13px' };
const listStyle = { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' };
const badge = (bg, fg) => ({ display: 'inline-block', padding: '3px 10px', background: bg, color: fg, fontSize: '11px', fontWeight: 600, borderRadius: '4px', letterSpacing: '0.02em' });
