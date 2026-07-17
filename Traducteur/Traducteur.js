import { translate as googleTranslate } from '@vitalets/google-translate-api';

export async function init () {
    await Avatar.lang.addPluginPak('Traducteur');
}

export async function action(data, callback) {
    try {

        const L = await Avatar.lang.getPak('Traducteur', data.language);

        const tblActions = {
            translate: () => translate(data, data.client, L)
        };

        info("Traducteur:", data.action.command, "from", data.client);

        if (tblActions[data.action.command]) {
            await tblActions[data.action.command]();
        }

    } catch (err) {
        if (data.client) Avatar.Speech.end(data.client);
        if (err.message) error(err.message);
    } finally {
        callback();
    }
}

const translate = async (data, client, L) => {

    const languageLabel = Config.modules.Traducteur.languageLabel;

    const sentence = data.rawSentence || data.action.sentence || "";

    if (!sentence) {
        infoOrange(L.get("speech.empty"));
        return Avatar.speak(L.get("speech.empty"), client, () => {
            Avatar.Speech.end(client);
        });
    }

    let rawSentence = sentence.toLowerCase().trim();

    let targetLang = "en";
    let labelLangue = "en anglais";

    // Liste des langues (sans le flag 'g' pour éviter le bug du lastIndex)
    const languages = [
        { regex: /\ben anglais\b/i, code: "en", label: "en anglais" },
        { regex: /\ben allemand\b/i, code: "de", label: "en allemand" },
        { regex: /\ben italien\b/i, code: "it", label: "en italien" },
        { regex: /\ben espagnol(e)?\b/i, code: "es", label: "en espagnol" },
        { regex: /\ben portugais\b/i, code: "pt", label: "en portugais" },
        { regex: /\ben arabe\b/i, code: "ar", label: "en arabe" },
        { regex: /\ben chinois\b/i, code: "zh-CN", label: "en chinois" },
        { regex: /\ben japonais\b/i, code: "ja", label: "en japonais" },
        { regex: /\ben russe\b/i, code: "ru", label: "en russe" },
        { regex: /\ben néerlandais\b/i, code: "nl", label: "en néerlandais" },
        { regex: /\ben coréen\b/i, code: "ko", label: "en coréen" }
    ];

    // 1. On cherche et on extrait la langue cible
    for (const lang of languages) {
        if (lang.regex.test(rawSentence)) {
            targetLang = lang.code;
            labelLangue = lang.label;
            rawSentence = rawSentence.replace(lang.regex, "");
            break;
        }
    }

    rawSentence = rawSentence.replace(/\b(traduis-moi|traduis moi|traduis|traduire|traduit|traduction)\b/gi, "");
    rawSentence = rawSentence.replace(/^\s*(le mot|la phrase|de|du|en)\s+/i, "");
    rawSentence = rawSentence.replace(/\s+/g, " ").replace(/^[,.;:!? ]+|[,.;:!? ]+$/g, "").trim();

    if (!rawSentence) {
        infoOrange("Je n'ai pas trouvé le texte à traduire.");
        return Avatar.speak(L.get("speech.notext"), client, () => {
            Avatar.Speech.end(client);
        });
    }

    try {
    
        const res = await googleTranslate(rawSentence, { from: languageLabel, to: targetLang });

        const textTranslate = L.get(["speech.translate", labelLangue, res.text]);

        infoGreen(textTranslate);

        Avatar.speak(textTranslate, client, () => {
            Avatar.Speech.end(client);
        });

    } catch (err) {
        error("Erreur Google Translate :", err.message || err);
        Avatar.speak(L.get("speech.error"), client, () => {
            Avatar.Speech.end(client);
        });
    }
};
