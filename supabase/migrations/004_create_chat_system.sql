-- ============================================================================
-- CHAT SYSTEM — Conversations & Messages tables
-- Real-time messaging between clients and students
-- ============================================================================

-- 1. CONVERSATIONS TABLE
create table public.conversations (
  id uuid not null default gen_random_uuid (),
  participant_ids uuid[] not null default '{}'::uuid[],
  participant_names text[] not null default '{}'::text[],
  participant_avatars text[] not null default '{}'::text[],
  participant_roles text[] not null default '{}'::text[],
  last_message text null,
  last_message_at timestamp with time zone null,
  last_sender_id uuid null,
  last_sender_name text null,
  gig_id uuid null,
  gig_title text null,
  order_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint conversations_pkey primary key (id)
) TABLESPACE pg_default;

-- Indexes for faster conversation lookups
create index idx_conversations_participants on public.conversations using gin (participant_ids) TABLESPACE pg_default;
create index idx_conversations_last_message_at on public.conversations using btree (last_message_at desc) TABLESPACE pg_default;
create index idx_conversations_gig_id on public.conversations using btree (gig_id) TABLESPACE pg_default;
create index idx_conversations_order_id on public.conversations using btree (order_id) TABLESPACE pg_default;

-- Auto-update updated_at
create trigger conversations_set_updated_at BEFORE
update on public.conversations for EACH row
execute FUNCTION set_updated_at ();

-- 2. MESSAGES TABLE
create table public.messages (
  id uuid not null default gen_random_uuid (),
  conversation_id uuid not null,
  sender_id uuid not null,
  sender_name text not null,
  sender_role text not null default '',
  content text not null default '',
  message_type text not null default 'text'::text,
  metadata jsonb null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint messages_pkey primary key (id),
  constraint messages_conversation_id_fkey foreign KEY (conversation_id) references public.conversations (id) on delete CASCADE,
  constraint messages_sender_id_fkey foreign KEY (sender_id) references auth.users (id) on delete CASCADE,
  constraint messages_message_type_check check (
    (message_type)::text = any (
      (array[
        'text'::character varying,
        'image'::character varying,
        'file'::character varying,
        'link'::character varying,
        'system'::character varying
      ])::text[]
    )
  )
) TABLESPACE pg_default;

-- Indexes for message retrieval
create index idx_messages_conversation_id on public.messages using btree (conversation_id) TABLESPACE pg_default;
create index idx_messages_created_at on public.messages using btree (conversation_id, created_at asc) TABLESPACE pg_default;
create index idx_messages_sender_id on public.messages using btree (sender_id) TABLESPACE pg_default;

-- 3. Enable real-time replication for both tables
-- Run these commands in the Supabase SQL editor:
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- (The above commands are commented out intentionally — they must be run
--  separately after the migration is applied.
--  Alternatively, enable via the Supabase Dashboard under Database > Replication.)

comment on table public.conversations is 'Chat conversations between participants';
comment on table public.messages is 'Individual messages within a conversation';
comment on column public.messages.message_type is 'text, image, file, link, or system';
comment on column public.messages.metadata is 'JSON with file metadata: {fileName, fileSize, fileType, fileUrl, thumbnailUrl, imageWidth, imageHeight, linkTitle, linkDescription, linkImage}';