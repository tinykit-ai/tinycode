import { Client } from '../../types/index.js';
import path from 'path';
import os from 'os';
import fs from 'fs';

interface ServiceConfig {
    serviceurls?: {
        AI_API_URL?: string;
    };
    url?: string;
    clientid?: string;
    clientsecret?: string;
    deploymentid?: string;
}

interface TokenResponse {
    access_token: string;
    expires_in: number;
}

let config = process.env['AICORE_SERVICE_KEY'] || '';

if (!config) {
    const homeDir = os.homedir();
    const localConfigPath = path.join(homeDir, '.tinycode', '.aicore.json');
    // import from home directory
    config = fs.readFileSync(localConfigPath, 'utf-8');
}

const parsed: ServiceConfig = JSON.parse(process.env['AICORE_SERVICE_KEY'] || '{}');
const serviceUrl = parsed.serviceurls?.AI_API_URL || '';
const authUrl = parsed.url || '';
const clientId = parsed.clientid || '';
const clientSecret = parsed.clientsecret || '';
const deploymentId = process.env['DEPLOYMENT_ID'] || parsed.deploymentid || '';
const resourceGroup = process.env['RESOURCE_GROUP'] || 'default';

let token: string | null = null;
let tokenExpires = new Date(0);

async function fetchToken(): Promise<string> {
    const auth = "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const params = new URLSearchParams({ client_id: clientId, grant_type: 'client_credentials' });

    const res = await fetch(`${authUrl}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: auth,
        },
        body: params,
    });

    const data: TokenResponse = await res.json();
    tokenExpires = new Date(Date.now() + (data.expires_in - 10) * 1000);
    return data.access_token;
}

async function authenticate(): Promise<void> {
    if (!token || new Date() > tokenExpires) {
        token = await fetchToken();
    }
}

function getHeaders(): Record<string, string> {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'AI-Resource-Group': resourceGroup,
    };
}

export async function chat(body: string): Promise<any> {
    await authenticate();

    const res = await fetch(`${serviceUrl}/v2/inference/deployments/${deploymentId}/invoke`, {
        method: 'POST',
        headers: getHeaders(),
        body,
    });

    if (!res.ok) {
        throw new Error(`SAP AI request failed: ${res.status} ${await res.text()}`);
    }

    return res.json();
}

export class SapClient implements Client {
    async chat(body: string): Promise<any> {
        return chat(body);
    }
}