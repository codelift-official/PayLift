// B2: CatalogRepository interface — designed for easy swap to API (V2)
// Static implementation reads from /public/catalogs/data.json
// V2 server implementation: replace StaticCatalogRepository with ApiCatalogRepository

export interface CatalogProduct {
  id: string;
  name: string;
  defaultPrice: number;
  gstRate: number;
  imageUrl?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  icon: string;
  imageUrl?: string;
  products: CatalogProduct[];
}

export interface Catalog {
  id: string;
  name: string;
  icon: string;
  description: string;
  imageUrl?: string;
  categories: CatalogCategory[];
}

export interface CatalogRepository {
  getCatalogs(): Promise<Catalog[]>;
  getCatalog(catalogId: string): Promise<Catalog | null>;
  getCategory(catalogId: string, categoryId: string): Promise<CatalogCategory | null>;
  searchProducts(query: string): Promise<Array<CatalogProduct & { catalogName: string; categoryName: string }>>;
}

// ─── Static Implementation (V1) ───────────────────────────────────
class StaticCatalogRepository implements CatalogRepository {
  private cache: Catalog[] | null = null;

  private async load(): Promise<Catalog[]> {
    if (this.cache) return this.cache;
    const res = await fetch('/catalogs/data.json');
    if (!res.ok) throw new Error('Failed to load catalog data');
    const json = await res.json();
    this.cache = json.catalogs as Catalog[];
    return this.cache;
  }

  async getCatalogs(): Promise<Catalog[]> {
    return this.load();
  }

  async getCatalog(catalogId: string): Promise<Catalog | null> {
    const catalogs = await this.load();
    return catalogs.find((c) => c.id === catalogId) ?? null;
  }

  async getCategory(catalogId: string, categoryId: string): Promise<CatalogCategory | null> {
    const catalog = await this.getCatalog(catalogId);
    return catalog?.categories.find((c) => c.id === categoryId) ?? null;
  }

  async searchProducts(
    query: string
  ): Promise<Array<CatalogProduct & { catalogName: string; categoryName: string }>> {
    const catalogs = await this.load();
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: Array<CatalogProduct & { catalogName: string; categoryName: string }> = [];

    for (const catalog of catalogs) {
      for (const category of catalog.categories) {
        for (const product of category.products) {
          if (product.name.toLowerCase().includes(q)) {
            results.push({
              ...product,
              catalogName: catalog.name,
              categoryName: category.name,
            });
          }
        }
      }
    }

    return results.slice(0, 20);
  }
}

// ─── Singleton export — swap this for ApiCatalogRepository in V2 ──
export const catalogRepository: CatalogRepository = new StaticCatalogRepository();
