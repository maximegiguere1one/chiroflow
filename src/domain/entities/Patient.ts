import { z } from 'zod';

export const PatientSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Numéro de téléphone invalide (10 chiffres)'),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().regex(/^[0-9]{10}$/).optional(),
  notes: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Patient = z.infer<typeof PatientSchema>;

export const CreatePatientSchema = PatientSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = PatientSchema.partial().required({ id: true });

export type UpdatePatientInput = z.infer<typeof UpdatePatientSchema>;
