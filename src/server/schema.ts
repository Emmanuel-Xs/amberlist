import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

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
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [index('task_user_idx').on(t.userId)],
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
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

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
}
