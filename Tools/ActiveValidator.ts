import { defaultHealthManager } from './HealthManager';
import { UsageSyncCoordinator, AnthropicSync, OpenAISync, GitHubSync, GeminiSync, ZhiPuSync, DeepSeekSync, SiliconFlowSync } from './UsageSync';
import { colorize, success, error, warning, info, formatTable } from './FormatUtils';

/**
 * 主动校验器
 * 负责对各 Provider 进行实际的连通性和健康度检查
 */
export class ActiveValidator {
  
  /**
   * 执行全量健康检查
   */
  async checkAll(): Promise<void> {
    info("开始执行主动健康检查...");
    
    const providers = [
      { name: 'anthropic', create: () => new AnthropicSync() },
      { name: 'openai', create: () => new OpenAISync() },
      { name: 'github', create: () => new GitHubSync() },
      { name: 'gemini', create: () => new GeminiSync() },
      { name: 'zhipu', create: () => new ZhiPuSync() },
      { name: 'deepseek', create: () => new DeepSeekSync() },
      { name: 'siliconflow', create: () => new SiliconFlowSync() }
    ];
    
    const results: Array<[string, string, string]> = [];
    let healthyCount = 0;
    
    for (const p of providers) {
      try {
        const sync = p.create();
        const isHealthy = await sync.healthCheck();
        const status = isHealthy ? colorize("Healthy", "green") : colorize("Degraded", "yellow");
        const detail = isHealthy ? "Connected" : "Connection failed or rate limited";
        
        if (isHealthy) healthyCount++;
        
        results.push([p.name, status, detail]);
        
        if (!isHealthy) {
          // Phase 2: 自动化记录降级（可选，目前保持观察）
        }
      } catch (err) {
        results.push([p.name, colorize("Skip", "yellow"), "Credentials missing or init failed"]);
      }
    }
    
    const headers = ["Provider", "Status", "Detail"];
    console.log(formatTable(headers, results));
    console.log(`\n完成: ${healthyCount}/${providers.length} 厂商在线`);
    
    // 打印当前手动禁用的项
    const disabled = await defaultHealthManager.getDisabledItems();
    if (disabled.providers.length > 0 || disabled.models.length > 0 || disabled.degraded.length > 0) {
      console.log(colorize("\n当前治理列表 (Governance List):", "yellow"));
      if (disabled.providers.length > 0) console.log(`  Disabled Providers: ${disabled.providers.join(', ')}`);
      if (disabled.models.length > 0) console.log(`  Disabled Models:    ${disabled.models.join(', ')}`);
      if (disabled.degraded.length > 0) console.log(`  Degraded Items:     ${disabled.degraded.join(', ')}`);
    }
  }


  /**
   * 检查特定项的当前健康状态（包含手动禁用状态）
   */
  async getEffectiveStatus(target: string): Promise<{ healthy: boolean, reason?: string }> {
    const disabled = await defaultHealthManager.isDisabled(target);
    if (disabled) {
      const summary = await defaultHealthManager.getStatusSummary();
      return { healthy: false, reason: summary.issues[target] || "Manually disabled" };
    }
    
    // 这里的逻辑可以进一步扩展为实时检查，但为了性能通常建议先查缓存/状态文件
    return { healthy: true };
  }
}

export const defaultActiveValidator = new ActiveValidator();
