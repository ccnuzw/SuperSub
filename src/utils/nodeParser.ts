import { Node } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Define a more specific type for a node that has been parsed but not yet saved to the DB.
export type ParsedNode = Omit<Node, 'id' | 'user_id' | 'group_id' | 'created_at' | 'updated_at' | 'sort_order' | 'status' | 'latency' | 'last_checked' | 'error'>;


// A robust Base64 decoder that handles URL-safe encoding and padding issues.
const base64Decode = (str: string): string => {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
        case 0:
            break;
        case 2:
            output += '==';
            break;
        case 3:
            output += '=';
            break;
        default:
            throw new Error('Illegal base64url string!');
    }

    // Use TextDecoder for robust UTF-8 decoding, available in all modern JS environments (Browser, Node, CF Workers).
    try {
        const binaryString = atob(output);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error('Failed to decode base64 string:', str, e);
        return '';
    }
};

const parseVmess = (link: string): ParsedNode | null => {
    if (!link.startsWith('vmess://')) return null;

    let data = link.substring(8);
    let encodedPart = data;
    let queryPart = '';

    const queryIndex = data.indexOf('?');
    if (queryIndex !== -1) {
        encodedPart = data.substring(0, queryIndex);
        queryPart = data.substring(queryIndex);
    }

    let decodedData: string;
    try {
        decodedData = base64Decode(encodedPart);
    } catch (e) {
        console.error('Base64 decoding failed for VMess link part:', encodedPart, e);
        return null;
    }

    const queryParams = new URLSearchParams(queryPart);
    let finalParams: Record<string, any> = {};
    for (const [key, value] of queryParams.entries()) {
        finalParams[key] = value;
    }

    // Strategy 1: Try to parse decoded data as JSON
    try {
        const config = JSON.parse(decodedData);
        // Standardize fields: some configs use 'server' and 'uuid' instead of 'add' and 'id'.
        if (!config.add && config.server) config.add = config.server;
        if (!config.id && config.uuid) config.id = config.uuid;

        if (config.add && config.port && config.id) {
            // Merge JSON config with URL query params, with query params taking precedence
            finalParams = { ...config, ...finalParams };

            const name = finalParams.ps || finalParams.remarks || finalParams.name || `${finalParams.add}:${finalParams.port}`;
            delete finalParams.ps;
            delete finalParams.remarks;
            // Also delete the 'name' field from the params if it exists, as it's now the top-level name.
            delete finalParams.name;

            return {
                name,
                link,
                protocol: 'vmess',
                protocol_params: finalParams,
                server: finalParams.add,
                port: Number(finalParams.port),
                type: 'vmess',
                password: finalParams.id,
                params: finalParams,
            };
        }
    } catch (e) {
        // Not a JSON, proceed to next strategy
    }

    // Strategy 2: Treat decoded data as a URL-like string (e.g., "auto:uuid@host:port")
    if (decodedData.includes('@')) {
        try {
            const atIndex = decodedData.lastIndexOf('@');
            const credentials = decodedData.substring(0, atIndex);
            const addressPart = decodedData.substring(atIndex + 1);

            const [method, uuid] = credentials.split(':');
            if (!uuid) throw new Error('Invalid VMess credentials in decoded data.');

            const portIndex = addressPart.lastIndexOf(':');
            if (portIndex === -1) throw new Error('Port not found in decoded data.');

            const server = addressPart.substring(0, portIndex);
            const port = Number(addressPart.substring(portIndex + 1));

            if (!server || !port) return null;

            // Base parameters from the decoded part
            let baseParams: Record<string, any> = {
                id: uuid,
                security: method,
                add: server,
                port: port,
            };

            // Merge with URL query params, query params take precedence
            finalParams = { ...baseParams, ...finalParams };

            const name = finalParams.remarks || finalParams.ps || server;
            // Clean up remarks/ps from final params if they exist
            delete finalParams.remarks;
            delete finalParams.ps;

            return {
                name,
                link,
                protocol: 'vmess',
                protocol_params: finalParams,
                server: finalParams.add,
                port: Number(finalParams.port),
                type: 'vmess',
                password: finalParams.id,
                params: finalParams,
            };
        } catch (error) {
            console.error('Failed to manually parse decoded VMess URL-like data:', decodedData, error);
            return null;
        }
    }

    console.error('Failed to parse VMess link. Decoded data was not valid JSON or a recognizable URL format:', decodedData);
    return null;
};

const parseHysteria2 = (link: string): ParsedNode | null => {
    if (!link.startsWith('hysteria2://')) return null;
    try {
        const url = new URL(link);
        const name = decodeURIComponent(url.hash.substring(1)) || url.hostname;
        const server = url.hostname;
        const port = Number(url.port);
        const auth = url.username; // Hy2 auth is in the username part

        if (!auth || !server || !port) return null;

        const protocol_params: Record<string, any> = {};
        for (const [key, value] of url.searchParams.entries()) {
            protocol_params[key] = value;
        }

        // Also add auth to params for completeness
        protocol_params.auth = auth;

        return {
            name,
            link,
            protocol: 'hysteria2',
            protocol_params,
            // Legacy fields
            server,
            port,
            type: 'hysteria2',
            password: auth,
            params: protocol_params,
        };
    } catch (error) {
        console.error('Failed to parse Hysteria2 link:', link, error);
        return null;
    }
};


const genericUrlParser = (link: string, protocol: 'ss' | 'trojan' | 'vless' | 'tuic' | 'anytls'): ParsedNode | null => {
    if (!link.startsWith(`${protocol}://`)) return null;

    try {
        const url = new URL(link);
        const name = decodeURIComponent(url.hash.substring(1)) || url.searchParams.get('name') || url.hostname;

        // Initialize protocol_params with all query parameters
        const protocol_params: Record<string, any> = {};
        for (const [key, value] of url.searchParams.entries()) {
            protocol_params[key] = value;
        }

        // Add core URL parts to protocol_params, query params will have taken precedence if they existed
        protocol_params.server = protocol_params.server || url.hostname;
        protocol_params.port = protocol_params.port || Number(url.port);

        let password = '';
        let uuid = '';

        if (protocol === 'ss') {
            try {
                const decodedCredentials = base64Decode(decodeURIComponent(url.username));
                const [method, pass] = decodedCredentials.split(':');
                if (!method || !pass) return null;
                protocol_params.method = method;
                password = pass;
            } catch (e) {
                console.error('Failed to parse SS credentials', e);
                return null;
            }
        } else if (protocol === 'tuic') {
            uuid = url.username;
            password = url.password;
        } else if (protocol === 'anytls') {
            uuid = url.username;
            password = url.username; // For anytls, password/uuid is the same as the username.
        } else {
            // For protocols like vless, trojan
            password = url.username;
        }

        // Populate protocol_params with the parsed credentials
        protocol_params.uuid = uuid;
        protocol_params.password = password;

        // Final validation
        if (!protocol_params.server || !protocol_params.port) return null;
        if (protocol === 'tuic' && !uuid) return null;
        if (protocol === 'anytls' && !uuid) return null;
        if ((protocol === 'vless' || protocol === 'trojan') && !password) return null;

        return {
            name,
            link,
            protocol,
            protocol_params, // This now contains everything
            // Legacy fields for backward compatibility or direct use
            server: protocol_params.server,
            port: Number(protocol_params.port),
            type: protocol,
            password: protocol_params.password,
            params: protocol_params, // 'params' is often used, so let's keep it consistent
        };

    } catch (error) {
        console.error(`Failed to parse ${protocol} link:`, link, error);
        return null;
    }
}

const parseSsr = (link: string): ParsedNode | null => {
    if (!link.startsWith('ssr://')) return null;
    try {
        const decodedData = base64Decode(link.substring(6));
        const parts = decodedData.split('/?');
        const mainPart = parts[0];
        const queryPart = parts.length > 1 ? parts[1] : '';

        const [server, port, protocol, method, obfs, password_base64] = mainPart.split(':');

        const password = base64Decode(password_base64);
        const protocol_params: Record<string, any> = {
            server, port: Number(port), protocol, method, obfs, password,
            cipher: method, // Ensure 'cipher' key exists for consistency
        };

        let name = '';
        if (queryPart) {
            const queryParams = new URLSearchParams(queryPart);
            for (const [key, value] of queryParams.entries()) {
                const decodedValue = base64Decode(value);
                switch (key) {
                    case 'remarks': name = decodedValue; break;
                    case 'group': protocol_params.group = decodedValue; break;
                    case 'protoparam': protocol_params['protocol-param'] = decodedValue; break;
                    case 'obfsparam': protocol_params['obfs-param'] = decodedValue; break;
                    default: protocol_params[key] = decodedValue; break;
                }
            }
        }

        name = name || `${server}:${port}`;
        protocol_params.remarks = name;

        return { name, link, protocol: 'ssr', protocol_params, server, port: Number(port), type: 'ssr', password, params: protocol_params };
    } catch (error) { console.error('Failed to parse SSR link:', link, error); return null; }
};


export const parseNodeLinks = (linksText: string): (ParsedNode & { id: string; raw: string; })[] => {
    if (!linksText) {
        return [];
    }

    const links = linksText.split(/[\r\n]+/).map(link => link.trim()).filter(Boolean);
    const parsedNodes: (ParsedNode & { id: string; raw: string; })[] = [];

    for (const link of links) {
        let parsedNode: ParsedNode | null = null;

        if (link.startsWith('vmess://')) {
            parsedNode = parseVmess(link);
        } else if (link.startsWith('ss://')) {
            parsedNode = genericUrlParser(link, 'ss');
        } else if (link.startsWith('ssr://')) {
            parsedNode = parseSsr(link);
        } else if (link.startsWith('trojan://')) {
            parsedNode = genericUrlParser(link, 'trojan');
        } else if (link.startsWith('vless://')) {
            parsedNode = genericUrlParser(link, 'vless');
        } else if (link.startsWith('hysteria2://')) {
            parsedNode = parseHysteria2(link);
        } else if (link.startsWith('tuic://')) {
            parsedNode = genericUrlParser(link, 'tuic');
        } else if (link.startsWith('anytls://')) {
            parsedNode = genericUrlParser(link, 'anytls');
        }

        if (parsedNode) {
            // Assign a temporary client-side ID for UI keying purposes
            const nodeWithId = { ...parsedNode, id: uuidv4(), raw: link };
            parsedNodes.push(nodeWithId);
        }
    }

    return parsedNodes;
};

// A simple Base64 encoder that works in both browser and Node.js environments
const base64Encode = (str: string): string => {
    try {
        // This is the modern and correct way to handle Unicode strings for btoa,
        // which works in both modern browsers and Cloudflare Workers.
        const bytes = new TextEncoder().encode(str);
        const binaryString = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
        return btoa(binaryString);
    } catch (e) {
        console.error('Failed to encode to base64:', e);
        // Fallback for Node.js environments where btoa might not be available globally
        // and TextEncoder might exist.
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(str, 'utf-8').toString('base64');
        }
        return '';
    }
};

// Helper for SSR links, which require URL-safe Base64 encoding without padding.
const base64EncodeUrlSafe = (str: string): string => {
    return base64Encode(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

export const regenerateLink = (node: ParsedNode): string => {
    const protocol = node.protocol;
    const name = encodeURIComponent(node.name || '');
    const params = node.protocol_params || {};

    switch (protocol) {
        case 'vmess':
            const vmessConfig = { ...params, ps: node.name };
            return `vmess://${base64Encode(JSON.stringify(vmessConfig))}`;

        case 'ss':
            // Be compatible with both 'method' and 'cipher' for encryption type
            const method = params.method || params.cipher;
            const password = params.password || node.password; // Fallback for safety

            if (!method || !password) {
                console.error('Cannot regenerate SS link, missing method/cipher or password for', node);
                return node.link || ''; // Fallback
            }

            const credentials = `${method}:${password}`;
            const encodedCredentials = base64Encode(credentials).replace(/=/g, ''); // Some clients don't like padding
            return `ss://${encodedCredentials}@${node.server}:${node.port}#${name}`;

        case 'ssr':
            const ssrParams = params;
            const pass_b64 = base64EncodeUrlSafe(ssrParams.password || '');
            const method_val = ssrParams.method || ssrParams.cipher; // Be compatible

            const mainInfo = [ssrParams.server, ssrParams.port, ssrParams.protocol, method_val, ssrParams.obfs, pass_b64].join(':');

            const queryParts: string[] = [];
            const remarks_b64 = base64EncodeUrlSafe(node.name || '');
            queryParts.push(`remarks=${remarks_b64}`);

            if (ssrParams.group) queryParts.push(`group=${base64EncodeUrlSafe(ssrParams.group)}`);
            if (ssrParams['protocol-param']) queryParts.push(`protoparam=${base64EncodeUrlSafe(ssrParams['protocol-param'])}`);
            if (ssrParams['obfs-param']) queryParts.push(`obfsparam=${base64EncodeUrlSafe(ssrParams['obfs-param'])}`);

            const finalString = `${mainInfo}/?${queryParts.join('&')}`;
            const encodedLink = base64EncodeUrlSafe(finalString);
            return `ssr://${encodedLink}`;

        case 'trojan':
        case 'vless':
        case 'anytls':
            // params is already defined above
            const authUser = params.uuid || params.password || node.password;
            const server = params.server || node.server;
            const port = params.port || node.port;

            if (!authUser || !server || !port) {
                console.error('Cannot regenerate link, missing core info for', node);
                return node.link || ''; // Fallback
            }

            const url = new URL(`${protocol}://${authUser}@${server}:${port}`);
            url.hash = name; // Already encoded name

            // 1:1 regeneration: Add all other params from protocol_params to the search query
            // with their original keys and values.
            for (const key in params) {
                // Avoid adding core info that is already in the URL's main part.
                // Also avoid adding 'name' which might have been a query param originally.
                if (key !== 'password' && key !== 'server' && key !== 'port' && key !== 'name' && key !== 'uuid') {
                    url.searchParams.set(key, String(params[key]));
                }
            }
            return url.toString();

        case 'hysteria2':
            const hy2Url = new URL(`hysteria2://${node.password}@${node.server}:${node.port}`);
            hy2Url.hash = name;
            for (const key in params) {
                if (key !== 'auth') { // Auth is already in the userinfo part
                    hy2Url.searchParams.set(key, params[key]);
                }
            }
            return hy2Url.toString();

        case 'tuic':
            const tuicParams = params;
            const tuicPassword = tuicParams.password || ''; // Can be empty
            const tuicUrl = new URL(`tuic://${tuicParams.uuid}:${tuicPassword}@${node.server}:${node.port}`);
            tuicUrl.hash = name;
            for (const key in tuicParams) {
                if (key !== 'uuid' && key !== 'password' && key !== 'server' && key !== 'port' && key !== 'name') {
                    tuicUrl.searchParams.set(key, tuicParams[key]);
                }
            }
            return tuicUrl.toString();

        default:
            return node.link || ''; // Fallback to original link
    }
};