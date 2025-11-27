/**
 * Interface du repository Transformation
 */

import { ITransformationDocument } from '../../../infrastructure/database/mongodb/models/TransformationModel';

export interface ITransformationRepository {
  create(data: Partial<ITransformationDocument>): Promise<ITransformationDocument>;
  findById(transformationId: string): Promise<ITransformationDocument | null>;
  findByIdAndUser(
    transformationId: string,
    userId: string
  ): Promise<ITransformationDocument | null>;
  findByUser(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<{ transformations: ITransformationDocument[]; total: number }>;
  update(
    transformationId: string,
    updates: Partial<ITransformationDocument>
  ): Promise<ITransformationDocument | null>;
  delete(transformationId: string): Promise<boolean>;
  updateStatus(transformationId: string, status: string, progress?: number): Promise<void>;
  markAsCompleted(transformationId: string, result: any): Promise<void>;
  markAsFailed(transformationId: string, error: any): Promise<void>;
  countTotal(): Promise<number>;
  countByStatus(): Promise<Record<string, number>>;
}
