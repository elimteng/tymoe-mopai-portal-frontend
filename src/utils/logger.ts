type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 }

function currentLevel(): LogLevel {
  const env = import.meta.env.MODE
  // 默认开发输出 debug，生产输出 info
  return env === 'development' ? 'debug' : 'info'
}

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= levelOrder[currentLevel()]
}

function time() {
  return new Date().toISOString()
}

export const logger = {
  debug: (...args: unknown[]) => shouldLog('debug') && console.debug(`[${time()}][debug]`, ...args),
  info: (...args: unknown[]) => shouldLog('info') && console.info(`[${time()}][info]`, ...args),
  warn: (...args: unknown[]) => shouldLog('warn') && console.warn(`[${time()}][warn]`, ...args),
  error: (...args: unknown[]) => shouldLog('error') && console.error(`[${time()}][error]`, ...args)
}
