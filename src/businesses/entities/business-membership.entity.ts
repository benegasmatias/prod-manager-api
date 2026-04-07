import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Unique } from 'typeorm';
import { Business } from './business.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessRole } from '../../common/enums';

@Entity('business_memberships')
// @Unique(['userId', 'businessId'])
export class BusinessMembership {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'business_id', type: 'uuid' })
    businessId: string;

    @ManyToOne(() => Business, (business) => business.memberships, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column({
        type: 'enum',
        enum: BusinessRole,
        default: BusinessRole.OPERATOR,
    })
    role: BusinessRole;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
