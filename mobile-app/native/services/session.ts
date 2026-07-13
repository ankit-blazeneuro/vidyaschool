import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const localAsyncStorage = AsyncStorage as any;

class SafeStorage {
  private memStore: Record<string, string> = {};
  private checkPromise: Promise<boolean> | null = null;

  private checkStorage(): Promise<boolean> {
    if (this.checkPromise) {
      return this.checkPromise;
    }
    this.checkPromise = (async () => {
      try {
        if (Platform.OS === "web") {
          if (typeof window !== "undefined" && window.localStorage) {
            return true;
          }
        }
        // Test AsyncStorage availability
        await localAsyncStorage.setItem("__test_storage__", "test");
        await localAsyncStorage.removeItem("__test_storage__");
        return true;
      } catch (e) {
        console.warn("Storage warning: Native AsyncStorage is not available, falling back to memory store.");
        return false;
      }
    })();
    return this.checkPromise;
  }

  async getItem(key: string): Promise<string | null> {
    const available = await this.checkStorage();
    if (!available) {
      return this.memStore[key] || null;
    }
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      }
      return await localAsyncStorage.getItem(key);
    } catch (e) {
      return this.memStore[key] || null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const available = await this.checkStorage();
    if (!available) {
      this.memStore[key] = value;
      return;
    }
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(key, value);
          return;
        }
      }
      await localAsyncStorage.setItem(key, value);
    } catch (e) {
      this.memStore[key] = value;
    }
  }

  async multiSet(keyValuePairs: [string, string][]): Promise<void> {
    const available = await this.checkStorage();
    if (!available) {
      for (const [key, value] of keyValuePairs) {
        this.memStore[key] = value;
      }
      return;
    }
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          for (const [key, value] of keyValuePairs) {
            window.localStorage.setItem(key, value);
          }
          return;
        }
      }
      await localAsyncStorage.multiSet(keyValuePairs);
    } catch (e) {
      for (const [key, value] of keyValuePairs) {
        this.memStore[key] = value;
      }
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    const available = await this.checkStorage();
    if (!available) {
      for (const key of keys) {
        delete this.memStore[key];
      }
      return;
    }
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined" && window.localStorage) {
          for (const key of keys) {
            window.localStorage.removeItem(key);
          }
          return;
        }
      }
      await localAsyncStorage.multiRemove(keys);
    } catch (e) {
      for (const key of keys) {
        delete this.memStore[key];
      }
    }
  }
}

const storage = new SafeStorage() as any;

const KEYS = {
  PROVIDER: "provider",
  EMAIL: "email",
  NAME: "name",
  ROLE: "role",
  AVATAR_URL: "avatar_url",
  SESSION_TOKEN: "session_token",
  STUDENT_CLASS: "student_class",
  USERNAME: "username",
  THEME_MODE: "theme_mode",
};

export const SessionManager = {
  async saveSession(
    provider: string,
    email: string,
    name: string | null,
    role: string,
    avatarUrl: string | null,
    sessionToken: string | null,
    studentClass: string | null,
    username: string | null = ""
  ) {
    const pairs: [string, string][] = [
      [KEYS.PROVIDER, provider],
      [KEYS.EMAIL, email],
      [KEYS.ROLE, role],
    ];

    if (name) pairs.push([KEYS.NAME, name]);
    if (avatarUrl) pairs.push([KEYS.AVATAR_URL, avatarUrl]);
    if (sessionToken) pairs.push([KEYS.SESSION_TOKEN, sessionToken]);
    if (studentClass) pairs.push([KEYS.STUDENT_CLASS, studentClass]);
    if (username) pairs.push([KEYS.USERNAME, username]);

    try {
      await storage.multiSet(pairs);
    } catch (e) {
      console.error("Error saving session", e);
    }
  },

  async updateOnboardingData(username: string, studentClass: string | null) {
    try {
      const pairs: [string, string][] = [[KEYS.USERNAME, username]];
      if (studentClass) {
        pairs.push([KEYS.STUDENT_CLASS, studentClass]);
      }
      await storage.multiSet(pairs);
    } catch (e) {
      console.error("Error updating onboarding data", e);
    }
  },

  async clearSession() {
    const keysToRemove = [
      KEYS.PROVIDER,
      KEYS.EMAIL,
      KEYS.NAME,
      KEYS.ROLE,
      KEYS.AVATAR_URL,
      KEYS.SESSION_TOKEN,
      KEYS.STUDENT_CLASS,
      KEYS.USERNAME,
    ];
    try {
      await storage.multiRemove(keysToRemove);
    } catch (e) {
      console.error("Error clearing session", e);
    }
  },

  async isLoggedIn(): Promise<boolean> {
    try {
      const token = await storage.getItem(KEYS.SESSION_TOKEN);
      return token !== null && token !== "";
    } catch {
      return false;
    }
  },

  async getSessionToken(): Promise<string | null> {
    return storage.getItem(KEYS.SESSION_TOKEN);
  },

  async getRole(): Promise<string | null> {
    return storage.getItem(KEYS.ROLE);
  },

  async getEmail(): Promise<string | null> {
    return storage.getItem(KEYS.EMAIL);
  },

  async getName(): Promise<string | null> {
    return storage.getItem(KEYS.NAME);
  },

  async getProvider(): Promise<string | null> {
    return storage.getItem(KEYS.PROVIDER);
  },

  async getAvatarUrl(): Promise<string | null> {
    return storage.getItem(KEYS.AVATAR_URL);
  },

  async getStudentClass(): Promise<string | null> {
    return storage.getItem(KEYS.STUDENT_CLASS);
  },

  async getUsername(): Promise<string | null> {
    return storage.getItem(KEYS.USERNAME);
  },

  async getThemeMode(): Promise<string | null> {
    return storage.getItem(KEYS.THEME_MODE);
  },

  async setThemeMode(mode: string) {
    try {
      await storage.setItem(KEYS.THEME_MODE, mode);
    } catch (e) {
      console.error("Error saving theme mode", e);
    }
  },
};
