create extension if not exists pgcrypto;

create table if not exists public.pvp_rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid references auth.users(id) on delete set null,
  status text not null default 'waiting' check (status in ('waiting','active','battle','finished')),
  battle_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pvp_actions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.pvp_rooms(id) on delete cascade,
  player_id uuid not null references auth.users(id) on delete cascade,
  turn integer not null check (turn > 0),
  action jsonb not null,
  created_at timestamptz not null default now(),
  unique(room_id, player_id, turn)
);

alter table public.pvp_rooms enable row level security;
alter table public.pvp_actions enable row level security;

DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_rooms' AND policyname='pvp room participants select') THEN
  CREATE POLICY "pvp room participants select" ON public.pvp_rooms FOR SELECT TO authenticated USING (auth.uid()=host_id OR auth.uid()=guest_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_rooms' AND policyname='pvp room host insert') THEN
  CREATE POLICY "pvp room host insert" ON public.pvp_rooms FOR INSERT TO authenticated WITH CHECK (auth.uid()=host_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_rooms' AND policyname='pvp room participants update') THEN
  CREATE POLICY "pvp room participants update" ON public.pvp_rooms FOR UPDATE TO authenticated USING (auth.uid()=host_id OR auth.uid()=guest_id) WITH CHECK (auth.uid()=host_id OR auth.uid()=guest_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_rooms' AND policyname='pvp room participants delete') THEN
  CREATE POLICY "pvp room participants delete" ON public.pvp_rooms FOR DELETE TO authenticated USING (auth.uid()=host_id OR auth.uid()=guest_id);
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_actions' AND policyname='pvp action participant select') THEN
  CREATE POLICY "pvp action participant select" ON public.pvp_actions FOR SELECT TO authenticated USING (exists(select 1 from public.pvp_rooms r where r.id=room_id and (r.host_id=auth.uid() or r.guest_id=auth.uid())));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_actions' AND policyname='pvp action self insert') THEN
  CREATE POLICY "pvp action self insert" ON public.pvp_actions FOR INSERT TO authenticated WITH CHECK (player_id=auth.uid() and exists(select 1 from public.pvp_rooms r where r.id=room_id and (r.host_id=auth.uid() or r.guest_id=auth.uid())));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='pvp_actions' AND policyname='pvp action participant delete') THEN
  CREATE POLICY "pvp action participant delete" ON public.pvp_actions FOR DELETE TO authenticated USING (exists(select 1 from public.pvp_rooms r where r.id=room_id and r.host_id=auth.uid()));
 END IF;
END $$;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_rooms; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pvp_actions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

create or replace function public.touch_pvp_room()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end;
$$;

drop trigger if exists pvp_rooms_touch on public.pvp_rooms;
create trigger pvp_rooms_touch before update on public.pvp_rooms for each row execute function public.touch_pvp_room();
