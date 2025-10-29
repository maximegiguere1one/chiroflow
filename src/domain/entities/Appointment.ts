import { z } from 'zod';

export const AppointmentStatusSchema = z.enum([
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  serviceTypeId: z.string().uuid().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  status: AppointmentStatusSchema,
  notes: z.string().optional(),
  reminderSent: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reminderSent: true,
}).extend({
  status: AppointmentStatusSchema.default('scheduled'),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = AppointmentSchema.partial().required({ id: true });

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;
