export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
};

export type ProductOptionView = {
  id: string;
  name: string;
  price: number;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: number;
  oldPrice: number | null;
  image: string;
  popular: boolean;
  featured: boolean;
  isNew: boolean;
  spicy: boolean;
  /** Listed but temporarily not orderable. */
  soldOut: boolean;
  weight: number | null;
  weightUnit: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  optionCount: number;
  createdAt: Date;
};

export type ProductDetail = ProductCardData & {
  images: string[];
  ingredients: string[];
  allergens: string[];
  calories: number | null;
  options: ProductOptionView[];
};

export type Review = {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  text: string;
  createdAt: Date;
};

export type PickupLocation = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
};
