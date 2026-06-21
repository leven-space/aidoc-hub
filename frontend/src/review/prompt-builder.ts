import type { ReviewAnnotation, ReviewContext } from './types';

const SNIPPET_MAX = 500;

export type PromptLanguage = 'zh' | 'en';

export function truncateSnippet(snippet: string | undefined): string | undefined {
  if (!snippet) return undefined;
  const trimmed = snippet.trim();
  if (trimmed.length <= SNIPPET_MAX) return trimmed;
  return `${trimmed.slice(0, SNIPPET_MAX)}\n... (truncated)`;
}

export function buildReviewPrompt(
  annotations: ReviewAnnotation[],
  context: ReviewContext,
  language: PromptLanguage,
): string {
  const isZh = language === 'zh';
  const lines: string[] = [];

  if (isZh) {
    lines.push('AI Doc Hub 审阅修改建议');
    lines.push('---');
    lines.push(`仓库: ${context.repoName}`);
    lines.push(`文件: ${context.filePath}`);
    if (context.versionLabel) {
      const msg = context.commitMessage ? ` (${context.commitMessage})` : '';
      lines.push(`版本: ${context.versionLabel}${msg}`);
    }
    lines.push('');
    lines.push('请根据以下可视化审阅意见修改该 HTML 文件的源码。');
    lines.push('保留现有整体风格与结构，仅修改标注区域。');
    lines.push('');
  } else {
    lines.push('AI Doc Hub Review Change Request');
    lines.push('---');
    lines.push(`Repository: ${context.repoName}`);
    lines.push(`File: ${context.filePath}`);
    if (context.versionLabel) {
      const msg = context.commitMessage ? ` (${context.commitMessage})` : '';
      lines.push(`Version: ${context.versionLabel}${msg}`);
    }
    lines.push('');
    lines.push('Apply the visual review notes below to the HTML source file.');
    lines.push('Keep the overall style and structure; change only the annotated areas.');
    lines.push('');
  }

  annotations.forEach((annotation, index) => {
    const n = index + 1;
    const actionLabel = isZh ? '修改' : 'Modify';
    lines.push(`## ${isZh ? '意见' : 'Note'} ${n}：${actionLabel}`);
    lines.push(`- ${isZh ? '元素' : 'Element'}: ${annotation.locator.descriptor}`);
    lines.push(`- ${isZh ? '定位' : 'Locator'}: ${annotation.locator.cssPath}`);
    if (annotation.locator.slideContext) {
      lines.push(
        `- ${isZh ? '幻灯片上下文' : 'Slide context'}: ${annotation.locator.slideContext}`,
      );
    }
    const snippet = truncateSnippet(annotation.htmlSnippet);
    if (snippet) {
      lines.push(`- ${isZh ? '当前片段' : 'Current snippet'}:`);
      lines.push('```html');
      lines.push(snippet);
      lines.push('```');
    }
    lines.push(`- ${isZh ? '修改意见' : 'Change request'}: ${annotation.userNote}`);
    lines.push('');
  });

  if (isZh) {
    lines.push('---');
    lines.push('（可选）若使用 AI Doc Hub MCP，可先 read_file：');
    lines.push(
      `  workspaceId=${context.workspaceId} repoId=${context.repoId} path=${context.filePath}`,
    );
  } else {
    lines.push('---');
    lines.push('(Optional) If you use AI Doc Hub MCP, read_file first with:');
    lines.push(
      `  workspaceId=${context.workspaceId} repoId=${context.repoId} path=${context.filePath}`,
    );
  }

  return lines.join('\n');
}
