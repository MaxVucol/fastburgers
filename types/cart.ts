export type CartOption = {
  id: string;
  name: string;
  price: number;
};

export type CartLine = {
  /** productId + sorted option ids — identical configurations merge into one line. */
  key: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  /** Base product price in bani (snapshot for display; server recomputes). */
  basePrice: number;
  options: CartOption[];
  quantity: number;
};
