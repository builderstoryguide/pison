// =====================================================
// TIMETABLE DATABASE TYPES
// =====================================================
// TypeScript interfaces matching the database schema
// for timetable management functionality.
// 
// Author: School Management System
// Date: December 2024
// =====================================================

export interface TimetableClass {
  id: string
  class_id: string
  name: string
  level: string
  subsystem: 'english' | 'french'
  branch: 'grammar' | 'technical' | 'commercial'
  academic_year: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableTeacher {
  id: string
  teacher_id: string
  name: string
  email?: string
  phone?: string
  max_periods_per_day: number
  max_periods_per_week: number
  preferred_days?: string[]
  preferred_times?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableRoom {
  id: string
  name: string
  room_number?: string
  capacity: number
  room_type: 'classroom' | 'laboratory' | 'library' | 'hall' | 'computer_lab' | 'science_lab'
  building?: string
  floor?: number
  equipment?: string[]
  is_available: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableSubject {
  id: string
  name: string
  code: string
  description?: string
  credits: number
  hours_per_week: number
  subject_type: 'core' | 'elective' | 'optional'
  applicable_subsystems: string[]
  applicable_branches: string[]
  applicable_levels?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableTeacherSubject {
  id: string
  teacher_id: string
  subject_id: string
  proficiency_level: 'beginner' | 'intermediate' | 'expert'
  years_of_experience: number
  is_primary: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetablePeriod {
  id: string
  schedule_id?: string
  class_id: string
  subject_id: string
  teacher_id: string
  room_id: string
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday'
  start_time: string
  end_time: string
  period_number: number
  period_type: 'regular' | 'break' | 'lunch' | 'assembly' | 'exam'
  is_break: boolean
  notes?: string
  created_at: string
  updated_at: string
}

export interface TimetableSchedule {
  id: string
  name: string
  academic_year: string
  term: 'first' | 'second' | 'third'
  start_date: string
  end_date: string
  is_active: boolean
  is_template: boolean
  created_by?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export interface TimetableConstraint {
  id: string
  constraint_type: 'teacher_availability' | 'room_availability' | 'subject_requirement' | 'break_requirement' | 'lunch_requirement'
  constraint_name: string
  description?: string
  teacher_id?: string
  room_id?: string
  subject_id?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
  is_blocked: boolean
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableTimeSlot {
  id: string
  slot_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  slot_number: number
  is_break: boolean
  break_type: 'regular' | 'lunch' | 'assembly'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableGenerationLog {
  id: string
  generation_type: 'automatic' | 'manual' | 'regenerate'
  class_id: string
  generated_by?: string
  status: 'started' | 'completed' | 'failed' | 'cancelled'
  total_periods_generated: number
  conflicts_resolved: number
  generation_time_seconds?: number
  error_message?: string
  generated_at: string
  completed_at?: string
}

// =====================================================
// VIEW TYPES
// =====================================================

export interface ClassTimetableView {
  class_id: string
  class_name: string
  level: string
  subsystem: string
  branch: string
  academic_year: string
  period_id?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
  period_number?: number
  subject_name?: string
  teacher_name?: string
  room_name?: string
  room_type?: string
  period_type?: string
  is_break?: boolean
  notes?: string
}

export interface TeacherTimetableView {
  teacher_id: string
  teacher_name: string
  period_id?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
  period_number?: number
  subject_name?: string
  class_name?: string
  room_name?: string
  period_type?: string
  is_break?: boolean
  notes?: string
}

export interface RoomTimetableView {
  room_id: string
  room_name: string
  room_type: string
  capacity: number
  period_id?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
  period_number?: number
  subject_name?: string
  teacher_name?: string
  class_name?: string
  period_type?: string
  is_break?: boolean
  notes?: string
}

export interface TimetableConflictView {
  conflict_type: string
  entity_name: string
  day_of_week: string
  start_time: string
  end_time: string
  class1: string
  class2: string
  conflict_description: string
}

// =====================================================
// FUNCTION RETURN TYPES
// =====================================================

export interface TimetableConflict {
  conflict_type: string
  conflict_description: string
  conflicting_entity: string
}

export interface AvailableTimeSlot {
  slot_id: string
  slot_name: string
  start_time: string
  end_time: string
  is_available: boolean
}

// =====================================================
// API REQUEST/RESPONSE TYPES
// =====================================================

export interface GenerateTimetableRequest {
  class_id: string
  academic_year: string
  term: 'first' | 'second' | 'third'
  constraints?: TimetableConstraint[]
}

export interface GenerateTimetableResponse {
  success: boolean
  schedule_id?: string
  error?: string
  total_periods?: number
  conflicts_resolved?: number
  generation_time?: number
}

export interface CheckConflictsRequest {
  class_id?: string
  teacher_id?: string
  room_id?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
}

export interface CheckConflictsResponse {
  conflicts: TimetableConflict[]
  has_conflicts: boolean
}

export interface GetAvailableSlotsRequest {
  day_of_week: string
  class_id?: string
  teacher_id?: string
  room_id?: string
}

export interface GetAvailableSlotsResponse {
  slots: AvailableTimeSlot[]
}

// =====================================================
// ENUM TYPES
// =====================================================

export enum DayOfWeek {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday'
}

export enum Subsystem {
  ENGLISH = 'english',
  FRENCH = 'french'
}

export enum Branch {
  GRAMMAR = 'grammar',
  TECHNICAL = 'technical',
  COMMERCIAL = 'commercial'
}

export enum RoomType {
  CLASSROOM = 'classroom',
  LABORATORY = 'laboratory',
  LIBRARY = 'library',
  HALL = 'hall',
  COMPUTER_LAB = 'computer_lab',
  SCIENCE_LAB = 'science_lab'
}

export enum SubjectType {
  CORE = 'core',
  ELECTIVE = 'elective',
  OPTIONAL = 'optional'
}

export enum PeriodType {
  REGULAR = 'regular',
  BREAK = 'break',
  LUNCH = 'lunch',
  ASSEMBLY = 'assembly',
  EXAM = 'exam'
}

export enum ConstraintType {
  TEACHER_AVAILABILITY = 'teacher_availability',
  ROOM_AVAILABILITY = 'room_availability',
  SUBJECT_REQUIREMENT = 'subject_requirement',
  BREAK_REQUIREMENT = 'break_requirement',
  LUNCH_REQUIREMENT = 'lunch_requirement'
}

export enum GenerationType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
  REGENERATE = 'regenerate'
}

export enum GenerationStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// =====================================================
// UTILITY TYPES
// =====================================================

export type TimetablePeriodWithDetails = TimetablePeriod & {
  subject?: TimetableSubject
  teacher?: TimetableTeacher
  room?: TimetableRoom
  class?: TimetableClass
}

export type TimetableScheduleWithPeriods = TimetableSchedule & {
  periods: TimetablePeriodWithDetails[]
}

export type TimetableClassWithSchedule = TimetableClass & {
  schedule?: TimetableScheduleWithPeriods
}

// =====================================================
// END OF TIMETABLE DATABASE TYPES
// =====================================================
