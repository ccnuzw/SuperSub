
import { parseNodeLinks, ParsedNode } from '../../../src/utils/nodeParser';
import yaml from 'js-yaml';

export function parseSubscriptionContent(content: string): (ParsedNode & { id: string, raw: string })[] {
    let nodes: (ParsedNode & { id: string, raw: string })[] = [];
    let isYaml = false;

    try {
        if (content.includes('proxies:') || content.includes('proxy-groups:')) {
            const data = yaml.load(content) as any;
            if (data && Array.isArray(data.proxies)) {
                isYaml = true;
                nodes = data.proxies.map((proxy: any) => {
                    const protocol = proxy.type;
                    return {
                        id: crypto.randomUUID(),
                        name: proxy.name,
                        protocol: protocol,
                        server: proxy.server,
                        port: proxy.port,
                        type: protocol,
                        password: proxy.password || proxy.uuid,
                        protocol_params: proxy,
                        link: `clash://${protocol}/${proxy.name}`,
                        raw: `clash://${protocol}/${proxy.name}`,
                    };
                });
            }
        }
    } catch (e) {
        // console.log("YAML parsing failed, trying as plain text.");
    }

    if (!isYaml) {
        try {
            const decodedContent = atob(content);
            if (decodedContent.includes('proxies:') || decodedContent.includes('proxy-groups:')) {
                const data = yaml.load(decodedContent) as any;
                if (data && Array.isArray(data.proxies)) {
                    isYaml = true;
                    nodes = data.proxies.map((proxy: any) => ({
                        id: crypto.randomUUID(),
                        name: proxy.name,
                        protocol: proxy.type,
                        server: proxy.server,
                        port: proxy.port,
                        type: proxy.type,
                        password: proxy.password || proxy.uuid,
                        protocol_params: proxy,
                        link: `clash://${proxy.type}/${proxy.name}`,
                        raw: `clash://${proxy.type}/${proxy.name}`,
                    }));
                }
            } else {
                nodes = parseNodeLinks(decodedContent);
            }
        } catch (e) {
            nodes = parseNodeLinks(content);
        }
    }

    if (nodes.length === 0 && !isYaml) {
        nodes = parseNodeLinks(content);
    }

    return nodes;
}

export function applySubscriptionRules(nodes: (ParsedNode & { id: string; raw: string; })[], rules: any[]): (ParsedNode & { id: string; raw: string; })[] {
    let processedNodes = [...nodes];

    for (const rule of rules) {
        if (!rule.enabled) continue;

        try {
            if (rule.type === 'filter_by_name_keyword' || rule.type === 'exclude_by_name_keyword') {
                const keywords = rule.value.split(/[\n,|]+/).map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                if (keywords.length === 0) continue;

                if (rule.type === 'filter_by_name_keyword') {
                    processedNodes = processedNodes.filter(node => {
                        const lowerCaseName = node.name.toLowerCase();
                        return keywords.some((keyword: string) => lowerCaseName.includes(keyword));
                    });
                } else {
                    processedNodes = processedNodes.filter(node => {
                        const lowerCaseName = node.name.toLowerCase();
                        return !keywords.some((keyword: string) => lowerCaseName.includes(keyword));
                    });
                }
            }
            else if (rule.type === 'filter_by_name_regex' || rule.type === 'rename_by_regex') {
                const value = JSON.parse(rule.value);

                if (rule.type === 'filter_by_name_regex' && value.regex) {
                    const ignoreCase = value.regex.startsWith('(?i)');
                    const pattern = ignoreCase ? value.regex.substring(4) : value.regex;
                    const regex = new RegExp(pattern, ignoreCase ? 'i' : '');
                    processedNodes = processedNodes.filter(node => regex.test(node.name));
                }
                else if (rule.type === 'rename_by_regex' && value.regex && typeof value.format !== 'undefined') {
                    const ignoreCase = value.regex.startsWith('(?i)');
                    const pattern = ignoreCase ? value.regex.substring(4) : value.regex;
                    const regex = new RegExp(pattern, ignoreCase ? 'gi' : 'g');
                    processedNodes = processedNodes.map(node => {
                        return { ...node, name: node.name.replace(regex, value.format) };
                    });
                }
            }
        } catch (e) {
            console.error(`Error applying rule ${rule.id} (${rule.name}):`, e);
        }
    }

    return processedNodes;
}
