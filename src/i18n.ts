import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';

import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

/** Languages offered in the switchers; `flag` is the flagcdn.com country code. */
export const LANGUAGES = [
    { code: 'it', flag: 'it', label: 'Italiano' },
    { code: 'en', flag: 'gb', label: 'English' },
    { code: 'de', flag: 'de', label: 'Deutsch' },
] as const;

i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        lng: 'it', // La lingua predefinita
        fallbackLng: 'it', // Lingua di fallback
        supportedLngs: LANGUAGES.map((l) => l.code),
        debug: false,

        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },

    resources: {
        en: {
            translation: {
                // hero
                title_highlighted: "Green thumb",
                subtitle: "without having to lift a finger",
                // navbar
                about: "About",
                work: "Work",
                contact: "Contact",
                projects: "Projects",
                // about
                intro_subtitle: "INTRODUCTION",
                intro_title: "How it works",
                intro_text: "SmartPlants can measure the moisture level in the soil, and decide when it is time to water your favourite plant. "
                + "The system is fully customisable and expandable: the ESP8266 chip can be connected to various sensors, capable of acquiring data such as temperature, light, etc., and can communicate the acquired data via a screen or a Bluetooth or WiFi connection.",
                // cards
                card1: "Automatic irrigation",
                card2: "Compatible with every plant", 
                card3: "Expandable and customizable", 
                card4: "Wireless connectivity",
                // work 
                work_subtitle: "PROJECTS",
                work_title: "Some ideas",
                work_text: 'Below are some of the projects carried out so far, the list is constantly being updated. For custom projects, please visit the profile ',
                project1: "Irrigation system with humidity sensor",
                project2: "Customised system with moisture indicators, buzzer and screen",
                project3: "Chip, sensor and water pump: use your favourite plant!",
                // contact
                contact_subtitle: "GET IN TOUCH",
                contact_title: "Contact",
                contact_name: "Your name", 
                contact_email: "Your email address", 
                contact_message: "Your message",
                contact_send: "Send",
                contact_sending: "Sending...",
                // footer
                footer_text: "A DIY plant-care system: an ESP8266 that measures the soil and waters your plant, with a live dashboard.",
                footer_links: "Useful links",
                dashboard: "Dashboard",
                dashboard_demo: "Demo dashboard",
                source_code: "Source code",
                firmware: "Firmware",
                dash_moisture: "Soil moisture",
                dash_level_dry: "Dry: the board is watering",
                dash_level_warning: "Getting dry",
                dash_level_ok: "Well watered",
                dash_board: "Board",
                dash_online: "Online",
                dash_offline: "Offline",
                dash_last_seen: "Last reading",
                dash_never: "never",
                dash_pump: "Pump",
                dash_pump_on: "Running",
                dash_pump_off: "Off",
                dash_thresholds: "Dry / warning thresholds",
                dash_environment: "Environment",
                dash_no_sensor: "No light sensor",
                dash_history: "Last 24 hours",
                dash_no_history: "No readings in the last 24 hours.",
                dash_controls: "Controls",
                dash_login_hint: "Watering and thresholds are for the owner. The readings above are public.",
                dash_sign_in: "Sign in",
                dash_sign_out: "Sign out",
                dash_signed_in: "Signed in.",
                dash_water_hint: "Run the pump once, for 3 seconds.",
                dash_water_now: "Water now",
                dash_water_sent: "Sent: the board waters at its next sync.",
                dash_dry_threshold: "Dry below (%)",
                dash_warning_threshold: "Warning below (%)",
                dash_save: "Save thresholds",
                dash_thresholds_saved: "Thresholds saved: the board picks them up at its next sync.",
                dash_error_thresholds_order: "The dry threshold must be lower than the warning one.",
                dash_error_thresholds_range: "Use whole numbers between 0 and 100.",
                dash_error_action: "That did not work. Try again.",
                dash_error_load: "Could not load the dashboard. Try again later.",
                dash_loading: "Loading…",
                dash_empty: "No board registered yet.",
                dash_demo_banner: "Demo with simulated data: the plant dries out, the pump kicks in, and the controls change the simulation.",
                dash_fallback_banner: "Live data is not configured here, so this shows simulated data.",
                dash_go_demo: "Demo",
                dash_go_live: "Live plant",
                copyright: "© 2023–2026 Stefano D'Ambrosio"
            }
        },
        de: {
            translation: {
                // hero
                title_highlighted: "Grüner Daumen",
                subtitle: "ohne einen Finger zu rühren",
                // navbar
                about: "So funktioniert's",
                work: "Arbeit",
                contact: "Kontakt",
                projects: "Projekte",
                // about
                intro_subtitle: "EINFÜHRUNG",
                intro_title: "Funktionen",
                intro_text: "SmartPlants misst die Feuchtigkeit der Erde und entscheidet, wann deine Lieblingspflanze gegossen werden muss. "
                + "Das System ist vollständig anpassbar und erweiterbar: Der ESP8266-Chip lässt sich mit verschiedenen Sensoren verbinden, etwa für Temperatur oder Licht, und kann die Messwerte über ein Display, Bluetooth oder WLAN ausgeben.",
                // cards
                card1: "Automatische Bewässerung",
                card2: "Für jede Pflanze geeignet",
                card3: "Erweiterbar und anpassbar",
                card4: "Drahtlose Verbindung",
                // work
                work_subtitle: "PROJEKTE",
                work_title: "Einige Ideen",
                work_text: "Hier sind einige der bisher umgesetzten Projekte, die Liste wird laufend ergänzt. Für individuelle Projekte besuche das Profil auf ",
                project1: "Bewässerungssystem mit Feuchtigkeitssensor",
                project2: "Individuelles System mit Feuchtigkeitsanzeige, Summer und Display",
                project3: "Chip, Sensor und Wasserpumpe: für jede Pflanze, die du magst!",
                // contact
                contact_subtitle: "KONTAKT",
                contact_title: "Schreib mir",
                contact_name: "Dein Name",
                contact_email: "Deine E-Mail-Adresse",
                contact_message: "Deine Nachricht",
                contact_send: "Senden",
                contact_sending: "Wird gesendet...",
                // footer
                footer_text: "Ein DIY-System zur Pflanzenpflege: ein ESP8266, der die Erde misst und deine Pflanze gießt, mit einem Live-Dashboard.",
                footer_links: "Nützliche Links",
                dashboard: "Dashboard",
                dashboard_demo: "Demo-Dashboard",
                source_code: "Quellcode",
                firmware: "Firmware",
                dash_moisture: "Bodenfeuchtigkeit",
                dash_level_dry: "Trocken: das Board gießt",
                dash_level_warning: "Wird trocken",
                dash_level_ok: "Gut gegossen",
                dash_board: "Board",
                dash_online: "Online",
                dash_offline: "Offline",
                dash_last_seen: "Letzte Messung",
                dash_never: "nie",
                dash_pump: "Pumpe",
                dash_pump_on: "Läuft",
                dash_pump_off: "Aus",
                dash_thresholds: "Schwellen trocken / Warnung",
                dash_environment: "Umgebung",
                dash_no_sensor: "Kein Lichtsensor",
                dash_history: "Letzte 24 Stunden",
                dash_no_history: "Keine Messungen in den letzten 24 Stunden.",
                dash_controls: "Steuerung",
                dash_login_hint: "Gießen und Schwellen sind dem Besitzer vorbehalten. Die Messwerte oben sind öffentlich.",
                dash_sign_in: "Anmelden",
                dash_sign_out: "Abmelden",
                dash_signed_in: "Angemeldet.",
                dash_water_hint: "Schaltet die Pumpe einmal für 3 Sekunden ein.",
                dash_water_now: "Jetzt gießen",
                dash_water_sent: "Gesendet: das Board gießt bei der nächsten Synchronisierung.",
                dash_dry_threshold: "Trocken unter (%)",
                dash_warning_threshold: "Warnung unter (%)",
                dash_save: "Schwellen speichern",
                dash_thresholds_saved: "Schwellen gespeichert: das Board übernimmt sie bei der nächsten Synchronisierung.",
                dash_error_thresholds_order: "Die Trocken-Schwelle muss niedriger sein als die Warnschwelle.",
                dash_error_thresholds_range: "Verwende ganze Zahlen zwischen 0 und 100.",
                dash_error_action: "Das hat nicht geklappt. Versuch es noch einmal.",
                dash_error_load: "Das Dashboard konnte nicht geladen werden. Versuch es später noch einmal.",
                dash_loading: "Wird geladen…",
                dash_empty: "Noch kein Board registriert.",
                dash_demo_banner: "Demo mit simulierten Daten: die Pflanze trocknet aus, die Pumpe springt an, und die Steuerung verändert die Simulation.",
                dash_fallback_banner: "Live-Daten sind hier nicht eingerichtet, daher siehst du simulierte Daten.",
                dash_go_demo: "Demo",
                dash_go_live: "Echte Pflanze",
                copyright: "© 2023–2026 Stefano D'Ambrosio"
            }
        },
        it: {
            translation: {
                // hero
                title_highlighted: "Pollice verde",
                subtitle: "senza alzare un dito",
                // navbar
                about: "Come funziona",
                work: "Lavoro",
                contact: "Contatti",
                projects: "Progetti",
                // about
                intro_subtitle: "INTRODUZIONE",
                intro_title: "Funzionalità",
                intro_text: "SmartPlants è in grado di misurare il livello di umidità del terreno, e decidere quanto è ora di annaffiare la tua pianta preferita. "
                + "Il sistema è totalmente personalizzabile ed espandibile: il chip ESP8266 può essere collegato a vari sensori, in grado di acquisire dati come temperatura, luce, ecc. e può comunicare i dati acquisiti attraverso uno schermo oppure una connessione Bluetooth o WiFi.",
                // + "Infine, è possibile controllare i vari componenti da remoto grazie alla connettività wireless.",
                // cards
                card1: "Irrigazione automatica",
                card2: "Compatibile con ogni pianta", 
                card3: "Espandibile e personalizzabile", 
                card4: "Connettività wireless",
                // work
                work_subtitle: "PROGETTI",
                work_title: "Alcune idee",
                work_text: "Di seguito riporto alcuni progetti eseguiti fino ad ora, la lista è in continuo aggiornamento. Per la realizzazione di progetti custom, è possibile visitare il profilo ",
                project1: "Sistema di irrigazione con sensore di umidità",
                project2: "Sistema custom con indicatori di umidità, buzzer e schermo",
                project3: "Chip, sensore e pompa dell'acqua: usa la pianta che preferisci!",
                // contact
                contact_subtitle: "CONTATTI",
                contact_title: "Scrivimi",
                contact_name: "Il tuo nome",
                contact_email: "La tua email",
                contact_message: "Il tuo messaggio",
                contact_send: "Invia",
                contact_sending: "Invio...",
                // footer
                footer_text: "Un sistema fai da te per la cura delle piante: un ESP8266 che misura il terreno e annaffia la tua pianta, con una dashboard dal vivo.",
                footer_links: "Link utili",
                dashboard: "Dashboard",
                dashboard_demo: "Dashboard demo",
                source_code: "Codice sorgente",
                firmware: "Firmware",
                dash_moisture: "Umidità del terreno",
                dash_level_dry: "Secco: la scheda sta annaffiando",
                dash_level_warning: "Si sta asciugando",
                dash_level_ok: "Ben annaffiata",
                dash_board: "Scheda",
                dash_online: "Online",
                dash_offline: "Offline",
                dash_last_seen: "Ultima lettura",
                dash_never: "mai",
                dash_pump: "Pompa",
                dash_pump_on: "Accesa",
                dash_pump_off: "Spenta",
                dash_thresholds: "Soglie secco / attenzione",
                dash_environment: "Ambiente",
                dash_no_sensor: "Nessun sensore di luce",
                dash_history: "Ultime 24 ore",
                dash_no_history: "Nessuna lettura nelle ultime 24 ore.",
                dash_controls: "Controlli",
                dash_login_hint: "Annaffiatura e soglie sono riservate al proprietario. Le letture qui sopra sono pubbliche.",
                dash_sign_in: "Accedi",
                dash_sign_out: "Esci",
                dash_signed_in: "Accesso effettuato.",
                dash_water_hint: "Accende la pompa una volta, per 3 secondi.",
                dash_water_now: "Annaffia ora",
                dash_water_sent: "Inviato: la scheda annaffia alla prossima sincronizzazione.",
                dash_dry_threshold: "Secco sotto il (%)",
                dash_warning_threshold: "Attenzione sotto il (%)",
                dash_save: "Salva soglie",
                dash_thresholds_saved: "Soglie salvate: la scheda le riceve alla prossima sincronizzazione.",
                dash_error_thresholds_order: "La soglia di secco deve essere più bassa di quella di attenzione.",
                dash_error_thresholds_range: "Usa numeri interi tra 0 e 100.",
                dash_error_action: "Non ha funzionato. Riprova.",
                dash_error_load: "Impossibile caricare la dashboard. Riprova più tardi.",
                dash_loading: "Caricamento…",
                dash_empty: "Nessuna scheda registrata.",
                dash_demo_banner: "Demo con dati simulati: la pianta si asciuga, la pompa interviene e i controlli modificano la simulazione.",
                dash_fallback_banner: "I dati dal vivo non sono configurati qui, quindi vedi dati simulati.",
                dash_go_demo: "Demo",
                dash_go_live: "Pianta dal vivo",
                copyright: "© 2023–2026 Stefano D'Ambrosio"
            }
        }
    }
});

export default i18n;