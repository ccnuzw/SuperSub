import { Buffer } from 'node:buffer';
import { ProfileService, CandidateSet } from '../services/profileService';
import { regenerateLink, ParsedNode } from '../../../src/utils/nodeParser';
import { parseSubscriptionContent } from '../utils/subscriptionUtils';
import { fetchSubscriptionContent } from './network';
import { Logger } from './logger';
import { getIpInfo, sendSubscriptionAccessNotification } from './telegram';
import { userAgents } from '../services/subscriptionService';

export const generateSubscription = async (c: any, profile: any, user: any, isPublic: boolean, isPreview: boolean = false, logger: Logger) => {
    const content = JSON.parse(profile.content || '{}');
    logger.info(`开始处理配置文件: "${profile.name}"`, { profileId: profile.id });

    const profileService = new ProfileService(c.env);
    let result: any;


    try {
        const mainLogic = async () => {
            const userAgent = c.req.header('User-Agent') || '';
            const query = c.req.query();

            const ua = userAgent.toLowerCase();
            let targetClient = 'base64'; // Default target

            if (query.target) {
                targetClient = query.target;
            } else {
                const isSubConverterRequest = c.req.header('subconverter-request') || c.req.header('subconverter-version') || ua.includes('subconverter');

                if (!isSubConverterRequest && !ua.includes('nekobox') && !ua.includes('cf-workers-sub')) {
                    if (ua.includes('sing-box') || ua.includes('singbox') || query.sb || query.singbox) {
                        targetClient = 'singbox';
                    } else if (ua.includes('surge') || query.surge) {
                        targetClient = 'surge';
                    } else if (ua.includes('quantumult') || query.quanx) {
                        targetClient = 'quantumultx';
                    } else if (ua.includes('loon') || query.loon) {
                        targetClient = 'loon';
                    } else if (ua.includes('clash') || ua.includes('meta') || ua.includes('mihomo') || query.clash) {
                        targetClient = 'clash';
                    }
                }
            }
            logger.info(`最终目标客户端: ${targetClient}`);

            // 提取的 handleAccess 辅助函数 - 用于记录订阅访问日志和发送通知
            const handleAccess = async (finalRequestType: string) => {
                try {
                    const ip_address = c.req.header('CF-Connecting-IP') || 'N/A';
                    const user_agent = c.req.header('User-Agent') || 'N/A';
                    const cf = (c.req.raw as any).cf;
                    const country = cf?.country || null;
                    const city = cf?.city || null;

                    // Log access to DB only for public subscriptions
                    if (isPublic) {
                        await c.env.DB.prepare(
                            'INSERT INTO subscription_access_logs (user_id, profile_id, ip_address, user_agent, country, city) VALUES (?, ?, ?, ?, ?, ?)'
                        ).bind(user.id, profile.id, ip_address, user_agent, country, city).run();
                    }

                    // Fetch additional info for notification
                    const { isp, asn } = await getIpInfo(ip_address);
                    const url = new URL(c.req.url);
                    const domain = url.hostname;

                    const subscriptionGroup = profile.name;

                    await sendSubscriptionAccessNotification(c.env, user.id, {
                        ip: ip_address,
                        country,
                        city,
                        isp,
                        asn,
                        domain,
                        client: user_agent,
                        requestType: finalRequestType,
                        subscriptionGroup,
                    });

                } catch (e) {
                    console.error("Failed to log subscription access or send notification:", e);
                }
            };

            let subconverterUrlInput = '';
            let isLocalContentBase64 = false;
            let localContent = '';
            const generationMode = content.generation_mode || 'local';
            logger.info(`解析模式: ${generationMode}`);

            if (generationMode === 'remote') {
                let subscriptionUrls: string[] = [];
                let manualNodeLinks: string[] = [];

                if (content.subscription_ids && content.subscription_ids.length > 0) {
                    logger.info('开始根据策略选择订阅源...');
                    const strategyResult = await profileService.selectSourcesByStrategy(user.id, profile, isPreview, logger);
                    const { strategy } = strategyResult;
                    const updatedPollingState: { polling_index?: number; group_polling_indices?: Record<string, number> } = {};
                    logger.success(`订阅选择策略: ${strategy}`);

                    if (strategyResult.type === 'selection') {
                        subscriptionUrls.push(...strategyResult.selectedSources.map((s: any) => s.sub.url));
                        logger.info(`选择了 ${strategyResult.selectedSources.length} 个订阅源`, { urls: subscriptionUrls });
                        if (strategyResult.updatedPollingState?.polling_index !== undefined) {
                            updatedPollingState.polling_index = strategyResult.updatedPollingState.polling_index;
                        }
                    } else if (strategyResult.type === 'candidates') {
                        logger.info('正在处理 "分组轮询" 策略 (远程模式)...');
                        const groupPollingState = JSON.parse(profile.group_polling_indices || '{}');
                        const airportOptions = content.airport_subscription_options || {};
                        const timeout = airportOptions.timeout || 10;

                        const findAvailableSubInGroupForRemote = async (groupId: string, candidateSet: CandidateSet): Promise<string | null> => {
                            logger.info(`(远程) 开始串行探测分组 "${groupId}"...`);
                            for (const [index, sub] of candidateSet.candidates.entries()) {
                                try {
                                    const fetchedContent = await fetchSubscriptionContent(sub.url, timeout);
                                    if (fetchedContent) {
                                        logger.success(`(远程) 分组 "${groupId}" 的候选 "${sub.name}" 成功返回内容。`);
                                        const newIndex = (candidateSet.startIndex + index + 1) % candidateSet.totalInGroup;
                                        groupPollingState[groupId] = newIndex;
                                        logger.info(`(远程) 分组 "${groupId}" 的轮询索引将更新为 ${newIndex}。`);
                                        return sub.url;
                                    } else {
                                        logger.warn(`(远程) 分组 "${groupId}" 的候选 "${sub.name}" 返回内容为空。`);
                                    }
                                } catch (error) {
                                    logger.error(`(远程) 分组 "${groupId}" 的候选 "${sub.name}" 请求失败。`, { error });
                                }
                            }
                            logger.error(`(远程) 分组 "${groupId}" 的所有候选订阅均获取失败。`);
                            return null;
                        };

                        // strategyResult.candidateSets is now an ordered array
                        const groupPromises = strategyResult.candidateSets.map(([groupId, cs]) => findAvailableSubInGroupForRemote(groupId, cs));

                        const availableUrls = (await Promise.all(groupPromises)).filter((url): url is string => url !== null);

                        subscriptionUrls.push(...availableUrls);
                        logger.success(`所有分组探测完成，共获得 ${subscriptionUrls.length} 个可用订阅链接。`);

                        if (Object.keys(groupPollingState).length > 0) {
                            updatedPollingState.group_polling_indices = groupPollingState;
                        }
                    }

                    if (Object.keys(updatedPollingState).length > 0) {
                        let setClauses = [];
                        let bindings: (string | number | undefined)[] = [];
                        if (updatedPollingState.polling_index !== undefined) {
                            setClauses.push('polling_index = ?');
                            bindings.push(updatedPollingState.polling_index);
                        }
                        if (updatedPollingState.group_polling_indices !== undefined) {
                            setClauses.push('group_polling_indices = ?');
                            bindings.push(JSON.stringify(updatedPollingState.group_polling_indices));
                        }
                        if (setClauses.length > 0) {
                            const updateQuery = `UPDATE profiles SET ${setClauses.join(', ')} WHERE id = ?`;
                            bindings.push(profile.id);
                            logger.info('正在更新数据库中的轮询状态...', { state: updatedPollingState });
                            c.executionCtx.waitUntil(c.env.DB.prepare(updateQuery).bind(...bindings).run());
                        }
                    }
                } else {
                    logger.info('配置文件中未包含任何订阅。');
                }

                if (content.node_ids && content.node_ids.length > 0) {
                    logger.info(`准备合并 ${content.node_ids.length} 个手动添加的节点...`);
                    const { results: manualNodes } = await c.env.DB.prepare(`SELECT link FROM nodes WHERE id IN (${content.node_ids.map(() => '?').join(',')}) AND user_id = ?`).bind(...content.node_ids, user.id).all();
                    manualNodeLinks = (manualNodes as any[]).map(n => n.link);
                    logger.success(`成功获取 ${manualNodeLinks.length} 个手动节点的链接。`);
                }

                const finalUrlParts = [...subscriptionUrls];
                if (manualNodeLinks.length > 0) {
                    const manualNodesContent = manualNodeLinks.join('\n');
                    const base64ManualNodes = Buffer.from(manualNodesContent).toString('base64');
                    const encodedContent = encodeURIComponent(base64ManualNodes);

                    const selfUrl = new URL(c.req.url);
                    const nodesUrl = `${selfUrl.origin}/api/public/nodes?content=${encodedContent}`;
                    logger.info('已将手动节点转换为一个临时的 base64 订阅链接', { url: nodesUrl });

                    const nodePrefixSettings = content.node_prefix_settings || {};
                    if (nodePrefixSettings.manual_nodes_first) {
                        finalUrlParts.unshift(nodesUrl);
                        logger.info('排序规则: 手动节点优先，已置于列表开头。');
                    } else {
                        finalUrlParts.push(nodesUrl);
                        logger.info('排序规则: 订阅节点优先，手动节点已添加至列表末尾。');
                    }
                }

                if (finalUrlParts.length > 0) {
                    subconverterUrlInput = finalUrlParts.join('|');
                    logger.info('最终组合的订阅链接已生成', { combinedUrl: subconverterUrlInput });
                }

            } else { // 'local' mode
                let allNodes: any[] = [];
                if (!isPreview) {
                    allNodes = await profileService.generateProfileNodes(profile, false, logger, c.executionCtx);
                }

                if (!isPreview && allNodes.length === 0) {
                    logger.warn('没有找到任何可用节点。');
                    c.executionCtx.waitUntil(handleAccess(targetClient));
                    return { type: 'text', payload: 'No nodes found for this profile.', status: 404, finalRequestType: targetClient };
                }

                localContent = allNodes.map(regenerateLink).filter(Boolean).join('\n');
                logger.success(`本地内容生成完成，共 ${allNodes.length} 个节点。`);

                if (query.b64 || targetClient === 'base64') {
                    logger.info('将直接返回 Base64 编码的内容。');
                    isLocalContentBase64 = true;
                } else {
                    const currentUrl = new URL(c.req.url);
                    currentUrl.searchParams.set('b64', '1');
                    subconverterUrlInput = `${currentUrl.toString()}&_t=${Date.now()}`;
                    logger.info('将通过 Subconverter 处理本地生成的节点列表。', { subconverterUrlInput });
                }
            }

            if (isPreview) {
                if (generationMode === 'remote') {
                    const finalUrls = subconverterUrlInput ? subconverterUrlInput.split('|') : [];
                    logger.info(`远程模式预览: 准备获取并解析 ${finalUrls.length} 个链接...`, { urls: finalUrls });

                    if (finalUrls.length === 0) {
                        logger.warn('远程模式预览: 没有可供解析的链接。');
                        return { type: 'json', payload: { success: true, data: { mode: 'remote', nodes: [], analysis: { total: 0, protocols: {}, regions: {} }, logs: logger.logs } } };
                    }

                    const fetchPromises = finalUrls.map(url =>
                        fetch(url, { headers: { 'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)] } })
                            .then(res => {
                                if (!res.ok) {
                                    logger.error(`获取预览URL失败: HTTP状态 ${res.status}`, { url });
                                    return '';
                                }
                                return res.text();
                            })
                            .catch(err => {
                                logger.error(`获取预览URL时发生网络错误: ${err.message}`, { url });
                                return '';
                            })
                    );

                    const contents = await Promise.all(fetchPromises);
                    let allNodes: (ParsedNode & { id: string; raw: string; })[] = [];

                    for (const content of contents) {
                        if (content) {
                            const nodes = parseSubscriptionContent(content);
                            allNodes.push(...nodes);
                        }
                    }
                    logger.info(`远程模式预览: 初始解析得到 ${allNodes.length} 个节点。`);

                    const finalNodes = await profileService.applyAllRules(profile.user_id, profile.id, allNodes, logger);

                    const analysis = {
                        total: finalNodes.length,
                        protocols: finalNodes.reduce((acc: Record<string, number>, node: ParsedNode) => {
                            const protocol = node.protocol || 'unknown';
                            acc[protocol] = (acc[protocol] || 0) + 1;
                            return acc;
                        }, {}),
                        regions: finalNodes.reduce((acc: Record<string, number>, node: ParsedNode) => {
                            const match = node.name.match(/\[(.*?)\]|\((.*?)\)|(香港|澳门|台湾|新加坡|日本|美国|英国|德国|法国|韩国|俄罗斯|IEPL|IPLC)/);
                            const region = match ? (match[1] || match[2] || match[3] || 'Unknown') : 'Unknown';
                            acc[region] = (acc[region] || 0) + 1;
                            return acc;
                        }, {}),
                    };
                    logger.success(`远程模式预览完成，最终获得 ${finalNodes.length} 个节点。`);
                    return { type: 'json', payload: { success: true, data: { mode: 'remote', nodes: finalNodes, analysis: analysis, logs: logger.logs } } };
                } else { // local mode preview
                    const previewNodes = await profileService.generateProfileNodes(profile, true, logger, c.executionCtx);
                    const analysis = {
                        total: previewNodes.length,
                        protocols: previewNodes.reduce((acc: Record<string, number>, node: ParsedNode) => {
                            const protocol = node.protocol || 'unknown';
                            acc[protocol] = (acc[protocol] || 0) + 1;
                            return acc;
                        }, {}),
                        regions: previewNodes.reduce((acc: Record<string, number>, node: ParsedNode) => {
                            const match = node.name.match(/\[(.*?)\]|\((.*?)\)|(香港|澳门|台湾|新加坡|日本|美国|英国|德国|法国|韩国|俄罗斯|IEPL|IPLC)/);
                            const region = match ? (match[1] || match[2] || match[3] || 'Unknown') : 'Unknown';
                            acc[region] = (acc[region] || 0) + 1;
                            return acc;
                        }, {}),
                    };
                    logger.success(`预览生成完成，共 ${previewNodes.length} 个节点。`);

                    logger.info('[预览通知流程] 准备触发预览通知...');
                    try {
                        c.executionCtx.waitUntil(handleAccess('preview'));
                        logger.success('[预览通知流程] waitUntil(handleAccess) 已成功调用，通知应在后台发送。');
                    } catch (e) {
                        logger.error('[预览通知流程] 调用 waitUntil 时发生同步错误。', { error: e });
                    }

                    return { type: 'json', payload: { success: true, data: { mode: content.generation_mode || 'local', nodes: previewNodes, analysis: analysis, logs: logger.logs } } };
                }
            }

            if (isLocalContentBase64) {
                c.executionCtx.waitUntil(handleAccess(targetClient));
                return { type: 'text', payload: Buffer.from(localContent, 'utf-8').toString('base64'), finalRequestType: targetClient };
            }

            if (subconverterUrlInput && (targetClient !== 'base64' || generationMode === 'remote')) {
                let finalTargetClient = targetClient;
                if (targetClient === 'base64' && generationMode === 'remote') {
                    finalTargetClient = 'clash'; // 远程模式若未指定客户端，则默认为 clash
                    logger.info(`远程模式未指定客户端，默认使用: ${finalTargetClient}`);
                }
                logger.info(`准备请求 Subconverter...`, { target: finalTargetClient });
                const backend = await c.env.DB.prepare("SELECT url FROM subconverter_assets WHERE id = ?").bind(content.subconverter_backend_id).first();
                const config = await c.env.DB.prepare("SELECT url FROM subconverter_assets WHERE id = ?").bind(content.subconverter_config_id).first();

                if (!backend || !config) {
                    logger.error('无法找到 Subconverter 后端或配置文件。');
                    c.executionCtx.waitUntil(handleAccess(targetClient));
                    return { type: 'text', payload: 'Subconverter 后端或配置文件未找到。', status: 500, finalRequestType: targetClient };
                }
                logger.info('已找到 Subconverter 后端和配置文件。', { backendUrl: (backend as any).url, configUrl: (config as any).url });

                const targetUrl = new URL((backend as any).url + '/sub');
                targetUrl.searchParams.set('target', finalTargetClient);
                targetUrl.searchParams.set('url', subconverterUrlInput);
                targetUrl.searchParams.set('config', (config as any).url);
                targetUrl.searchParams.set('filename', profile.name);

                logger.info('向 Subconverter 发起请求...', { url: targetUrl.toString() });
                const subResponse = await fetch(targetUrl.toString(), { headers: { 'User-Agent': userAgent } });

                if (!subResponse.ok) {
                    const errorText = await subResponse.text();
                    logger.error('Subconverter 请求失败。', { error: errorText });
                    c.executionCtx.waitUntil(handleAccess(finalTargetClient));
                    return { type: 'text', payload: `从 subconverter 生成失败: ${errorText}`, status: 502, finalRequestType: finalTargetClient };
                }
                logger.success('Subconverter 请求成功，正在返回订阅流。');
                c.executionCtx.waitUntil(handleAccess(finalTargetClient));
                return { type: 'stream', payload: subResponse, finalRequestType: finalTargetClient };
            }

            if (!subconverterUrlInput && !localContent) {
                logger.warn('没有为指定的客户端生成任何内容。');
                c.executionCtx.waitUntil(handleAccess(targetClient));
                return { type: 'text', payload: '没有为指定的客户端生成任何内容。', status: 404, finalRequestType: targetClient };
            }

            logger.error('没有为指定的客户端生成任何内容。');
            c.executionCtx.waitUntil(handleAccess(targetClient));
            return { type: 'text', payload: '没有为指定的客户端生成任何内容。', status: 404, finalRequestType: targetClient };
        };

        result = await mainLogic();


    } catch (e: any) {
        logger.error(`处理配置文件 '${profile.name}' 时发生致命错误`, { error: e.message, stack: e.stack });
        result = { type: 'text', payload: `内部服务器错误: ${e.message}`, status: 500 };
    }

    // 最终响应处理
    if (!result) {
        return c.text('未知错误导致没有响应生成。', 500);
    }

    // The isPreview logic has been moved inside mainLogic.
    // This block is now only for handling the final response.
    switch (result.type) {
        case 'json':
            return c.json(result.payload, result.status);
        case 'text':
            return c.text(result.payload, result.status);
        case 'stream':
            // Hono v3+ a可以直接返回 Response 对象
            // payload is already a Response object
            return result.payload;
        default:
            return c.text('未知的响应类型。', 500);
    }
};