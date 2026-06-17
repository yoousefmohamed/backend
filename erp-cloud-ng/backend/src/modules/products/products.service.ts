import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
  ) {}

  async findAll(companyId: string, search?: string, categoryId?: string) {
    const query = this.productsRepo
      .createQueryBuilder('p')
      .where('p.company_id = :companyId', { companyId })
      .andWhere('p.is_active = true');

    if (search) {
      query.andWhere('(p.name ILIKE :search OR p.barcode ILIKE :search OR p.sku ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    if (categoryId) {
      query.andWhere('p.category_id = :categoryId', { categoryId });
    }

    return query.orderBy('p.name', 'ASC').getMany();
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('المنتج غير موجود');
    return product;
  }

  async findByBarcode(companyId: string, barcode: string): Promise<Product | null> {
    return this.productsRepo.findOne({ where: { companyId, barcode } });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productsRepo.create(data);
    return this.productsRepo.save(product);
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    await this.productsRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.productsRepo.update(id, { isActive: false });
  }
}
