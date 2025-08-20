import { getAuth, setAuth } from "../../auth/store.js";
import { Client } from "../../types/index.js";

interface DeviceAuthResponse {
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
}

interface AccessTokenResponse {
    access_token?: string;
    error?: string;
    error_description?: string;
}

interface CopilotTokenResponse {
    token: string;
    expires_at: number;
}

const CLIENT_ID = "Iv1.b507a08c87ecfe98";
const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const COPILOT_TOKEN_URL = "https://api.github.com/copilot_internal/v2/token";
const COPILOT_CHAT_URL = "https://api.githubcopilot.com/chat/completions";

const DEFAULT_HEADERS = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "GitHubCopilotChat/0.26.7",
    "Editor-Version": "vscode/1.99.3"
};

let token = "";

async function getCopilotAccessToken(): Promise<string | null> {
    const auth = getAuth("github");
    if (!auth?.refresh) return null;
    if (auth.access && auth.expires && auth.expires > Date.now()) return auth.access;

    const res = await fetch(COPILOT_TOKEN_URL, {
        headers: {
            ...DEFAULT_HEADERS,
            Authorization: `Bearer ${auth.refresh}`,
            "Editor-Plugin-Version": "copilot-chat/0.26.7"
        }
    });

    if (!res.ok) return null;
    const data: CopilotTokenResponse = await res.json();

    setAuth("github", {
        ...auth,
        access: data.token,
        expires: data.expires_at * 1000
    });

    return data.token;
}

async function startDeviceAuth(): Promise<DeviceAuthResponse> {
    const res = await fetch(DEVICE_CODE_URL, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({ client_id: CLIENT_ID, scope: "read:user" })
    });

    const data = await res.json();
    return {
        device_code: data.device_code,
        user_code: data.user_code,
        verification_uri: data.verification_uri,
        interval: data.interval || 5
    };
}

async function pollForAccessToken(device_code: string): Promise<boolean> {
    const res = await fetch(ACCESS_TOKEN_URL, {
        method: "POST",
        headers: DEFAULT_HEADERS,
        body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code"
        })
    });

    const data: AccessTokenResponse = await res.json();

    if (data.access_token) {
        setAuth("github", { refresh: data.access_token, access: "", expires: 0 });
        return true;
    }

    if (data.error === "authorization_pending") return false;

    throw new Error(data.error_description || "Authorization failed");
}

function getHeaders(): Record<string, string> {
    return {
        ...DEFAULT_HEADERS,
        Authorization: `Bearer ${token}`,
    };
}

async function authenticate(): Promise<void> {
    token = (await getCopilotAccessToken()) || "";

    if (!token) {
        const auth = await startDeviceAuth();
        console.log(`🔑 Go to: ${auth.verification_uri}`);
        console.log(`🔢 Enter code: ${auth.user_code}`);

        let done = false;
        while (!done) {
            await new Promise(r => setTimeout(r, auth.interval * 1000));
            done = await pollForAccessToken(auth.device_code);
        }

        token = (await getCopilotAccessToken()) || "";
    }

    if (!token) {
        throw new Error("Failed to obtain GitHub Copilot token.");
    }
}

export async function chat(body: string): Promise<any> {
    await authenticate();

    const res = await fetch(COPILOT_CHAT_URL, {
        method: "POST",
        headers: getHeaders(),
        body
    });

    if (!res.ok) {
        throw new Error(`Copilot API error: ${res.status} ${await res.text()}`);
    }

    return res.json();
}

export class CopilotClient implements Client {
    async chat(body: string): Promise<any> {
        return chat(body);
    }
}