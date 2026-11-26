/**
 * The counter card's lines, by language (PLAN.md section 8.3). One set of English master
 * lines, and the same lines in the language of the country the user is in.
 *
 * Every translation here is a draft: `reviewed` is false, and the card says so on its face
 * ("Käännös tarkistamatta"). The Polish, Czech, Latvian, German and Danish lines started
 * from what was said at the counter on the trip; none has had a native check. A language
 * moves to `reviewed: true` only when a native speaker has read the lines as they stand here.
 *
 * No medicine is named, and nothing here asks for a medicine without its prescription.
 */

import type { CardVariant } from '../../lib/types';

interface Lines {
  /** Shown large, one sentence or two per line. */
  local: string[];
  english: string;
}

export interface LanguagePhrases {
  /** BCP 47 tag, for the `lang` attribute. */
  lang: string;
  reviewed: boolean;
  variants: Partial<Record<CardVariant, string[]>>;
  /** "Could a pharmacist help me with this?" */
  pharmacist: string;
}

/** The English under every card, and the card itself where English is the pharmacy's language. */
export const ENGLISH: Record<CardVariant, string> & { pharmacist: string } = {
  ePrescription:
    'Hello. I have a Finnish e-prescription. Please look it up in the cross-border e-prescription system. Country: Finland. If the system asks for an insurance number, it is my Finnish personal identity code, on my passport’s data page.',
  paper: 'Hello. This is an original prescription from a doctor in Finland, in the EU. Can you dispense it?',
  doctorSends: 'Hello. My doctor in Finland can send the prescription straight to you by email or fax. Would that work? Which address or number should they use?',
  pharmacist: 'Could a pharmacist help me with this?',
};

export const PHRASES: Record<string, LanguagePhrases> = {
  et: {
    lang: 'et',
    reviewed: false,
    variants: {
      ePrescription: [
        'Tere! Mul on Soome e-retsept.',
        'Palun otsige see piiriülese e-retsepti süsteemist. Riik: Soome.',
        'Kui süsteem küsib kindlustusnumbrit, siis see on minu Soome isikukood. See on passi andmelehel.',
      ],
      paper: ['Tere! See on originaalretsept, mille on kirjutanud arst Soomes, Euroopa Liidus.', 'Kas saate selle alusel ravimi väljastada?'],
    },
    pharmacist: 'Kas proviisor saaks mind aidata?',
  },
  lv: {
    lang: 'lv',
    reviewed: false,
    variants: {
      ePrescription: [
        'Labdien! Man ir Somijas e-recepte.',
        'Lūdzu, atrodiet to pārrobežu e-receptes sistēmā. Valsts: Somija.',
        'Ja sistēma prasa apdrošināšanas numuru, tas ir mans Somijas personas kods. Tas ir pases datu lapā.',
      ],
      paper: ['Labdien! Šī ir oriģināla recepte, ko izrakstījis ārsts Somijā, Eiropas Savienībā.', 'Vai varat izsniegt zāles pēc šīs receptes?'],
    },
    pharmacist: 'Vai farmaceits varētu man palīdzēt?',
  },
  lt: {
    lang: 'lt',
    reviewed: false,
    variants: {
      ePrescription: [
        'Laba diena! Turiu suomišką e. receptą.',
        'Prašau surasti jį tarpvalstybinėje e. receptų sistemoje. Šalis: Suomija.',
        'Jei sistema prašo draudimo numerio, tai mano suomiškas asmens kodas. Jis yra paso duomenų puslapyje.',
      ],
      paper: ['Laba diena! Tai originalus receptas, kurį išrašė gydytojas Suomijoje, Europos Sąjungoje.', 'Ar galite pagal jį išduoti vaistus?'],
    },
    pharmacist: 'Ar galėtų man padėti vaistininkas?',
  },
  pl: {
    lang: 'pl',
    reviewed: false,
    variants: {
      ePrescription: [
        'Dzień dobry! Mam fińską e-receptę.',
        'Proszę sprawdzić ją w systemie e-recepty transgranicznej. Kraj: Finlandia.',
        'Jeśli system pyta o numer ubezpieczenia, to jest mój fiński numer identyfikacyjny. Jest w paszporcie, na stronie z danymi.',
      ],
      paper: ['Dzień dobry! To jest oryginalna recepta od lekarza z Finlandii, z Unii Europejskiej.', 'Czy można ją tutaj zrealizować?'],
    },
    pharmacist: 'Czy mogę prosić o pomoc farmaceuty?',
  },
  cs: {
    lang: 'cs',
    reviewed: false,
    variants: {
      ePrescription: [
        'Dobrý den! Mám finský elektronický recept.',
        'Vyhledejte ho prosím v systému přeshraničního eReceptu. Země: Finsko.',
        'Pokud systém žádá číslo pojištěnce, je to moje finské osobní identifikační číslo. Je v pasu na stránce s osobními údaji.',
      ],
      paper: ['Dobrý den! Toto je originál receptu od lékaře z Finska, z Evropské unie.', 'Můžete mi na něj lék vydat?'],
    },
    pharmacist: 'Mohl by mi s tím pomoci lékárník?',
  },
  hr: {
    lang: 'hr',
    reviewed: false,
    variants: {
      ePrescription: [
        'Dobar dan! Imam finski e-recept.',
        'Molim vas, potražite ga u sustavu prekograničnog e-recepta. Država: Finska.',
        'Ako sustav traži broj osiguranja, to je moj finski osobni identifikacijski broj. Nalazi se u putovnici, na stranici s podacima.',
      ],
      paper: ['Dobar dan! Ovo je originalni recept liječnika iz Finske, iz Europske unije.', 'Možete li mi izdati lijek na ovaj recept?'],
      doctorSends: ['Dobar dan! Moj liječnik u Finskoj može vam poslati recept izravno e-poštom ili telefaksom.', 'Je li to moguće? Na koju adresu ili broj?'],
    },
    pharmacist: 'Može li mi pomoći ljekarnik?',
  },
  pt: {
    lang: 'pt-PT',
    reviewed: false,
    variants: {
      ePrescription: [
        'Bom dia! Tenho uma receita eletrónica finlandesa.',
        'Por favor, procure-a no sistema de receitas eletrónicas transfronteiriças. País: Finlândia.',
        'Se o sistema pedir um número de seguro, é o meu número de identificação pessoal finlandês. Está na página de dados do passaporte.',
      ],
      paper: ['Bom dia! Esta é uma receita original de um médico da Finlândia, na União Europeia.', 'Pode aviá-la?'],
    },
    pharmacist: 'Um farmacêutico pode ajudar-me?',
  },
  es: {
    lang: 'es-ES',
    reviewed: false,
    variants: {
      ePrescription: [
        '¡Buenos días! Tengo una receta electrónica finlandesa.',
        'Por favor, búsquela en el sistema de receta electrónica transfronteriza. País: Finlandia.',
        'Si el sistema pide un número de seguro, es mi código de identidad personal finlandés. Está en la página de datos del pasaporte.',
      ],
      paper: ['¡Buenos días! Esta es una receta original de un médico de Finlandia, de la Unión Europea.', '¿Pueden dispensarla?'],
    },
    pharmacist: '¿Podría ayudarme un farmacéutico?',
  },
  de: {
    lang: 'de',
    reviewed: false,
    variants: {
      paper: ['Guten Tag! Das ist ein Originalrezept von einem Arzt in Finnland, in der EU.', 'Können Sie es einlösen?'],
      doctorSends: ['Guten Tag! Mein Arzt in Finnland kann Ihnen das Rezept direkt per E-Mail oder Fax schicken.', 'Ginge das? An welche Adresse oder Faxnummer?'],
    },
    pharmacist: 'Könnte mir bitte eine Apothekerin oder ein Apotheker helfen?',
  },
  da: {
    lang: 'da',
    reviewed: false,
    variants: {
      paper: ['Goddag! Jeg har en original recept fra en læge i Finland, i EU.', 'Kan I ekspedere den her?'],
      doctorSends: ['Goddag! Min læge i Finland kan sende recepten direkte til jer på fax eller e-mail.', 'Kan det lade sig gøre? Hvilket nummer eller hvilken adresse skal lægen bruge?'],
    },
    pharmacist: 'Kan en farmaceut hjælpe mig?',
  },
  nb: {
    lang: 'nb',
    reviewed: false,
    variants: {
      paper: ['Hei! Dette er en original resept fra en lege i Finland.', 'Kan dere ekspedere den?'],
      doctorSends: ['Hei! Legen min i Finland kan sende resepten direkte til dere på e-post eller faks.', 'Går det an? Hvilken adresse eller hvilket nummer skal legen bruke?'],
    },
    pharmacist: 'Kan en farmasøyt hjelpe meg?',
  },
  sv: {
    lang: 'sv',
    reviewed: false,
    variants: {
      paper: ['Hej! Det här är ett originalrecept från en läkare i Finland, i EU.', 'Kan ni expediera det?'],
    },
    pharmacist: 'Kan en farmaceut hjälpa mig?',
  },
  it: {
    lang: 'it',
    reviewed: false,
    variants: {
      paper: ['Buongiorno! Questa è una ricetta originale di un medico finlandese, dell’Unione europea.', 'Potete dispensare il farmaco?'],
      doctorSends: ['Buongiorno! Il mio medico in Finlandia può inviarvi la ricetta direttamente per e-mail o fax.', 'È possibile? A quale indirizzo o numero?'],
    },
    pharmacist: 'Potrei parlare con un farmacista?',
  },
  el: {
    lang: 'el',
    reviewed: false,
    variants: {
      paper: ['Καλημέρα! Αυτή είναι πρωτότυπη συνταγή από γιατρό στη Φινλανδία, στην Ευρωπαϊκή Ένωση.', 'Μπορείτε να την εκτελέσετε;'],
    },
    pharmacist: 'Θα μπορούσε να με βοηθήσει ένας φαρμακοποιός;',
  },
  hu: {
    lang: 'hu',
    reviewed: false,
    variants: {
      paper: ['Jó napot kívánok! Ez egy eredeti recept egy finnországi orvostól, az Európai Unióból.', 'Kiadható erre a gyógyszer?'],
    },
    pharmacist: 'Tudna nekem segíteni egy gyógyszerész?',
  },
  sl: {
    lang: 'sl',
    reviewed: false,
    variants: {
      paper: ['Dober dan! To je originalni recept zdravnika s Finske, iz Evropske unije.', 'Ali mi lahko izdate zdravilo na ta recept?'],
      doctorSends: ['Dober dan! Moj zdravnik na Finskem vam lahko recept pošlje neposredno po e-pošti ali faksu.', 'Ali je to mogoče? Na kateri naslov ali številko?'],
    },
    pharmacist: 'Ali mi lahko pomaga farmacevt?',
  },
  sk: {
    lang: 'sk',
    reviewed: false,
    variants: {
      paper: ['Dobrý deň! Toto je originál receptu od lekára z Fínska, z Európskej únie.', 'Môžete mi naň vydať liek?'],
      doctorSends: ['Dobrý deň! Môj lekár vo Fínsku vám môže poslať recept priamo e-mailom alebo faxom.', 'Je to možné? Na akú adresu alebo číslo?'],
    },
    pharmacist: 'Mohol by mi pomôcť lekárnik?',
  },
  // Malta: English is an official language and the language of its pharmacies. The card is the master lines themselves.
  en: {
    lang: 'en',
    reviewed: true,
    variants: {
      paper: ['Hello! This is an original prescription from a doctor in Finland, in the EU.', 'Can you dispense it?'],
    },
    pharmacist: 'Could a pharmacist help me with this?',
  },
};

/** One variant of a language's card as the card shows it: the local lines and the English under them. */
export function linesFor(language: LanguagePhrases, variant: CardVariant): Lines | undefined {
  const local = language.variants[variant];
  return local ? { local, english: ENGLISH[variant] } : undefined;
}
