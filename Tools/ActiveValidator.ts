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
    
    const coordinator = new UsageSyncCoordinator();
    
    // 注册支持主动检查的厂商
    const providers = [
      { name: 'anthropic', sync: new AnthropicSync() },
      { name: 'openai', sync: new OpenAISync() },
      { name: 'github', sync: new GitHubSync() },
      { name: 'gemini', sync: new GeminiSync() },
      { name: 'zhipu', sync: new ZhiPuSync() },
      { name: 'deepseek', sync: new DeepSeekSync() },
      { name: 'siliconflow', sync: new SiliconFlowSync() }
    ];
    
    const results: Array<[string, string, string]> = [];
    let healthyCount = 0;
    
    for (const p of providers) {
      try {
        const isHealthy = await p.sync.healthCheck();
        const status = isHealthy ? colorize("Healthy", "green") : colorize("Degraded", "yellow");
        const detail = isHealthy ? "Connected" : "Connection failed or rate limited";
        
        if (isHealthy) healthyCount++;
        
        results.push([p.name, status, detail]);
        
        // 如果不健康且之前未记录，可以考虑自动记录到 HealthManager（动态治理雛形）
        if (!isHealthy) {
          // 暂时不自动禁用，仅记录日志或通过 CLI 让用户手动操作
        }
      } catch (err) {
        results.push([p.name, colorize("Error", "red"), String(err)]);
      }
    }
    
    const headers = ["Provider", "Status", "Detail"];
    console.log(formatTable(headers, results));
    console.log(`\n完成: ${healthyCount}/${providers.length} 厂商健康`);
    
    // 打印当前手动禁用的项
    const disabled = await defaultHealthManager.getDisabledItems();
    if (disabled.providers.length > 0 || disabled.models.length > 0) {
      console.log(colorize("\n当前手动禁用的项:", "yellow"));
      if (disabled.providers.length > 0) console.log(`  Providers: ${disabled.providers.join(', ')}`);
      if (disabled.models.length > 0) console.log(`  Models: ${disabled.models.join(', ')}`);
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
