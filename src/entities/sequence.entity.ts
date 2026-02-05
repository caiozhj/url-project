import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('sequences')
export class Sequence {
  @PrimaryColumn()
  name: string;

  @Column({ type: 'bigint', default: 0 })
  value: number;
}
