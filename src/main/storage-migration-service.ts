import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'fs'
import { basename, dirname, extname, join, resolve, sep } from 'path'

export interface StorageMigrationResult {
  copied: number
  renamed: number
  removedSource: boolean
}

export interface StorageMigrationOptions {
  keepSource: boolean
}

function uniquePath(path: string): { path: string; renamed: boolean } {
  if (!existsSync(path)) return { path, renamed: false }

  const dir = dirname(path)
  const ext = extname(path)
  const base = basename(path, ext)
  let index = 2
  let candidate = join(dir, `${base} ${index}${ext}`)

  while (existsSync(candidate)) {
    index += 1
    candidate = join(dir, `${base} ${index}${ext}`)
  }

  return { path: candidate, renamed: true }
}

function copyEntry(source: string, target: string): { copied: number; renamed: number } {
  const sourceStat = statSync(source)

  if (sourceStat.isDirectory()) {
    if (existsSync(target) && statSync(target).isDirectory()) {
      return copyDirectoryContents(source, target)
    }

    const unique = uniquePath(target)
    mkdirSync(unique.path, { recursive: true })
    const result = copyDirectoryContents(source, unique.path)
    return {
      copied: result.copied,
      renamed: result.renamed + (unique.renamed ? 1 : 0)
    }
  }

  const unique = uniquePath(target)
  mkdirSync(dirname(unique.path), { recursive: true })
  copyFileSync(source, unique.path)
  return { copied: 1, renamed: unique.renamed ? 1 : 0 }
}

function copyDirectoryContents(sourceDir: string, targetDir: string): { copied: number; renamed: number } {
  mkdirSync(targetDir, { recursive: true })
  let copied = 0
  let renamed = 0

  for (const entry of readdirSync(sourceDir)) {
    const result = copyEntry(join(sourceDir, entry), join(targetDir, entry))
    copied += result.copied
    renamed += result.renamed
  }

  return { copied, renamed }
}

export function migrateStorage(
  sourcePath: string,
  targetPath: string,
  options: StorageMigrationOptions
): StorageMigrationResult {
  const source = resolve(sourcePath)
  const target = resolve(targetPath)

  if (source === target) throw new Error('Source and target storage paths are the same')
  if (target.startsWith(`${source}${sep}`)) {
    throw new Error('Target storage path cannot be inside source storage path')
  }
  if (!existsSync(source)) throw new Error(`Source storage path does not exist: ${source}`)

  const result = copyDirectoryContents(source, target)

  if (!options.keepSource) {
    rmSync(source, { recursive: true, force: true })
  }

  return { ...result, removedSource: !options.keepSource }
}
