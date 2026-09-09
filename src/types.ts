export interface DesktopApp {
  id: string;
  name: string;
  path: string;
  mimeTypes: string[];
}

export interface MimeAssociation {
  mimeType: string;
  category: string;
  defaultAppId?: string;
}
