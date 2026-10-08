// 简易路径匹配器（替代 Spring 的 AntPathMatcher）
// 支持：精确字符串、`*` 匹配单段、`**` 匹配多段
// 例：/api/test、/api/user/*、/files/**

export function pathToRegexp(pattern) {
  // 转义除分隔符外的正则元字符
  const escaped = pattern
    .split('/')
    .map((seg) => {
      if (seg === '**') return '.*';
      if (seg.includes('*')) {
        return seg.replace(/\*/g, '[^/]*');
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return new RegExp(`^${escaped}$`);
}
