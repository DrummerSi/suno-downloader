import { Store, load } from '@tauri-apps/plugin-store';

// Define the Settings interface with explicit types
interface Settings {
    name_templates: string
    overwrite_files: string
    embed_images: string
}

// Define defaultSettings with the correct types
const defaultSettings: Settings = {
    name_templates: "{trackno} - {name}",
    overwrite_files: "false",
    embed_images: "true",
};

class SettingsManager {
    private store!: Store;

    private constructor(store: Store) {
        this.store = store;
    }

    static async create(): Promise<SettingsManager> {
        const store = await load('store.json', { autoSave: false });
        return new SettingsManager(store);
    }

    async getSetting<T>(key: string, defaultValue: T): Promise<T> {
        const value = await this.store.get<T>(key);
        return value ?? defaultValue;
    }

    async setSetting<T>(key: string, value: T, save = true) {
        await this.store.set(key, value);
        if (save) await this.store.save();
    }

    async save() {
        await this.store.save();
    }

    async loadAll(): Promise<Settings> {
        const settings: Partial<Settings> = {};

        for (const key in defaultSettings) {
            const typedKey = key as keyof Settings; // Explicitly type the key
            const defaultValue = defaultSettings[typedKey]; // Get the default value
            settings[typedKey] = await this.getSetting(typedKey, defaultValue); // Assign the value
        }

        return settings as Settings;
    }

    async saveAll(newSettings: Settings) {
        for (const key in newSettings) {
            await this.store.set(key, newSettings[key as keyof Settings]);
        }
        await this.store.save();
    }
}

export const Settings = await SettingsManager.create();