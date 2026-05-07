-- ============================================================================
-- ORDERS TABLE
-- Tracks gig orders placed by clients to students
-- ============================================================================

create table public.orders (
  id uuid not null default gen_random_uuid (),
  gig_id uuid not null,
  client_id uuid not null,
  student_id uuid not null,
  package_name text not null,
  package_index integer not null default 0,
  amount numeric(10, 2) not null,
  platform_fee numeric(10, 2) not null default 0,
  delivery_days integer not null,
  revisions integer not null default 0,
  requirements text not null default '',
  status text not null default 'awaiting_payment'::text,
  due_date timestamp with time zone not null,
  client_name text null,
  client_email text null,
  gig_title text null,
  student_name text null,
  student_email text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint orders_pkey primary key (id),
  constraint orders_gig_id_fkey foreign KEY (gig_id) references public.gigs (id) on delete CASCADE,
  constraint orders_client_id_fkey foreign KEY (client_id) references auth.users (id) on delete CASCADE,
  constraint orders_student_id_fkey foreign KEY (student_id) references auth.users (id) on delete CASCADE,
  constraint orders_status_check check (
    (status)::text = any (
      (array[
        'awaiting_payment'::character varying,
        'pending'::character varying,
        'in_progress'::character varying,
        'delivered'::character varying,
        'revision_requested'::character varying,
        'completed'::character varying,
        'cancelled'::character varying,
        'disputed'::character varying
      ])::text[]
    )
  )
) TABLESPACE pg_default;

-- Indexes for performance
create index IF not exists idx_orders_client_id on public.orders using btree (client_id) TABLESPACE pg_default;
create index IF not exists idx_orders_student_id on public.orders using btree (student_id) TABLESPACE pg_default;
create index IF not exists idx_orders_gig_id on public.orders using btree (gig_id) TABLESPACE pg_default;
create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;
create index IF not exists idx_orders_created_at on public.orders using btree (created_at desc) TABLESPACE pg_default;

-- Auto-update updated_at on row change
create trigger orders_set_updated_at BEFORE
update on public.orders for EACH row
execute FUNCTION set_updated_at ();