export interface MenuItem {
  id: number;
  name: string;
  route: string;
  icon?: string | null;
  displayOrder: number;
  children: MenuItem[];
}
