/**
 * The counter card's lines, by language (PLAN.md section 8.3): the same few sentences in the
 * language of the country the user is in, for a prescription from any other country.
 *
 * The country the prescription is from is not woven into a sentence. It stands by itself,
 * after a colon ("Riik: Saksamaa."), so that no language needs the name in another case than
 * the one the browser gives (`Intl.DisplayNames`, the Unicode consortium's country names).
 *
 * Every translation here is a draft: `reviewed` is false, and the card says so on its face
 * ("Käännös tarkistamatta"). Some lines started from what was said at the counter on the
 * research trip; none has had a native check. A language moves to `reviewed: true` only when
 * a native speaker has read the lines as they stand here. Finnish and English are the app's
 * own two languages and are written like the rest of its texts.
 *
 * No medicine is named, and nothing here asks for a medicine without its prescription.
 */

import type { CardPhrases, CardVariant } from '../../lib/types';

export interface LanguagePhrases {
  /** BCP 47 tag, for the `lang` attribute and for the country's name. */
  lang: string;
  reviewed: boolean;
  /** "Country", as it stands before the colon. */
  country: string;
  /** "I have an electronic prescription from another EU country." / "Please look it up in the cross-border e-prescription system." / "Here is my passport or identity card." */
  ePrescription?: [string, string, string];
  /**
   * Only for a prescription from Finland, in place of the last line above: on the trip staff
   * asked for an "insurance number" and did not know that for Finland it is the personal
   * identity code (PLAN.md section 2).
   */
  finnishId?: string;
  /** "This is an original prescription from a doctor in another EU or EEA country." / the same, "in another country" / "Can you dispense it?" */
  paper: [string, string, string];
  /** "My doctor can send the prescription straight to you by email or fax." / "Would that work? Which address or number should they use?" */
  doctorSends?: [string, string];
  /** "Could a pharmacist help me with this?" */
  pharmacist: string;
}

export const PHRASES: Record<string, LanguagePhrases> = {
  en: {
    lang: 'en',
    reviewed: true,
    country: 'Country',
    ePrescription: ['Hello. I have an electronic prescription from another EU country.', 'Please look it up in the cross-border e-prescription system.', 'Here is my passport or identity card.'],
    finnishId: 'If the system asks for an insurance number, it is my Finnish personal identity code. It is on my passport’s data page.',
    paper: ['Hello. This is an original prescription from a doctor in another EU or EEA country.', 'Hello. This is an original prescription from a doctor in another country.', 'Can you dispense it?'],
    doctorSends: ['Hello. My doctor can send the prescription straight to you by email or fax.', 'Would that work? Which address or number should they use?'],
    pharmacist: 'Could a pharmacist help me with this?',
  },
  fi: {
    lang: 'fi',
    reviewed: true,
    country: 'Maa',
    ePrescription: ['Hei! Minulla on toisessa EU-maassa kirjoitettu sähköinen resepti.', 'Voisitteko hakea sähköisen eurooppalaisen reseptini?', 'Tässä on passini tai henkilökorttini.'],
    paper: ['Hei! Tämä on toisessa EU- tai Eta-maassa toimivan lääkärin kirjoittama alkuperäinen resepti.', 'Hei! Tämä on toisessa maassa toimivan lääkärin kirjoittama alkuperäinen resepti.', 'Voitteko toimittaa lääkkeen tällä reseptillä?'],
    pharmacist: 'Voisiko proviisori tai farmaseutti auttaa minua?',
  },
  et: {
    lang: 'et',
    reviewed: false,
    country: 'Riik',
    ePrescription: ['Tere! Mul on teises Euroopa Liidu riigis välja kirjutatud digiretsept.', 'Palun otsige see piiriülese digiretsepti süsteemist.', 'Siin on minu pass või ID-kaart.'],
    finnishId: 'Kui süsteem küsib kindlustusnumbrit, siis see on minu Soome isikukood. See on passi andmelehel.',
    paper: [
      'Tere! See on originaalretsept, mille on välja kirjutanud arst teises Euroopa Liidu või Euroopa Majanduspiirkonna riigis.',
      'Tere! See on originaalretsept, mille on välja kirjutanud arst teises riigis.',
      'Kas saate selle alusel ravimi väljastada?',
    ],
    pharmacist: 'Kas proviisor saaks mind aidata?',
  },
  lv: {
    lang: 'lv',
    reviewed: false,
    country: 'Valsts',
    ePrescription: ['Labdien! Man ir citā Eiropas Savienības valstī izrakstīta e-recepte.', 'Lūdzu, atrodiet to pārrobežu e-receptes sistēmā.', 'Šeit ir mana pase vai personas apliecība.'],
    finnishId: 'Ja sistēma prasa apdrošināšanas numuru, tas ir mans Somijas personas kods. Tas ir pases datu lapā.',
    paper: [
      'Labdien! Šī ir oriģināla recepte, ko izrakstījis ārsts citā Eiropas Savienības vai Eiropas Ekonomikas zonas valstī.',
      'Labdien! Šī ir oriģināla recepte, ko izrakstījis ārsts citā valstī.',
      'Vai varat izsniegt zāles pēc šīs receptes?',
    ],
    pharmacist: 'Vai farmaceits varētu man palīdzēt?',
  },
  lt: {
    lang: 'lt',
    reviewed: false,
    country: 'Šalis',
    ePrescription: ['Laba diena! Turiu kitoje Europos Sąjungos šalyje išrašytą e. receptą.', 'Prašau surasti jį tarpvalstybinėje e. receptų sistemoje.', 'Štai mano pasas arba asmens tapatybės kortelė.'],
    finnishId: 'Jei sistema prašo draudimo numerio, tai mano suomiškas asmens kodas. Jis yra paso duomenų puslapyje.',
    paper: [
      'Laba diena! Tai originalus receptas, kurį išrašė gydytojas kitoje Europos Sąjungos arba Europos ekonominės erdvės šalyje.',
      'Laba diena! Tai originalus receptas, kurį išrašė gydytojas kitoje šalyje.',
      'Ar galite pagal jį išduoti vaistus?',
    ],
    pharmacist: 'Ar galėtų man padėti vaistininkas?',
  },
  pl: {
    lang: 'pl',
    reviewed: false,
    country: 'Kraj',
    ePrescription: ['Dzień dobry! Mam e-receptę wystawioną w innym kraju Unii Europejskiej.', 'Proszę sprawdzić ją w systemie e-recepty transgranicznej.', 'Oto mój paszport lub dowód osobisty.'],
    finnishId: 'Jeśli system pyta o numer ubezpieczenia, to jest mój fiński numer identyfikacyjny. Jest w paszporcie, na stronie z danymi.',
    paper: [
      'Dzień dobry! To jest oryginalna recepta od lekarza z innego kraju Unii Europejskiej lub Europejskiego Obszaru Gospodarczego.',
      'Dzień dobry! To jest oryginalna recepta od lekarza z innego kraju.',
      'Czy można ją tutaj zrealizować?',
    ],
    pharmacist: 'Czy mogę prosić o pomoc farmaceuty?',
  },
  cs: {
    lang: 'cs',
    reviewed: false,
    country: 'Země',
    ePrescription: ['Dobrý den! Mám elektronický recept vystavený v jiné zemi Evropské unie.', 'Vyhledejte ho prosím v systému přeshraničního eReceptu.', 'Tady je můj pas nebo občanský průkaz.'],
    finnishId: 'Pokud systém žádá číslo pojištěnce, je to moje finské osobní identifikační číslo. Je v pasu na stránce s osobními údaji.',
    paper: [
      'Dobrý den! Toto je originál receptu od lékaře z jiné země Evropské unie nebo Evropského hospodářského prostoru.',
      'Dobrý den! Toto je originál receptu od lékaře z jiné země.',
      'Můžete mi na něj lék vydat?',
    ],
    pharmacist: 'Mohl by mi s tím pomoci lékárník?',
  },
  hr: {
    lang: 'hr',
    reviewed: false,
    country: 'Država',
    ePrescription: ['Dobar dan! Imam e-recept izdan u drugoj državi Europske unije.', 'Molim vas, potražite ga u sustavu prekograničnog e-recepta.', 'Ovo je moja putovnica ili osobna iskaznica.'],
    finnishId: 'Ako sustav traži broj osiguranja, to je moj finski osobni identifikacijski broj. Nalazi se u putovnici, na stranici s podacima.',
    paper: [
      'Dobar dan! Ovo je originalni recept liječnika iz druge države Europske unije ili Europskog gospodarskog prostora.',
      'Dobar dan! Ovo je originalni recept liječnika iz druge države.',
      'Možete li mi izdati lijek na ovaj recept?',
    ],
    doctorSends: ['Dobar dan! Moj liječnik može vam poslati recept izravno e-poštom ili telefaksom.', 'Je li to moguće? Na koju adresu ili broj?'],
    pharmacist: 'Može li mi pomoći ljekarnik?',
  },
  pt: {
    lang: 'pt-PT',
    reviewed: false,
    country: 'País',
    ePrescription: ['Bom dia! Tenho uma receita eletrónica emitida noutro país da União Europeia.', 'Por favor, procure-a no sistema de receitas eletrónicas transfronteiriças.', 'Aqui está o meu passaporte ou cartão de identidade.'],
    finnishId: 'Se o sistema pedir um número de seguro, é o meu número de identificação pessoal finlandês. Está na página de dados do passaporte.',
    paper: [
      'Bom dia! Esta é uma receita original de um médico de outro país da União Europeia ou do Espaço Económico Europeu.',
      'Bom dia! Esta é uma receita original de um médico de outro país.',
      'Pode aviá-la?',
    ],
    pharmacist: 'Um farmacêutico pode ajudar-me?',
  },
  es: {
    lang: 'es-ES',
    reviewed: false,
    country: 'País',
    ePrescription: ['¡Buenos días! Tengo una receta electrónica emitida en otro país de la Unión Europea.', 'Por favor, búsquela en el sistema de receta electrónica transfronteriza.', 'Aquí tiene mi pasaporte o documento de identidad.'],
    finnishId: 'Si el sistema pide un número de seguro, es mi código de identidad personal finlandés. Está en la página de datos del pasaporte.',
    paper: [
      '¡Buenos días! Esta es una receta original de un médico de otro país de la Unión Europea o del Espacio Económico Europeo.',
      '¡Buenos días! Esta es una receta original de un médico de otro país.',
      '¿Pueden dispensarla?',
    ],
    pharmacist: '¿Podría ayudarme un farmacéutico?',
  },
  de: {
    lang: 'de',
    reviewed: false,
    country: 'Land',
    ePrescription: ['Guten Tag! Ich habe ein elektronisches Rezept aus einem anderen EU-Land.', 'Bitte rufen Sie es im grenzüberschreitenden E-Rezept-System ab.', 'Hier ist mein Reisepass oder Personalausweis.'],
    paper: ['Guten Tag! Das ist ein Originalrezept von einem Arzt aus einem anderen EU- oder EWR-Land.', 'Guten Tag! Das ist ein Originalrezept von einem Arzt aus einem anderen Land.', 'Können Sie es einlösen?'],
    doctorSends: ['Guten Tag! Mein Arzt kann Ihnen das Rezept direkt per E-Mail oder Fax schicken.', 'Ginge das? An welche Adresse oder Faxnummer?'],
    pharmacist: 'Könnte mir bitte eine Apothekerin oder ein Apotheker helfen?',
  },
  da: {
    lang: 'da',
    reviewed: false,
    country: 'Land',
    paper: ['Goddag! Jeg har en original recept fra en læge i et andet EU- eller EØS-land.', 'Goddag! Jeg har en original recept fra en læge i et andet land.', 'Kan I ekspedere den her?'],
    doctorSends: ['Goddag! Min læge kan sende recepten direkte til jer på fax eller e-mail.', 'Kan det lade sig gøre? Hvilket nummer eller hvilken adresse skal lægen bruge?'],
    pharmacist: 'Kan en farmaceut hjælpe mig?',
  },
  nb: {
    lang: 'nb',
    reviewed: false,
    country: 'Land',
    paper: ['Hei! Dette er en original resept fra en lege i et annet EU- eller EØS-land.', 'Hei! Dette er en original resept fra en lege i et annet land.', 'Kan dere ekspedere den?'],
    doctorSends: ['Hei! Legen min kan sende resepten direkte til dere på e-post eller faks.', 'Går det an? Hvilken adresse eller hvilket nummer skal legen bruke?'],
    pharmacist: 'Kan en farmasøyt hjelpe meg?',
  },
  sv: {
    lang: 'sv',
    reviewed: false,
    country: 'Land',
    paper: ['Hej! Det här är ett originalrecept från en läkare i ett annat EU- eller EES-land.', 'Hej! Det här är ett originalrecept från en läkare i ett annat land.', 'Kan ni expediera det?'],
    pharmacist: 'Kan en farmaceut hjälpa mig?',
  },
  it: {
    lang: 'it',
    reviewed: false,
    country: 'Paese',
    paper: [
      'Buongiorno! Questa è una ricetta originale di un medico di un altro paese dell’Unione europea o dello Spazio economico europeo.',
      'Buongiorno! Questa è una ricetta originale di un medico di un altro paese.',
      'Potete dispensare il farmaco?',
    ],
    doctorSends: ['Buongiorno! Il mio medico può inviarvi la ricetta direttamente per e-mail o fax.', 'È possibile? A quale indirizzo o numero?'],
    pharmacist: 'Potrei parlare con un farmacista?',
  },
  el: {
    lang: 'el',
    reviewed: false,
    country: 'Χώρα',
    ePrescription: ['Καλημέρα! Έχω ηλεκτρονική συνταγή από άλλη χώρα της Ευρωπαϊκής Ένωσης.', 'Παρακαλώ αναζητήστε τη στο σύστημα διασυνοριακής ηλεκτρονικής συνταγογράφησης.', 'Ορίστε το διαβατήριο ή η ταυτότητά μου.'],
    paper: [
      'Καλημέρα! Αυτή είναι πρωτότυπη συνταγή από γιατρό σε άλλη χώρα της Ευρωπαϊκής Ένωσης ή του Ευρωπαϊκού Οικονομικού Χώρου.',
      'Καλημέρα! Αυτή είναι πρωτότυπη συνταγή από γιατρό σε άλλη χώρα.',
      'Μπορείτε να την εκτελέσετε;',
    ],
    pharmacist: 'Θα μπορούσε να με βοηθήσει ένας φαρμακοποιός;',
  },
  hu: {
    lang: 'hu',
    reviewed: false,
    country: 'Ország',
    paper: ['Jó napot kívánok! Ez egy eredeti recept egy másik európai uniós vagy EGT-országbeli orvostól.', 'Jó napot kívánok! Ez egy eredeti recept egy másik országbeli orvostól.', 'Kiadható erre a gyógyszer?'],
    pharmacist: 'Tudna nekem segíteni egy gyógyszerész?',
  },
  sl: {
    lang: 'sl',
    reviewed: false,
    country: 'Država',
    paper: [
      'Dober dan! To je originalni recept zdravnika iz druge države Evropske unije ali Evropskega gospodarskega prostora.',
      'Dober dan! To je originalni recept zdravnika iz druge države.',
      'Ali mi lahko izdate zdravilo na ta recept?',
    ],
    doctorSends: ['Dober dan! Moj zdravnik vam lahko recept pošlje neposredno po e-pošti ali faksu.', 'Ali je to mogoče? Na kateri naslov ali številko?'],
    pharmacist: 'Ali mi lahko pomaga farmacevt?',
  },
  sk: {
    lang: 'sk',
    reviewed: false,
    country: 'Krajina',
    paper: [
      'Dobrý deň! Toto je originál receptu od lekára z inej krajiny Európskej únie alebo Európskeho hospodárskeho priestoru.',
      'Dobrý deň! Toto je originál receptu od lekára z inej krajiny.',
      'Môžete mi naň vydať liek?',
    ],
    doctorSends: ['Dobrý deň! Môj lekár vám môže poslať recept priamo e-mailom alebo faxom.', 'Je to možné? Na akú adresu alebo číslo?'],
    pharmacist: 'Mohol by mi pomôcť lekárnik?',
  },
};

/** A country's name in a language, as the Unicode consortium has it. Undefined for a code that is no country. */
export function countryName(code: string | undefined, lang: string): string | undefined {
  if (!code || !/^[A-Z]{2}$/.test(code) || code === 'XX') return undefined;
  try {
    const name = new Intl.DisplayNames([lang], { type: 'region', fallback: 'none' }).of(code);
    return name || undefined;
  } catch {
    return undefined;
  }
}

/** One variant's lines in one language. `home`: the country the prescription is from, when the list knows it. */
function lines(language: LanguagePhrases, variant: CardVariant, home: { code?: string; eea: boolean }): string[] | undefined {
  const name = countryName(home.code, language.lang);
  const from = name ? `${language.country}: ${name}.` : undefined;
  if (variant === 'ePrescription') {
    if (!language.ePrescription) return undefined;
    const [have, look, id] = language.ePrescription;
    return [have, [look, from].filter(Boolean).join(' '), (home.code === 'FI' && language.finnishId) || id];
  }
  if (variant === 'paper') {
    const [eea, other, ask] = language.paper;
    return [home.eea ? eea : other, [from, ask].filter(Boolean).join(' ')];
  }
  return language.doctorSends;
}

/**
 * The card for one pair: the lines in the pharmacy's language, and the same in English under
 * them. A variant the language has no lines for is left out.
 */
export function cardFor(languageKey: string, variants: CardVariant[], home: { code?: string; eea: boolean }): CardPhrases | undefined {
  const language = PHRASES[languageKey];
  if (!language) return undefined;
  const offered: CardPhrases['variants'] = {};
  for (const variant of variants) {
    const local = lines(language, variant, home);
    const english = lines(PHRASES.en, variant, home);
    if (local && english) offered[variant] = { local, english: english.join(' ') };
  }
  return { lang: language.lang, reviewed: language.reviewed, variants: offered, pharmacist: { local: language.pharmacist, english: PHRASES.en.pharmacist } };
}
