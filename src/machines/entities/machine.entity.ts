import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ProductionJob } from '../../jobs/entities/production-job.entity';
import { MachineStatus } from '../../common/enums';
import { Business } from '../../businesses/entities/business.entity';

@Entity('machines')
export class Machine {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Business, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Index()
    @Column({ name: 'business_id', nullable: true })
    businessId: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    model: string;

    @Column({ nullable: true })
    nozzle: string;

    @Column({ type: 'enum', enum: MachineStatus, default: MachineStatus.IDLE })
    status: MachineStatus;

    @Column({ name: 'max_filaments', type: 'int', default: 1 })
    maxFilaments: number;

    @Column({ default: true })
    active: boolean;

    @Column({ name: 'blocked_by_quota', default: false })
    blockedByQuota: boolean;

    @OneToMany(() => ProductionJob, (job) => job.machine)
    productionJobs: ProductionJob[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
