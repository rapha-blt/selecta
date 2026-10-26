/**
 * Sélecta : ce que voit le code d'une extension JavaScript ou TypeScript,
 * et la forme de sa configuration (Config.yaml, Config.json, en-tête d'un
 * snippet). Guide : https://rapha-blt.github.io/selecta/extensions/
 *
 * Usage : copiez ce fichier à côté de vos scripts, puis mettez en première
 * ligne d'un script `/// <reference path="selecta.d.ts" />`. Pour que
 * l'éditeur ne propose pas les fonctions d'un navigateur (document, window…),
 * ajoutez dans le même dossier un jsconfig.json (tsconfig.json pour du
 * TypeScript) qui n'inclut pas la bibliothèque DOM :
 *
 *     { "compilerOptions": { "target": "es2023", "lib": ["es2023"], "checkJs": true } }
 *
 * Sélecta enveloppe le code dans une fonction `async` : l'éditeur peut
 * souligner un `return` ou un `await` au premier niveau, ce n'est pas une
 * erreur pour Sélecta.
 */

declare namespace Selecta {
    // MARK: - Script

    /** La sélection, lue au clic. */
    interface Input {
        /** Le texte sélectionné, entier. */
        readonly text: string;
        /** Le texte reconnu par la `regex` de l'action, sinon la sélection entière. */
        readonly matchedText: string;
        /**
         * La correspondance de la `regex` (indice 0) puis ses groupes, `""`
         * pour un groupe vide. Absent sans `regex`.
         */
        readonly regexResult?: readonly string[];
        /**
         * La sélection en HTML, quand l'app donne sa mise en forme. Lu
         * seulement si le code contient le mot `html`.
         */
        readonly html?: string;
        /**
         * La sélection en Markdown (gras, italique, liens, code). Lu
         * seulement si le code contient le mot `markdown`.
         */
        readonly markdown?: string;
        /** Ce que Sélecta a reconnu dans la sélection. */
        readonly data: {
            readonly urls: readonly string[];
            readonly emails: readonly string[];
            readonly paths: readonly string[];
        };
    }

    /** L'app où est la sélection. */
    interface Context {
        /** Son nom, par exemple « TextEdit ». */
        readonly appName: string;
        /** Son identifiant, par exemple `com.apple.TextEdit`. */
        readonly appIdentifier?: string;
        /**
         * L'adresse de la page, dans un navigateur. Lue seulement si le code
         * contient le mot `browserUrl`.
         */
        readonly browserUrl?: string;
        /** La sélection est dans un champ modifiable. */
        readonly canPaste: boolean;
        /** La sélection peut être copiée. */
        readonly canCopy: boolean;
    }

    /**
     * Les valeurs des options de l'instance, par identifiant : un booléen
     * pour `boolean`, un texte sinon (`""` pour un secret pas encore renseigné).
     */
    interface Options {
        readonly [identifier: string]: string | boolean;
    }

    interface Sel {
        readonly input: Input;
        readonly context: Context;
        readonly options: Options;

        /** Met le texte dans le presse-papiers. */
        copyText(text: string): Promise<void>;
        /** Remplace la sélection par le texte ; hors d'un champ modifiable, le copie. */
        pasteText(text: string): Promise<void>;
        /**
         * Affiche le texte dans la barre à la fin du script, si `after`
         * n'affiche rien lui-même.
         */
        showText(text: string): void;
        /** Affiche une coche à la fin du script, si `after` n'affiche rien lui-même. */
        showSuccess(): void;
        /**
         * Fait échouer l'action : rien n'est collé ni copié, la barre affiche
         * une croix et le message s'il y en a un. L'emporte sur tout.
         */
        showFailure(message?: string): void;
        /** Ouvre l'adresse, qui doit avoir un schéma (`https:`, `mailto:`…). */
        openUrl(url: string): Promise<void>;
        /** Tape une combinaison de touches, comme `keyCombo` : `"command shift k"`. */
        pressKey(combo: string): Promise<void>;
        /**
         * Envoie le texte (par défaut `input.matchedText`) à un service macOS,
         * nommé en anglais comme l'app le déclare. Renvoie son texte, ou `null`.
         */
        performService(name: string, text?: string): Promise<string | null>;
        /**
         * Lance un Raccourci avec ce texte en entrée (par défaut
         * `input.matchedText`). Renvoie sa sortie, ou `null`.
         */
        runShortcut(name: string, input?: string): Promise<string | null>;
        /**
         * Lance un AppleScript qui reçoit `selectaText` (par défaut
         * `input.matchedText`) et `selectaOptions`. Entitlement `applescript`.
         * Renvoie sa sortie, ou `null`.
         */
        runAppleScript(source: string, text?: string): Promise<string | null>;
        /**
         * Lance un script Shell (`/bin/zsh` sauf shebang) qui reçoit
         * `SELECTA_TEXT` (par défaut `input.matchedText`) et
         * `SELECTA_OPTION_<ID>`, dans le dossier de l'extension.
         * Entitlement `shell`. Renvoie sa sortie standard, ou `null`.
         */
        runShellScript(source: string, text?: string): Promise<string | null>;
    }

    interface FetchOptions {
        /** `GET` par défaut. */
        method?: string;
        headers?: { [name: string]: string };
        /** Un texte : passez par `JSON.stringify` pour un objet. */
        body?: string;
    }

    interface Response {
        /** L'adresse finale, après redirections. */
        readonly url: string;
        readonly status: number;
        readonly statusText: string;
        /** `true` pour un code de 200 à 299. */
        readonly ok: boolean;
        /** Noms en minuscules : `headers["content-type"]`. */
        readonly headers: { readonly [name: string]: string };
        text(): Promise<string>;
        /** Rejetée si le corps n'est pas du JSON. */
        json(): Promise<any>;
    }

    interface Util {
        readonly base64: {
            /** Encode le texte (UTF-8) en base64. */
            encode(text: string): string;
            /** Décode en texte UTF-8 ; lève une erreur si ce n'est pas du base64 de texte. */
            decode(base64: string): string;
        };
        /** Empreintes du texte (UTF-8), en hexadécimal minuscule. */
        readonly hash: {
            sha256(text: string): string;
            sha1(text: string): string;
            md5(text: string): string;
        };
    }

    // MARK: - Configuration

    /** Une valeur seule ou une liste. */
    type OneOrMany<T> = T | T[];

    type RequirementName = "text" | "copy" | "paste" | "url" | "email" | "path";
    /** `!` devant une condition la renverse. */
    type Requirement = RequirementName | `!${RequirementName}`;

    type BeforeStep = "copy";
    type AfterStep = "copy" | "paste-result" | "show-result" | "show-status" | "preview-result";
    type Entitlement = "network" | "applescript" | "shell";

    /**
     * `symbol:nom` (SF Symbol), `text:Abc` (6 caractères au plus), ou le
     * chemin d'une image du paquet (png, pdf, svg, jpg, jpeg, heic, tiff).
     */
    type Icon = `symbol:${string}` | `text:${string}` | (string & {});

    /** Clés libres, ignorées par Sélecta. */
    interface Extra {
        [key: `x-${string}`]: unknown;
    }

    interface OptionBase extends Extra {
        /** Une lettre, puis des lettres, chiffres, `_` ou `-`. */
        identifier: string;
        /** Libellé du réglage ; l'identifiant par défaut. */
        label?: string;
        /** Aide affichée sous le réglage. */
        description?: string;
    }

    interface StringOption extends OptionBase {
        type?: "string";
        defaultValue?: string;
    }

    interface BooleanOption extends OptionBase {
        type: "boolean";
        /** `false` par défaut. */
        defaultValue?: boolean;
    }

    interface MultipleOption extends OptionBase {
        type: "multiple";
        values: string[];
        /** Le premier des `values` par défaut. */
        defaultValue?: string;
    }

    /** Rangé dans le Trousseau, jamais dans les préférences ; pas de valeur par défaut. */
    interface SecretOption extends OptionBase {
        type: "secret";
        defaultValue?: never;
    }

    type Option = StringOption | BooleanOption | MultipleOption | SecretOption;

    /** Ce qui décide quand le bouton apparaît et ce que devient le résultat. */
    interface ActionSettings {
        /** `["text"]` par défaut. */
        requirements?: OneOrMany<Requirement>;
        /** Expression régulière (ICU) que la sélection doit contenir. */
        regex?: string;
        /** Identifiants des seules apps où le bouton apparaît. */
        apps?: OneOrMany<string>;
        /** Identifiants des apps où le bouton n'apparaît pas. */
        excludedApps?: OneOrMany<string>;
        before?: BeforeStep;
        after?: AfterStep;
        /** Garde la barre ouverte pendant une action rapide (url, keyCombo). */
        stayVisible?: boolean;
        /** En secondes, de 0 à 60 ; 10 par défaut. */
        timeout?: number;
    }

    /** Ce que fait l'action : exactement une de ces clés. */
    interface Kinds {
        /** `***` est remplacé par la sélection encodée. */
        url: string;
        /** Par exemple `"command shift k"`. */
        keyCombo: string;
        /** Nom anglais du service, tel que l'app le déclare. */
        service: string;
        /** Nom exact du Raccourci. */
        shortcut: string;
        javascript: string;
        typescript: string;
        /** Fichier `.js` ou `.ts` du paquet. */
        javascriptFile: string;
        appleScript: string;
        appleScriptFile: string;
        shellScript: string;
        shellScriptFile: string;
    }

    type KindKey = keyof Kinds;
    type ShellKey = "shellScript" | "shellScriptFile";

    interface ShellSettings {
        /** Interpréteur, chemin absolu ; sinon le shebang, sinon `/bin/zsh`. */
        interpreter?: string;
    }

    /** La clé `K` seule, et `interpreter` pour un script Shell seulement. */
    type OneKind<K extends KindKey> = Pick<Kinds, K> &
        { [P in Exclude<KindKey, K>]?: never } &
        (K extends ShellKey ? ShellSettings : { interpreter?: never });

    type ActionKind = { [K in KindKey]: OneKind<K> }[KindKey];

    type Action = ActionSettings &
        ActionKind &
        Extra & {
            title: string;
            icon?: Icon;
        };

    interface ExtensionFields extends ActionSettings, Extra {
        name: string;
        /** Par exemple `com.exemple.bonjour` ; tiré du nom s'il manque. */
        identifier?: string;
        description?: string;
        icon?: Icon;
        options?: Option[];
        entitlements?: OneOrMany<Entitlement>;
    }

    /** Les actions dans `actions` ; les réglages de la racine leur servent de valeurs par défaut. */
    type ConfigWithActions = ExtensionFields & {
        actions: Action[];
        title?: never;
        interpreter?: never;
    } & { [P in KindKey]?: never };

    /** Une seule action, décrite à la racine. */
    type ConfigWithRootAction = ExtensionFields &
        ActionKind & {
            actions?: never;
            /** Le nom par défaut. */
            title?: string;
        };

    /** Config.yaml, Config.json ou l'en-tête d'un snippet. */
    type Config = ConfigWithActions | ConfigWithRootAction;
}

/** La sélection, son contexte, les options et les actions de Sélecta. */
declare const sel: Selecta.Sel;

/**
 * Requête HTTP ou HTTPS ; entitlement `network`. Une réponse d'erreur (404,
 * 500) n'est pas une exception : testez `ok` ou `status`. Réponse limitée à
 * 10 Mo, sans cookies ni cache.
 */
declare function fetch(url: string, options?: Selecta.FetchOptions): Promise<Selecta.Response>;

/** Base64 et empreintes. */
declare const util: Selecta.Util;

/**
 * Écrit dans les journaux si « Journaux des extensions » est activé ; sinon
 * ne fait rien. Déclaré comme dans la bibliothèque DOM, pour ne pas la
 * contredire quand l'éditeur la charge quand même.
 */
interface Console {
    log(...values: unknown[]): void;
    info(...values: unknown[]): void;
    warn(...values: unknown[]): void;
    error(...values: unknown[]): void;
    debug(...values: unknown[]): void;
}

declare var console: Console;

/** Les minuteurs encore en attente à la fin du script sont annulés. */
declare function setTimeout<Arguments extends unknown[]>(
    callback: (...args: Arguments) => void,
    milliseconds?: number,
    ...args: Arguments
): number;

declare function clearTimeout(id?: number): void;
