import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import type { RepeatEnd, RepeatRule } from '../lib/repeat'

// ---- Better Auth tables (names and columns match its Drizzle adapter) ----
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  isAnonymous: boolean('is_anonymous').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ---- App tables: every row belongs to one user ----
export const category = pgTable(
  'category',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    color: text('color').notNull().default('lavender'),
    icon: text('icon').notNull().default('folder'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('category_user_idx').on(t.userId)],
)

export const task = pgTable(
  'task',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    categoryId: text('category_id'),
    startDate: text('start_date'),
    startTime: text('start_time'),
    endTime: text('end_time'),
    dueDate: text('due_date'),
    priority: text('priority').notNull().default('medium'),
    status: text('status').notNull().default('todo'),
    completedAt: timestamp('completed_at'),
    remind: boolean('remind').notNull().default(false),
    // Repeating tasks: one open task per series, finishing it makes the next.
    repeatRule: jsonb('repeat_rule').$type<RepeatRule>(),
    repeatEnd: jsonb('repeat_end').$type<RepeatEnd>(),
    // Reminders: minutes before the start (null off), and the exact moment to fire (null once sent).
    remindOffset: integer('remind_offset'),
    remindAt: timestamp('remind_at'),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    index('task_user_idx').on(t.userId),
    index('task_remind_at_idx').on(t.remindAt),
  ],
)

export const subtask = pgTable(
  'subtask',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    taskId: text('task_id').notNull(),
    title: text('title').notNull(),
    done: boolean('done').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('subtask_task_idx').on(t.taskId)],
)

export const note = pgTable(
  'note',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    title: text('title').notNull().default(''),
    body: text('body').notNull().default(''),
    color: text('color').notNull().default('surface'),
    pinned: boolean('pinned').notNull().default(false),
    taskId: text('task_id'),
    isScratchpad: boolean('is_scratchpad').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('note_user_idx').on(t.userId)],
)

export const prefs = pgTable('prefs', {
  userId: text('user_id').primaryKey(),
  displayName: text('display_name'),
  theme: text('theme').notNull().default('dark'),
  seeded: boolean('seeded').notNull().default(false),
  sounds: boolean('sounds').notNull().default(true),
  // Set when the welcome screen is finished or skipped. Null means not seen yet.
  onboardedAt: timestamp('onboarded_at'),
  // Save nudges: the ISO day each one was dismissed. Null means none dismissed yet.
  nudgeState: jsonb('nudge_state').$type<NudgeState>(),
  // Guest ids waiting for the merge prompt after a Google sign in (both sides had data).
  pendingMerge: jsonb('pending_merge').$type<string[]>(),
  // IANA name such as Africa/Lagos; reminders count in it.
  timezone: text('timezone'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export interface NudgeState {
  task?: string
  days?: string
  /** The day the reminders pre prompt was last dismissed (7 day rest). */
  notify?: string
}

// One row per browser that turned on reminders. Removed when the push service says it's gone.
export const pushSubscription = pgTable(
  'push_subscription',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    endpoint: text('endpoint').notNull().unique(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('push_subscription_user_idx').on(t.userId)],
)

// AI calls per user per UTC day (Phase 3 limit: 20 a day).
export const aiUsage = pgTable(
  'ai_usage',
  {
    userId: text('user_id').notNull(),
    day: text('day').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
)

// Habits (PRD Phase 2): routines with streaks. Frequency is daily, weekdays (days_of_week,
// ISO 1 Mon to 7 Sun, default Mon to Fri) or x_per_week (times_per_week). goal_days null = ongoing.
export const habit = pgTable(
  'habit',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    name: text('name').notNull(),
    icon: text('icon').notNull().default('flame'),
    categoryId: text('category_id'),
    color: text('color').notNull().default('butter'),
    frequency: text('frequency').notNull().default('daily'),
    daysOfWeek: jsonb('days_of_week').$type<number[]>(),
    timesPerWeek: integer('times_per_week'),
    goalDays: integer('goal_days'),
    reminderTime: text('reminder_time'),
    archived: boolean('archived').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('habit_user_idx').on(t.userId)],
)

export const habitCheckin = pgTable(
  'habit_checkin',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    habitId: text('habit_id').notNull(),
    // Local YYYY-MM-DD of the person checking in.
    date: text('date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('habit_checkin_day_idx').on(t.habitId, t.date),
    index('habit_checkin_user_idx').on(t.userId),
  ],
)

// Idempotent DDL, run once per cold start. Kept beside the schema so they stay in step.
export const DDL = `
create table if not exists "user" (id text primary key, name text not null, email text not null unique, email_verified boolean not null default false, image text, is_anonymous boolean default false, created_at timestamp not null default now(), updated_at timestamp not null default now());
create table if not exists "session" (id text primary key, expires_at timestamp not null, token text not null unique, created_at timestamp not null default now(), updated_at timestamp not null default now(), ip_address text, user_agent text, user_id text not null references "user"(id) on delete cascade);
create table if not exists "account" (id text primary key, account_id text not null, provider_id text not null, user_id text not null references "user"(id) on delete cascade, access_token text, refresh_token text, id_token text, access_token_expires_at timestamp, refresh_token_expires_at timestamp, scope text, password text, created_at timestamp not null default now(), updated_at timestamp not null default now());
create table if not exists "verification" (id text primary key, identifier text not null, value text not null, expires_at timestamp not null, created_at timestamp not null default now(), updated_at timestamp not null default now());
create table if not exists "category" (id text primary key, user_id text not null, name text not null, color text not null default 'lavender', icon text not null default 'folder', position integer not null default 0, created_at timestamp not null default now(), updated_at timestamp not null default now());
create index if not exists category_user_idx on "category"(user_id);
create table if not exists "task" (id text primary key, user_id text not null, title text not null, category_id text, start_date text, start_time text, end_time text, due_date text, priority text not null default 'medium', status text not null default 'todo', completed_at timestamp, remind boolean not null default false, position integer not null default 0, created_at timestamp not null default now(), updated_at timestamp not null default now());
create index if not exists task_user_idx on "task"(user_id);
create table if not exists "subtask" (id text primary key, user_id text not null, task_id text not null, title text not null, done boolean not null default false, position integer not null default 0, created_at timestamp not null default now());
create index if not exists subtask_task_idx on "subtask"(task_id);
create table if not exists "note" (id text primary key, user_id text not null, title text not null default '', body text not null default '', color text not null default 'surface', pinned boolean not null default false, task_id text, is_scratchpad boolean not null default false, created_at timestamp not null default now(), updated_at timestamp not null default now());
create index if not exists note_user_idx on "note"(user_id);
create table if not exists "prefs" (user_id text primary key, display_name text, theme text not null default 'dark', seeded boolean not null default false, sounds boolean not null default true, updated_at timestamp not null default now());
alter table "prefs" add column if not exists onboarded_at timestamp;
alter table "prefs" add column if not exists nudge_state jsonb;
alter table "prefs" add column if not exists pending_merge jsonb;
create table if not exists "ai_usage" (user_id text not null, day text not null, count integer not null default 0, primary key (user_id, day));
create table if not exists "habit" (id text primary key, user_id text not null, name text not null, icon text not null default 'flame', category_id text, color text not null default 'butter', frequency text not null default 'daily', days_of_week jsonb, times_per_week integer, goal_days integer, reminder_time text, archived boolean not null default false, position integer not null default 0, created_at timestamp not null default now(), updated_at timestamp not null default now());
create index if not exists habit_user_idx on "habit"(user_id);
create table if not exists "habit_checkin" (id text primary key, user_id text not null, habit_id text not null, date text not null, created_at timestamp not null default now());
create unique index if not exists habit_checkin_day_idx on "habit_checkin"(habit_id, date);
create index if not exists habit_checkin_user_idx on "habit_checkin"(user_id);
alter table "task" add column if not exists repeat_rule jsonb;
alter table "task" add column if not exists repeat_end jsonb;
alter table "task" add column if not exists remind_offset integer;
alter table "task" add column if not exists remind_at timestamp;
update "task" set remind_offset = 0 where remind = true and remind_offset is null;
create index if not exists task_remind_at_idx on "task"(remind_at);
alter table "prefs" add column if not exists timezone text;
create table if not exists "push_subscription" (id text primary key, user_id text not null, endpoint text not null unique, p256dh text not null, auth text not null, user_agent text, created_at timestamp not null default now());
create index if not exists push_subscription_user_idx on "push_subscription"(user_id);
`

export const schema = {
  user,
  session,
  account,
  verification,
  category,
  task,
  subtask,
  note,
  prefs,
  aiUsage,
  habit,
  habitCheckin,
  pushSubscription,
}
