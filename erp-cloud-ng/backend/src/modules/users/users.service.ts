import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async findByUsername(companyId: string, username: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { companyId, username },
      relations: ['role', 'role.permissions', 'branch', 'company'],
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: ['role', 'role.permissions', 'branch', 'company'],
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }

  async findAllByCompany(companyId: string): Promise<User[]> {
    return this.usersRepo.find({
      where: { companyId },
      relations: ['role', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async create(data: Partial<User> & { password: string }): Promise<User> {
    const existing = await this.usersRepo.findOne({
      where: { companyId: data.companyId, username: data.username },
    });
    if (existing) throw new ConflictException('اسم المستخدم مستخدم بالفعل');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepo.create({ ...data, passwordHash });
    return this.usersRepo.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    await this.usersRepo.update(id, data);
    return this.findById(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepo.update(id, { lastLoginAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepo.delete(id);
  }

  async validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
