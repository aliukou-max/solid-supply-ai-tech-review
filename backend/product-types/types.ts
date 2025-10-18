export interface ProductType {
  id: string;
  name: string;
  createdAt: Date;
}

export interface ProductTypePart {
  id: string;
  productTypeId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
}

export interface CreateProductTypeRequest {
  name: string;
}

export interface UpdateProductTypeRequest {
  id: string;
  name: string;
}

export interface DeleteProductTypeRequest {
  id: string;
}

export interface CreateProductTypePartRequest {
  productTypeId: string;
  name: string;
  sortOrder?: number;
}

export interface UpdateProductTypePartRequest {
  id: string;
  name: string;
  sortOrder?: number;
}

export interface DeleteProductTypePartRequest {
  id: string;
}

export interface ListProductTypePartsRequest {
  productTypeId: string;
}
