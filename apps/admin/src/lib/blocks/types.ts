/**
 * Block types for the admin Block Registry system.
 *
 * Each section type in the DB (pageSections.type) maps to a BlockDefinition
 * that knows its expected JSON structure, validation schema, and editor form.
 */

import type { z } from 'zod'
import type { ComponentType } from 'react'

/** A single field definition inside a block's contentJson */
export interface FieldDefinition {
  name: string
  type: 'text' | 'textarea' | 'image' | 'number' | 'boolean' | 'array' | 'group'
  label: string
  labelUk?: string
  placeholder?: string
  placeholderUk?: string
  required?: boolean
  defaultValue?: unknown
  /** For array type: schema of each item */
  itemFields?: FieldDefinition[]
  /** For group type: nested fields */
  fields?: FieldDefinition[]
}

/** A block type registered in the system */
export interface BlockDefinition {
  /** Matches pageSections.type */
  type: string
  label: string
  labelUk: string
  icon: string
  description: string
  fields: FieldDefinition[]
  defaultContent: Record<string, unknown>
  /**
   * Editor form component — receives content + onChange.
   * If omitted, DynamicBlockEditor auto-generates form from `fields`.
   */
  editor?: ComponentType<BlockEditorProps>
}

/** Props passed to each block's editor component */
export interface BlockEditorProps {
  content: Record<string, unknown>
  onChange: (content: Record<string, unknown>) => void
  locale: 'ru' | 'uk'
}

/** Wrapper around contentJson for the editor panel */
export interface BlockContent {
  /** Parsed content for current locale */
  ru: Record<string, unknown>
  uk: Record<string, unknown>
}
