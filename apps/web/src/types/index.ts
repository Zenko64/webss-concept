export interface Route {
  path: string;
  element: React.ReactNode;
  /** If provided, this route will show the sidebar*/
  sidebar?: boolean;
  /** If true, route is accessible without authentication */
  public?: boolean;
}
