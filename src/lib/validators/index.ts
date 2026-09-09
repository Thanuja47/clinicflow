import { z } from 'zod';

export const ClinicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const BranchSchema = z.object({
  name: z.string().min(2, 'Branch name required'),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export const StaffSchema = z.object({
  name: z.string().min(2, 'Staff name required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CLINIC_ADMIN', 'DOCTOR', 'RECEPTIONIST']),
  branchId: z.string().optional(),
  phone: z.string().optional(),
});

export const PatientSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  nic: z.string().optional(),
  phone: z.string().min(9, 'Valid phone number required'),
  dob: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  allergies: z.string().optional(),
});

export const AppointmentSchema = z.object({
  branchId: z.string().min(1, 'Branch required'),
  patientId: z.string().min(1, 'Patient required'),
  doctorId: z.string().min(1, 'Doctor required'),
  scheduledAt: z.string().min(1, 'Schedule date/time required'),
  notes: z.string().optional(),
});
