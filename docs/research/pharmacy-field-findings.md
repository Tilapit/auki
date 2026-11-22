# Pharmacy field findings, November 2026

Results from pharmacy visits on a research trip through Europe, 3–13 November 2026: three people, 20 countries, one or a few cities in each. Only the pharmacy findings are here. They are cleared for publication (PLAN, decision D1). No person or pharmacy is named, and no result is tied to a pharmacy.

This file is the evidence. What the app shows lives in `data/countries/` (PLAN section 8). PLAN section 8.2 already holds Estonia, Latvia, Lithuania, Poland, Czechia, Denmark, Norway, Sweden and Germany. This file adds eleven countries and the German city detail behind section 8.2.

## How to read it

- Samples are tiny: 1–6 pharmacies per city. "4/4" means four pharmacies asked and four said yes.
- Most results are what the staff said at the counter. Few were tried end to end.
- The answer often depended on who was at the counter, even within one chain.
- "Kanta's list" means the countries where Kanta says a Finnish e-prescription can be bought: EE, LV, LT, PL, CZ, HR, PT and ES, some of them only in some pharmacies or regions. Check kanta.fi again before publishing.

What was asked about:

| Format | Meaning |
|---|---|
| E-prescription | The pharmacy fetches the Finnish e-prescription through the EU's cross-border system |
| Paper | A printed prescription with the doctor's wet-ink signature |
| Phone PDF | A PDF or a photo of the prescription on the phone |
| Email | The prescription emailed to the pharmacy by the doctor, or where noted by the patient |
| Over the counter | Whether a medicine that needs a prescription in Finland is sold without one |

## By country

### Austria: Vienna, 4 pharmacies

- E-prescription: not on Kanta's list.
- Phone PDF: accepted 4/4. A photo was enough, and no one asked for ID.
- Email: one said a doctor's email works.
- Pharmacies with "International" in the name were the most flexible.

### Croatia: Zagreb, 5

- E-prescription: on Kanta's list. Dispensed with an ID alone 1/5. Two of five also wanted the European Health Insurance Card (EHIC). Two couldn't find the system.
- The first answer was often no. Asking again helped.
- Email: the most reliable route. The doctor emails the prescription, and the pharmacy prints and stamps it.
- Tip: carry the EHIC card.

### Germany: Frankfurt 4, Stuttgart 4, Munich 5

- E-prescription: not possible.
- Paper: Frankfurt 4/4 required the original. In Stuttgart one insisted on it.
- Phone PDF: Frankfurt 0/4. Stuttgart 1/4, for a migraine medicine only.
- Email: Munich 5/5 (the doctor's email or fax). Stuttgart: one said yes, and a test worked.
- Practice varied by city. Pharmacies with "International" in the name were more flexible. Staff often questioned the medicine itself.

### Greece: Athens, 4

- E-prescription: not connected to the EU system. It needs a Greek ID and the prescription's PIN.
- Phone PDF: antibiotics refused 4/4 on a foreign prescription. A migraine medicine on a PDF was fine.
- Over the counter: most medicines, except antibiotics and narcotics.
- Pharmacists pointed to local doctors who write a tourist e-prescription. Pharmacists give advice and vaccinate, and locals go to the pharmacy first.

### Hungary: Budapest, 5

- E-prescription: not connected to the EU system.
- Paper: the official line is the original with the doctor's signature and stamp. With that, even antibiotics.
- Phone PDF: refused 3/5, printouts too. One would accept a version printed and stamped again locally. One sold antibiotics after an email attempt.
- Strengths differ: 1000 mg was offered for a 750 mg prescription.
- Medicines were cheap.

### Italy: Milan 4, Rome 3

- E-prescription: not on Kanta's list, and there was no system to look it up.
- Phone PDF: Milan 4/4. Rome 3/3 would have dispensed on the Finnish prescription or on the medicine's name alone, without ID.
- Email: accepted in Milan.
- Over the counter: allergy and migraine medicines. "Hard" medicines need more.
- In Rome, pharmacists pointed to a medical service for tourists that writes local prescriptions.
- Milan: 2/4 vaccinate on site, basic vaccines without an appointment.

### Malta: 3

- E-prescription: the pharmacies didn't know the EU system.
- Phone PDF: antibiotics on a PDF 2/3, "up to the pharmacist". The third, with no pharmacist on duty at the time, refused and pointed to the pharmacy's own doctor and a local form.
- When the strength didn't match, a message from the doctor confirming the change was enough.
- Over the counter: lighter prescription medicines.
- Some pharmacies have a doctor's appointment on site (about €20).

### Portugal: Lisbon, 6

- E-prescription: on Kanta's list for some pharmacies. None of those visited had a way to look it up.
- Paper: accepted 3/3, a copy too, without ID.
- Phone PDF: refused when shown at the counter, accepted once emailed to the pharmacy. A copy printed from Kanta.fi was accepted too.
- "It works somewhere, not elsewhere." Strong medicines are restricted.

### Slovakia: Bratislava, 6

- E-prescription: not on Kanta's list.
- Paper: some required it.
- Phone PDF: one accepted it.
- Email: several accepted a doctor's email. The safest route was to email the prescription to the pharmacy, even from your own address.
- Over the counter: one would sell an allergy medicine.
- Practice varied even within one chain. Language was a barrier at the counter.

### Slovenia: Ljubljana, 3

- E-prescription: not on Kanta's list.
- Paper: a private pharmacy required the original or a local prescription.
- Email: two pharmacies of one large chain accepted email, and it didn't have to come from the doctor.
- Queues were long: about 30 minutes a visit.

### Spain: Barcelona 5; Málaga and Fuengirola 3

- E-prescription: on Kanta's list in some regions. Found once in eight, with the Finnish personal identity code. Elsewhere: "no system".
- Over the counter: milder prescription medicines were sold without checking (Barcelona 4/5, Málaga and Fuengirola 2/3). One pharmacy refused a foreign prescription. Antibiotics and strong medicines such as lorazepam need a prescription from a local doctor.
- Stock: a traveller with a fever went through 7–8 pharmacies for a prescribed medicine. There was no way to see who had it.
- On the Costa del Sol, a Finn refused elsewhere was helped at a pharmacy with Finnish-speaking staff.

### Switzerland: Zürich, 3

- Not part of the EU system.
- Email: accepted 3/3, without ID. It didn't matter who sent it.

## Patterns

- The paper original with a wet-ink signature works almost everywhere. Hungary also wants the doctor's stamp.
- Emailing the prescription to the pharmacy worked in many countries (CH, SI, SK, PT, IT, AT, and Munich), sometimes even when the patient sent it.
- In Southern Europe (ES, IT, PT, GR, MT) many milder medicines are sold without a prescription. Antibiotics and strong medicines need a local doctor's prescription.
- The EU e-prescription works on paper, but staff often don't know the system (HR, ES; PL in section 8.2). Asking again, and asking for the pharmacist, matters.
- Strengths differ between countries, and pharmacists substitute (HU, MT; LV in section 8.2).
- Abroad there was no way to see stock (Barcelona; Tallinn and Riga in section 8.2).
- Pharmacies with "International" in the name were more flexible (Munich, Vienna).
- Pharmacies do more than dispense: vaccinations (IT, GR) and doctor's appointments (MT).

## What it means for the app

- **Country data** (PLAN 8.2): add AT, CH, GR, HU, IT, MT, SI and SK. HR, PT and ES are now field-tested.
- **Pharmacy email:** keep `email` (else `contact:email`) from OpenStreetMap in the tile row, and show it in the pharmacy sheet as a `mailto:` link next to the phone and the website.
- **Counter card,** new English master lines (draft, unreviewed):
  - **P8** Can I email the prescription to you? Which address should I use?
  - **P9** If you don't have this strength, is there an equivalent?
  - **P10** Is this medicine available without a prescription here?
  - **P11** Do you have this in stock? If not, which pharmacy nearby might?
- **Tips:** Croatia: carry the EHIC card. Everywhere: if the first answer is no, ask for the pharmacist.
- **Wording:** never present "sold without a prescription" as a tip. Say that some medicines that need a prescription in Finland are sold over the counter there, and that the pharmacist decides.
- **Later:** a prefilled email to the pharmacy in its language; a hint for international pharmacies; stock abroad.
