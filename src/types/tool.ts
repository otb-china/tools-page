export interface ToolItem {
  id: string;
  name: string;
  url: string;
  updatedAt: string;
}

export interface DeletedToolItem extends ToolItem {
  deletedAt: string;
}

export interface ToolsPageBackupData {
  tools?: unknown;
  deletedTools?: unknown;
}
