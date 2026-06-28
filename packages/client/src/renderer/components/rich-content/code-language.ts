const extensionLanguages = new Map<string, string>([
  ['astro', 'astro'],
  ['bat', 'bat'],
  ['c', 'c'],
  ['cmd', 'bat'],
  ['cpp', 'cpp'],
  ['cs', 'csharp'],
  ['css', 'css'],
  ['diff', 'diff'],
  ['dockerfile', 'docker'],
  ['go', 'go'],
  ['graphql', 'graphql'],
  ['h', 'c'],
  ['hpp', 'cpp'],
  ['html', 'html'],
  ['java', 'java'],
  ['js', 'javascript'],
  ['json', 'json'],
  ['jsonc', 'jsonc'],
  ['jsx', 'jsx'],
  ['kt', 'kotlin'],
  ['less', 'less'],
  ['lua', 'lua'],
  ['md', 'markdown'],
  ['mdx', 'mdx'],
  ['mjs', 'javascript'],
  ['php', 'php'],
  ['ps1', 'powershell'],
  ['py', 'python'],
  ['rb', 'ruby'],
  ['rs', 'rust'],
  ['scss', 'scss'],
  ['sh', 'shellscript'],
  ['sql', 'sql'],
  ['svelte', 'svelte'],
  ['ts', 'typescript'],
  ['tsx', 'tsx'],
  ['vue', 'vue'],
  ['xml', 'xml'],
  ['yaml', 'yaml'],
  ['yml', 'yaml']
])

const languageAliases = new Map<string, string>([
  ['bash', 'shellscript'],
  ['c++', 'cpp'],
  ['c#', 'csharp'],
  ['dockerfile', 'docker'],
  ['js', 'javascript'],
  ['md', 'markdown'],
  ['plaintext', 'plaintext'],
  ['ps', 'powershell'],
  ['shell', 'shellscript'],
  ['sh', 'shellscript'],
  ['text', 'plaintext'],
  ['ts', 'typescript']
])

export function normalizeCodeLanguage(value: string | undefined): string {
  const normalized = value?.trim().toLowerCase() ?? ''
  if (!normalized) return 'plaintext'

  return languageAliases.get(normalized) ?? normalized
}

export function getLanguageByFilename(filename: string | undefined): string {
  const name = filename?.trim().toLowerCase() ?? ''
  if (!name) return 'plaintext'

  const lastSegment = name.split(/[\\/]/).pop() ?? name
  if (extensionLanguages.has(lastSegment)) {
    return extensionLanguages.get(lastSegment) ?? 'plaintext'
  }

  const extension = lastSegment.includes('.') ? lastSegment.split('.').pop() : ''
  if (!extension) return 'plaintext'

  return extensionLanguages.get(extension) ?? 'plaintext'
}

export function resolveCodeLanguage(options: {
  language?: string
  filename?: string
}): string {
  if (options.language) return normalizeCodeLanguage(options.language)
  return getLanguageByFilename(options.filename)
}

export function extractFilename(path: string | undefined): string {
  if (!path) return ''
  return path.split(/[\\/]/).pop() ?? path
}
