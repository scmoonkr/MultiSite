import { ObjectId, type Db } from 'mongodb'
import type { ContentDetail, ContentSummary } from '../../shared/types'
import { parseMarkdownBlocks, blocksToPlainText } from '../lib/markdown-blocks.mjs'
import { validateParsedBlocks, applyBlockDefaults } from '../lib/markdown-blocks-validator.mjs'
import { slugify } from './http'
import { getMediaByIds } from './media'

export const CONTENT_STATUSES = ['draft', 'published', 'hidden', 'deleted']
export const ACCESS_LEVELS = ['public', 'member', 'employee', 'manager', 'admin']

type BlockNode = { type: string, props: Record<string, any> }

// Walk every block node, recursing into row columns so container blocks don't
// hide their children. Labels follow the validator's "Block #N > 컬럼 #M" format.
function walkBlocks(nodes: BlockNode[], fn: (node: BlockNode, label: string) => void, prefix = '') {
  nodes.forEach((node, index) => {
    const label = `${prefix}Block #${index + 1}`
    fn(node, label)
    if (node.type === 'row' && Array.isArray(node.props?.columns)) {
      node.props.columns.forEach((column: BlockNode[], c: number) => {
        if (Array.isArray(column)) walkBlocks(column, fn, `${label} > 컬럼 #${c + 1} > `)
      })
    }
  })
}

function imageIdsOfNode(node: BlockNode): string[] {
  const props = node.props || {}
  const fromItems = () => (Array.isArray(props.items) ? props.items : []).map((item: any) => item?.imageId)
  let ids: unknown[] = []
  if (node.type === 'gallery') ids = Array.isArray(props.imageIds) ? props.imageIds : []
  else if (['imageGrid', 'slide', 'timeline', 'mediaText'].includes(node.type)) ids = fromItems()
  else if (['title', 'heroCards', 'image'].includes(node.type)) ids = [props.imageId]
  return ids.filter((id): id is string => typeof id === 'string' && !!id)
}

export function collectImageIds(nodes: BlockNode[]) {
  const ids = new Set<string>()
  walkBlocks(nodes, node => imageIdsOfNode(node).forEach(id => ids.add(id)))
  return [...ids]
}

function missingImageErrors(nodes: BlockNode[], mediaMap: Record<string, unknown>) {
  const errors: string[] = []
  walkBlocks(nodes, (node, label) => {
    const missing = imageIdsOfNode(node).filter(id => !mediaMap[id])
    if (missing.length) errors.push(`${label} (${node.type}): 미디어에서 찾을 수 없는 imageId — ${missing.join(', ')}`)
  })
  return errors
}

// Parse + validate + apply defaults. Image references are checked against the
// site's own media only, so a block cannot point at another site's upload.
async function parseBlocks(db: Db, siteId: string, markdown: string) {
  const parsed = parseMarkdownBlocks(markdown || '')
  const schemaErrors: string[] = validateParsedBlocks(parsed)
  const blocks: BlockNode[] = applyBlockDefaults(parsed)
  const ids = collectImageIds(blocks)
  const mediaMap = ids.length ? await getMediaByIds(db, siteId, ids) : {}
  return { blocks, mediaMap, errors: [...schemaErrors, ...missingImageErrors(blocks, mediaMap)] }
}

// Dry-run for the editor preview: returns errors instead of throwing.
export async function previewMarkdown(db: Db, siteId: string, markdown: string) {
  const { blocks, mediaMap, errors } = await parseBlocks(db, siteId, markdown)
  const notes: string[] = []
  return { blocks: await resolveSiteContentBlocks(db, blocks, notes), mediaMap, errors: [...errors, ...notes] }
}

// Fill every `siteContent` block with the blocks + media of the content it
// points at. Runs at read time (never stored) so the embed follows its source.
// Only published, public-access content can be embedded. Embeds inside the
// embedded content are dropped, which also rules out A → B → A loops.
// When `notes` is given (editor preview), unresolved embeds are explained there
// and in the block itself; on public pages they simply render nothing.
export async function resolveSiteContentBlocks(db: Db, blocks: BlockNode[], notes?: string[]): Promise<BlockNode[]> {
  const stripEmbeds = (nodes: BlockNode[]): BlockNode[] => nodes
    .filter(node => node.type !== 'siteContent')
    .map(node => node.type === 'row' && Array.isArray(node.props?.columns)
      ? { ...node, props: { ...node.props, columns: node.props.columns.map(stripEmbeds) } }
      : node)

  const resolveNodes = (nodes: BlockNode[]): Promise<BlockNode[]> => Promise.all(nodes.map(async (node) => {
    if (node.type === 'row' && Array.isArray(node.props?.columns)) {
      return { ...node, props: { ...node.props, columns: await Promise.all(node.props.columns.map(resolveNodes)) } }
    }
    if (node.type !== 'siteContent') return node
    const sourceSiteId = String(node.props?.siteId || '')
    const filter: any = { ...publicContentFilter(sourceSiteId), slug: String(node.props?.slug || '') }
    if (['post', 'page'].includes(node.props?.contentType)) filter.contentType = node.props.contentType
    const source = await db.collection('contents').findOne(filter)
    if (!source) {
      const note = `siteContent: '${sourceSiteId}' 사이트에서 공개된 '${filter.slug}' 글을 찾을 수 없습니다.`
      notes?.push(note)
      return notes ? { ...node, props: { ...node.props, previewNote: note } } : node
    }
    const embedded = stripEmbeds(blocksOf(source))
    const ids = collectImageIds(embedded)
    // Images belong to the source site, so they are looked up there.
    const mediaMap = ids.length ? await getMediaByIds(db, sourceSiteId, ids) : {}
    return { ...node, props: { ...node.props, blocks: embedded, mediaMap } }
  }))

  return resolveNodes(blocks)
}

// Compile markdown into the cached fields stored on a content document.
export async function compileMarkdown(db: Db, siteId: string, markdown: string) {
  const { blocks, errors } = await parseBlocks(db, siteId, markdown)
  if (errors.length) throw createError({ statusCode: 400, message: `Block validation: ${errors.join(' | ')}` })
  return { blocks, plainText: blocksToPlainText(blocks) as string }
}

// Blocks for rendering. Documents saved before the block compiler existed have
// no cached `blocks`, so they are parsed from markdown on read.
export function blocksOf(content: any): BlockNode[] {
  if (Array.isArray(content.blocks)) return content.blocks
  const parsed = parseMarkdownBlocks(content.markdown || '')
  validateParsedBlocks(parsed)
  return applyBlockDefaults(parsed)
}

export function normalizeIdList(input: unknown) {
  return Array.isArray(input) ? [...new Set(input.map(String).filter(id => ObjectId.isValid(id)))] : []
}

export function serializeContent(content: any): ContentDetail {
  return {
    id: String(content._id),
    contentType: content.contentType,
    title: content.title,
    slug: content.slug,
    summary: content.summary || '',
    status: content.status,
    accessLevel: content.accessLevel || 'public',
    categoryIds: (content.categoryIds || []).map(String),
    tagIds: (content.tagIds || []).map(String),
    thumbnailImageId: content.thumbnailImageId ? String(content.thumbnailImageId) : null,
    publishedAt: content.publishedAt?.toISOString?.() || content.publishedAt || null,
    updatedAt: content.updatedAt?.toISOString?.() || content.updatedAt,
    markdown: content.markdown || '',
    blocks: blocksOf(content),
    template: content.template || null,
    meta: content.meta || {},
  }
}

export function serializeContentSummary(content: any): ContentSummary {
  return {
    id: String(content._id),
    contentType: content.contentType,
    title: content.title,
    slug: content.slug,
    summary: content.summary || '',
    status: content.status,
    accessLevel: content.accessLevel || 'public',
    categoryIds: (content.categoryIds || []).map(String),
    tagIds: (content.tagIds || []).map(String),
    thumbnailImageId: content.thumbnailImageId ? String(content.thumbnailImageId) : null,
    publishedAt: content.publishedAt?.toISOString?.() || content.publishedAt || null,
    updatedAt: content.updatedAt?.toISOString?.() || content.updatedAt,
    meta: content.meta || {},
  }
}

export async function uniqueSlug(collection: any, siteId: string, desired: unknown, title: unknown, excludeId?: ObjectId) {
  const base = slugify(desired) || slugify(title) || `content-${Date.now()}`
  let candidate = base
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const query: any = { siteId, slug: candidate }
    if (excludeId) query._id = { $ne: excludeId }
    if (!await collection.findOne(query, { projection: { _id: 1 } })) return candidate
    candidate = `${base}-${suffix}`
  }
  throw createError({ statusCode: 409, statusMessage: '사용 가능한 slug를 만들 수 없습니다.' })
}

// `anyAccess` keeps role-gated documents in the result; the single-content
// endpoint needs them to answer "locked" instead of 404.
export function publicContentFilter(siteId: string, { anyAccess = false } = {}) {
  const now = new Date()
  const and: any[] = [
    { $or: [{ publishedAt: null }, { publishedAt: { $lte: now } }] },
    { $or: [{ expiredAt: null }, { expiredAt: { $gt: now } }, { expiredAt: { $exists: false } }] },
  ]
  if (!anyAccess) and.push({ $or: [{ accessLevel: 'public' }, { accessLevel: null }, { accessLevel: { $exists: false } }] })
  return {
    siteId,
    status: 'published',
    visibility: 'public',
    isDeleted: { $ne: true },
    $and: and,
  }
}
