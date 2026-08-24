create extension if not exists "pgcrypto";

create table operators (
    name text primary key,
    gender text not null,
    role text not null,
    side text not null,
    speed int not null,
    armor int not null,
    release_year int not null,
    secondary_gadgets text[] not null default '{}',
    secondary_weapons text[] not null default '{}',
    primary_weapons text[] not null default '{}'
);

insert into operators (name, gender, role, side, speed, armor, release_year, secondary_gadgets, secondary_weapons, primary_weapons) values
('Ash', 'Female', 'Breach', 'Attack', 3, 1, 2015, ARRAY['Breach Charge', 'Claymore']::text[], ARRAY['5.7 USG', 'GONNE-6']::text[], ARRAY['G36C', 'R4-C']::text[]),
('Bandit', 'Male', 'Anti-Gadget', 'Defense', 3, 1, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P12', 'Super Shorty']::text[], ARRAY['MP7', 'M590A1']::text[]),
('Blitz', 'Male', 'Front Line', 'Defense', 2, 2, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P12']::text[], ARRAY[]::text[]),
('Castle', 'Male', 'Anti-Entry', 'Defense', 2, 2, 2015, ARRAY['Barbed Wire', 'Nitro Cell']::text[], ARRAY['P12']::text[], ARRAY['UMP45', 'M1014']::text[]),
('Doc', 'Male', 'Support', 'Defense', 1, 3, 2015, ARRAY['Bulletproof Camera', 'Barbed Wire']::text[], ARRAY['P9']::text[], ARRAY['MP5', 'P90']::text[]),
('Fuze', 'Male', 'Front Line', 'Attack', 1, 3, 2015, ARRAY['Frag Grenade', 'Breach Charge']::text[], ARRAY['GSH-18', 'Bearing 9']::text[], ARRAY['AK-12', '6P41']::text[]),
('Glaz', 'Male', 'Support', 'Attack', 3, 1, 2015, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['GSH-18', 'PMM']::text[], ARRAY['OTs-03']::text[]),
('IQ', 'Female', 'Intel', 'Attack', 3, 1, 2015, ARRAY['Frag Grenade', 'Breach Charge']::text[], ARRAY['P12']::text[], ARRAY['552 Commando', 'AUG A2']::text[]),
('Jäger', 'Male', 'Anti-Gadget', 'Defense', 2, 2, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P12']::text[], ARRAY['416-C Carbine', 'M870']::text[]),
('Kapkan', 'Male', 'Trapper', 'Defense', 2, 2, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['PMM', 'GSH-18']::text[], ARRAY['9x19VSN', 'SASG-12']::text[]),
('Montagne', 'Male', 'Front Line', 'Attack', 1, 3, 2015, ARRAY['Smoke Grenade', 'Breach Charge']::text[], ARRAY['P9']::text[], ARRAY[]::text[]),
('Mute', 'Male', 'Anti-Gadget', 'Defense', 1, 3, 2015, ARRAY['Barbed Wire', 'Nitro Cell']::text[], ARRAY['P12']::text[], ARRAY['MP5K', 'M590A1']::text[]),
('Pulse', 'Male', 'Intel', 'Defense', 3, 1, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['UMP45', 'M1014']::text[]),
('Rook', 'Male', 'Support', 'Defense', 1, 3, 2015, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P12']::text[], ARRAY['MP5', 'M590A1']::text[]),
('Sledge', 'Male', 'Breach', 'Attack', 2, 2, 2015, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['L85A2', 'M590A1']::text[]),
('Smoke', 'Male', 'Anti-Entry', 'Defense', 2, 2, 2015, ARRAY['Barbed Wire', 'Deployable Shield']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['FMG-9', 'M590A1']::text[]),
('Tachanka', 'Male', 'Crowd Control', 'Defense', 1, 3, 2015, ARRAY['Proximity Alarm', 'Impact Grenade']::text[], ARRAY['PMM', 'GSH-18']::text[], ARRAY['6P41', 'DP27']::text[]),
('Thatcher', 'Male', 'Anti-Gadget', 'Attack', 1, 3, 2015, ARRAY['Flash Grenade', 'Smoke Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['L85A2', 'AR33']::text[]),
('Thermite', 'Male', 'Breach', 'Attack', 2, 2, 2015, ARRAY['Smoke Grenade', 'Breach Charge']::text[], ARRAY['5.7 USG']::text[], ARRAY['556XI', 'M1014']::text[]),
('Twitch', 'Female', 'Anti-Gadget', 'Attack', 2, 2, 2015, ARRAY['Smoke Grenade', 'Hard Breach Charge']::text[], ARRAY['5.7 USG']::text[], ARRAY['F2', '417']::text[]),
('Buck', 'Male', 'Breach', 'Attack', 2, 2, 2016, ARRAY['Frag Grenade', 'Stun Grenade']::text[], ARRAY['MK1 9mm']::text[], ARRAY['C8-SFW', 'CAMRS']::text[]),
('Frost', 'Female', 'Trapper', 'Defense', 2, 2, 2016, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['Super Shorty', 'P9']::text[], ARRAY['9mm C1', 'SuperNova']::text[]),
('Blackbeard', 'Male', 'Front Line', 'Attack', 1, 3, 2016, ARRAY['Frag Grenade', 'Claymore']::text[], ARRAY['1911 TACOPS']::text[], ARRAY['SR-25', 'M590A1']::text[]),
('Valkyrie', 'Female', 'Intel', 'Defense', 2, 2, 2016, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['D-50', '5.7 USG']::text[], ARRAY['MP5SD', 'SPAS-12']::text[]),
('Capitão', 'Male', 'Front Line', 'Attack', 3, 1, 2016, ARRAY['Smoke Grenade', 'Claymore']::text[], ARRAY['PRB92']::text[], ARRAY['PARA-308', 'M249']::text[]),
('Caveira', 'Female', 'Intel', 'Defense', 3, 1, 2016, ARRAY['Proximity Alarm', 'Impact Grenade']::text[], ARRAY['Luison']::text[], ARRAY['M12', 'SPAS-15']::text[]),
('Echo', 'Male', 'Intel', 'Defense', 1, 3, 2016, ARRAY['Barbed Wire', 'Nitro Cell']::text[], ARRAY['FN Five-seveN']::text[], ARRAY['MP5', 'M590A1']::text[]),
('Hibana', 'Female', 'Breach', 'Attack', 3, 1, 2016, ARRAY['Stun Grenade', 'Breach Charge']::text[], ARRAY['P229']::text[], ARRAY['Type-89', 'SUPERNOVA']::text[]),
('Jackal', 'Male', 'Intel', 'Attack', 2, 2, 2017, ARRAY['Hard Breach Charge', 'Claymore']::text[], ARRAY['ITA12L', 'USP40']::text[], ARRAY['C7E', 'PDW9']::text[]),
('Mira', 'Female', 'Support', 'Defense', 1, 3, 2017, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['LFP586']::text[], ARRAY['Vector .45 ACP', 'ITA12S']::text[]),
('Lesion', 'Male', 'Trapper', 'Defense', 2, 2, 2017, ARRAY['Proximity Alarm', 'Impact Grenade']::text[], ARRAY['Q-929']::text[], ARRAY['T-95 LSW', 'SUPERNOVA']::text[]),
('Ying', 'Female', 'Crowd Control', 'Attack', 2, 2, 2017, ARRAY['Frag Grenade', 'Hard Breach Charge']::text[], ARRAY['Q-929']::text[], ARRAY['T-95 LSW', 'SIX12']::text[]),
('Ela', 'Female', 'Trapper', 'Defense', 2, 2, 2017, ARRAY['Barbed Wire', 'Nitro Cell']::text[], ARRAY['RG15']::text[], ARRAY['Scorpion EVO 3 A1', 'Super 90']::text[]),
('Zofia', 'Female', 'Front Line', 'Attack', 1, 3, 2017, ARRAY['Impact Grenade', 'Breach Charge']::text[], ARRAY['RG15']::text[], ARRAY['M762', 'ARX200']::text[]),
('Dokkaebi', 'Female', 'Intel', 'Attack', 3, 1, 2017, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['PMM']::text[], ARRAY['Bizon', 'SR-25']::text[]),
('Vigil', 'Male', 'Anti-Gadget', 'Defense', 3, 1, 2017, ARRAY['Proximity Alarm', 'Impact Grenade']::text[], ARRAY['P12']::text[], ARRAY['K1A', '9x19VSN']::text[]),
('Lion', 'Male', 'Intel', 'Attack', 2, 2, 2018, ARRAY['Smoke Grenade', 'Claymore']::text[], ARRAY['LFP586']::text[], ARRAY['V308', '417']::text[]),
('Finka', 'Female', 'Support', 'Attack', 2, 2, 2018, ARRAY['Frag Grenade', 'Breach Charge']::text[], ARRAY['GSH-18']::text[], ARRAY['Spear .308', '6P41']::text[]),
('Alibi', 'Female', 'Trapper', 'Defense', 3, 1, 2018, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['ITA12S']::text[], ARRAY['MX4 Storm', 'ACS12']::text[]),
('Maestro', 'Male', 'Intel', 'Defense', 1, 3, 2018, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['Bailiff 410']::text[], ARRAY['ALDA 5.56', 'ACS12']::text[]),
('Maverick', 'Male', 'Breach', 'Attack', 3, 1, 2018, ARRAY['Frag Grenade', 'Claymore']::text[], ARRAY['1911 TACOPS']::text[], ARRAY['AR-15.50', 'M4']::text[]),
('Clash', 'Female', 'Crowd Control', 'Defense', 1, 3, 2018, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SPSMG9']::text[], ARRAY[]::text[]),
('Kaid', 'Male', 'Anti-Gadget', 'Defense', 1, 3, 2018, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['Bailiff 410']::text[], ARRAY['TCSG12', 'AUG A3']::text[]),
('Nomad', 'Female', 'Crowd Control', 'Attack', 2, 2, 2018, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['ITA12L']::text[], ARRAY['AK-74M', 'ARX200']::text[]),
('Gridlock', 'Female', 'Crowd Control', 'Attack', 1, 3, 2019, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['Bearing 9']::text[], ARRAY['F90', 'M249']::text[]),
('Mozzie', 'Male', 'Intel', 'Defense', 2, 2, 2019, ARRAY['Nitro Cell', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['Commando 9', 'P10 RONI']::text[]),
('Nøkk', 'Female', 'Intel', 'Attack', 2, 2, 2019, ARRAY['Frag Grenade', 'Hard Breach Charge']::text[], ARRAY['5.7 USG']::text[], ARRAY['FMG-9', 'SIX12 SD']::text[]),
('Warden', 'Male', 'Support', 'Defense', 1, 3, 2019, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['ITA12S']::text[], ARRAY['M590A1', 'MP5']::text[]),
('Amaru', 'Female', 'Front Line', 'Attack', 2, 2, 2019, ARRAY['Frag Grenade', 'Breach Charge']::text[], ARRAY['SDP 9mm']::text[], ARRAY['G8A1', 'Supernova']::text[]),
('Goyo', 'Male', 'Anti-Entry', 'Defense', 2, 2, 2019, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['ITA12S']::text[], ARRAY['TCSG12', 'Talon-5']::text[]),
('Kali', 'Female', 'Breach', 'Attack', 2, 2, 2019, ARRAY['Smoke Grenade', 'Claymore']::text[], ARRAY['SPSMG9', 'C75 Auto']::text[], ARRAY['CSRX 300']::text[]),
('Wamai', 'Male', 'Anti-Gadget', 'Defense', 2, 2, 2019, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['GSH-18']::text[], ARRAY['SMG-11', 'M12']::text[]),
('Iana', 'Female', 'Intel', 'Attack', 2, 2, 2020, ARRAY['Frag Grenade', 'Hard Breach Charge']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['ARX200', 'SIX12 SD']::text[]),
('Oryx', 'Male', 'Front Line', 'Defense', 2, 2, 2020, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['PMM']::text[], ARRAY['Bizon', 'ITA12S']::text[]),
('Ace', 'Male', 'Breach', 'Attack', 2, 2, 2020, ARRAY['Frag Grenade', 'Claymore']::text[], ARRAY['Q-929']::text[], ARRAY['AK-12', 'M1014']::text[]),
('Melusi', 'Female', 'Crowd Control', 'Defense', 1, 3, 2020, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['Vector .45 ACP', 'SIX12']::text[]),
('Zero', 'Male', 'Intel', 'Attack', 3, 1, 2020, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['5.7 USG']::text[], ARRAY['417', 'AR33']::text[]),
('Aruni', 'Female', 'Anti-Entry', 'Defense', 1, 3, 2020, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['PMM']::text[], ARRAY['ARX200', 'SASG-12']::text[]),
('Flores', 'Male', 'Anti-Gadget', 'Attack', 2, 2, 2021, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['P9']::text[], ARRAY['SR-25', 'AR33']::text[]),
('Thunderbird', 'Female', 'Support', 'Defense', 2, 2, 2021, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['SIX12 SD', 'TCSG12']::text[]),
('Osa', 'Female', 'Support', 'Attack', 1, 3, 2021, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['556XI', 'SIX12']::text[]),
('Thorn', 'Female', 'Trapper', 'Defense', 2, 2, 2021, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['614-Precision', 'ITA12L']::text[]),
('Azami', 'Female', 'Anti-Entry', 'Defense', 2, 2, 2022, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['ISG', 'Vector .45 ACP']::text[]),
('Sens', 'Non-binary', 'Support', 'Attack', 3, 1, 2022, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['GSH-18']::text[], ARRAY['417', 'AR33']::text[]),
('Grim', 'Male', 'Intel', 'Attack', 3, 1, 2022, ARRAY['Smoke Grenade', 'Hard Breach Charge']::text[], ARRAY['5.7 USG']::text[], ARRAY['SIX12', 'ITA12L']::text[]),
('Solis', 'Female', 'Intel', 'Defense', 2, 2, 2022, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['SR-25', 'M590A1']::text[]),
('Brava', 'Female', 'Anti-Gadget', 'Attack', 2, 2, 2023, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['GSH-18']::text[], ARRAY['556XI', 'M249']::text[]),
('Fenrir', 'Male', 'Crowd Control', 'Defense', 2, 2, 2023, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['MPX', 'SASG-12']::text[]),
('Ram', 'Female', 'Breach', 'Attack', 1, 3, 2023, ARRAY['Frag Grenade', 'Claymore']::text[], ARRAY['GSH-18']::text[], ARRAY['ARX200', '556XI']::text[]),
('Tubarão', 'Male', 'Anti-Gadget', 'Defense', 2, 2, 2023, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['Bailiff 410']::text[], ARRAY['M870', 'PARA-308']::text[]),
('Deimos', 'Male', 'Intel', 'Attack', 2, 2, 2024, ARRAY['Frag Grenade', 'Smoke Grenade']::text[], ARRAY['P226 Mk 25']::text[], ARRAY['556XI', 'M249']::text[]),
('Striker', 'Variable', 'Support', 'Attack', 2, 2, 2024, ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
('Sentry', 'Variable', 'Support', 'Defense', 2, 2, 2024, ARRAY[]::text[], ARRAY[]::text[], ARRAY[]::text[]),
('Skopós', 'Female', 'Intel', 'Defense', 2, 2, 2024, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['SDP 9mm']::text[], ARRAY['417', 'M1014']::text[]),
('Rauora', 'Female', 'Support', 'Attack', 2, 2, 2025, ARRAY['Smoke Grenade', 'Breach Charge']::text[], ARRAY['GSH-18', 'Reaper MK2']::text[], ARRAY['417', 'M249']::text[]),
('Denari', 'Male', 'Anti-Entry', 'Defense', 3, 1, 2025, ARRAY['Barbed Wire', 'Impact Grenade']::text[], ARRAY['P12']::text[], ARRAY['M12', 'AR33']::text[]);

create table profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null unique,
    display_name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table profile_stats (
    profile_id uuid primary key references profiles (id) on delete cascade,
    games_played int not null default 0,
    games_won int not null default 0,
    total_guesses int not null default 0,
    current_streak int not null default 0,
    best_streak int not null default 0,
    best_score int,
    updated_at timestamptz not null default now()
);

create table game_results (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references profiles (id) on delete cascade,
    mode text not null,
    won boolean not null,
    guesses int not null,
    room_id uuid,
    created_at timestamptz not null default now()
);

create table rooms (
    id uuid primary key default gen_random_uuid(),
    code text not null,
    host_id uuid not null references profiles (id) on delete cascade,
    status text not null default 'lobby',
    max_players int not null default 6 check (max_players between 2 and 6),
    -- public: listed for anyone to browse and join.
    -- private: listed, but joining (by list or by code) requires the password.
    -- hidden: never listed; joinable only by someone who already has the code.
    visibility text not null default 'public' check (visibility in ('public', 'private', 'hidden')),
    -- bcrypt hash (pgcrypto's crypt/gen_salt), only set when visibility = 'private'.
    -- Never selectable by clients -- see the rooms RLS policy below, which
    -- only exposes rows via list_open_rooms()'s safe column set before a
    -- player has joined.
    password_hash text,
    round_started_at timestamptz,
    created_at timestamptz not null default now(),
    last_activity_at timestamptz not null default now()
);

create unique index rooms_code_active_idx on rooms (code) where status <> 'closed';

-- The mystery operator is stored SEPARATELY from `rooms` on purpose.
-- `rooms` has realtime enabled and is directly selectable by room members,
-- so anything in that table (including values inside realtime payloads)
-- is visible to every client in the room. room_secrets has NO select
-- policies at all (RLS default-denies everyone, including the players in
-- the room) -- it can only be read from inside SECURITY DEFINER functions,
-- which run with elevated privileges and bypass RLS. This is what stops a
-- player from opening devtools and reading the answer out of a network
-- response or the realtime socket.
create table room_secrets (
    room_id uuid primary key references rooms (id) on delete cascade,
    mystery_operator_name text not null references operators (name)
);

create table room_players (
    room_id uuid not null references rooms (id) on delete cascade,
    profile_id uuid not null references profiles (id) on delete cascade,
    username text not null,
    joined_at timestamptz not null default now(),
    guesses_count int not null default 0,
    solved boolean not null default false,
    solved_at timestamptz,
    finished boolean not null default false,
    left_at timestamptz,
    primary key (room_id, profile_id)
);

create table room_guesses (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms (id) on delete cascade,
    profile_id uuid not null references profiles (id) on delete cascade,
    guess_operator_name text not null references operators (name),
    is_correct boolean not null,
    guess_number int not null,
    -- Per-field match/higher/lower/mismatch states for this guess, e.g.
    -- [{"key":"gender","state":"match","guessValue":"Male"}, ...]. Needed
    -- so other players in the room can see this guess's correctness (as
    -- emoji squares) without re-deriving it from the still-secret mystery
    -- operator.
    field_states jsonb not null default '[]'::jsonb,
    created_at timestamptz not null default now()
);

create index room_players_room_idx on room_players (room_id);
create index room_guesses_room_profile_idx on room_guesses (room_id, profile_id);
create index game_results_profile_idx on game_results (profile_id);
create index rooms_code_idx on rooms (code);

alter table profiles enable row level security;
alter table profile_stats enable row level security;
alter table game_results enable row level security;
alter table rooms enable row level security;
alter table room_players enable row level security;
alter table room_guesses enable row level security;
alter table operators enable row level security;
alter table room_secrets enable row level security;
-- Deliberately no policies on room_secrets: with RLS enabled and zero
-- policies, every role (including authenticated) is denied select/insert/
-- update/delete. Only SECURITY DEFINER functions owned by the table owner
-- can read or write it.
revoke all on room_secrets from authenticated, anon;

create policy "operators are publicly readable"
    on operators for select
    using (true);

create policy "profiles are publicly readable"
    on profiles for select
    using (true);

create policy "a user can insert only their own profile"
    on profiles for insert
    with check (auth.uid() = id);

create policy "a user can update only their own profile"
    on profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "stats are publicly readable"
    on profile_stats for select
    using (true);

create policy "a user can read only their own game results"
    on game_results for select
    using (auth.uid() = profile_id);

create policy "rooms are readable when public, joined, or hosted"
    on rooms for select
    using (
        (visibility = 'public' and status = 'lobby')
        or host_id = auth.uid()
        or exists (
            select 1 from room_players rp
            where rp.room_id = rooms.id and rp.profile_id = auth.uid() and rp.left_at is null
        )
    );

create policy "room players are readable by anyone signed in"
    on room_players for select
    using (auth.role() = 'authenticated');

create policy "a player can read only their own room guesses"
    on room_guesses for select
    using (auth.uid() = profile_id);

revoke insert, update, delete on profile_stats from authenticated;
revoke insert, update, delete on game_results from authenticated;
revoke insert, update, delete on rooms from authenticated;
revoke insert, update, delete on room_players from authenticated;
revoke insert, update, delete on room_guesses from authenticated;

create or replace function handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger profiles_set_updated_at
    before update on profiles
    for each row execute function handle_updated_at();

create or replace function is_valid_username(candidate text)
returns boolean
language sql
immutable
as $$
    select candidate ~ '^[A-Za-z0-9_-]{3,20}$';
$$;

create or replace function create_profile(p_username text, p_display_name text)
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
    result profiles;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if not is_valid_username(p_username) then
        raise exception 'invalid username';
    end if;

    if exists (select 1 from profiles where lower(username) = lower(p_username)) then
        raise exception 'username taken';
    end if;

    insert into profiles (id, username, display_name)
    values (auth.uid(), p_username, coalesce(nullif(trim(p_display_name), ''), p_username))
    returning * into result;

    insert into profile_stats (profile_id) values (auth.uid());

    return result;
end;
$$;

grant execute on function create_profile(text, text) to authenticated;

create or replace function record_singleplayer_result(p_won boolean, p_guesses int)
returns profile_stats
language plpgsql
security definer
set search_path = public
as $$
declare
    result profile_stats;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if p_guesses < 1 or p_guesses > 10 then
        raise exception 'invalid guess count';
    end if;

    insert into game_results (profile_id, mode, won, guesses)
    values (auth.uid(), 'singleplayer', p_won, p_guesses);

    update profile_stats
    set games_played = games_played + 1,
        games_won = games_won + case when p_won then 1 else 0 end,
        total_guesses = total_guesses + p_guesses,
        current_streak = case when p_won then current_streak + 1 else 0 end,
        best_streak = case when p_won then greatest(best_streak, current_streak + 1) else best_streak end,
        best_score = case when p_won and (best_score is null or p_guesses < best_score) then p_guesses else best_score end,
        updated_at = now()
    where profile_id = auth.uid()
    returning * into result;

    return result;
end;
$$;

grant execute on function record_singleplayer_result(boolean, int) to authenticated;

create or replace function generate_room_code()
returns text
language plpgsql
as $$
declare
    chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    code text := '';
    i int;
begin
    for i in 1..5 loop
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    return code;
end;
$$;

create or replace function create_room(p_max_players int default 6, p_visibility text default 'public', p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    result rooms;
    new_code text;
    tries int := 0;
    picked_operator text;
    stored_hash text;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if p_max_players < 2 or p_max_players > 6 then
        raise exception 'invalid player limit';
    end if;

    if p_visibility not in ('public', 'private', 'hidden') then
        raise exception 'invalid visibility';
    end if;

    if p_visibility = 'private' then
        if p_password is null or length(trim(p_password)) < 1 then
            raise exception 'private rooms require a password';
        end if;
        stored_hash := crypt(p_password, gen_salt('bf'));
    else
        stored_hash := null;
    end if;

    loop
        new_code := generate_room_code();
        tries := tries + 1;
        exit when not exists (select 1 from rooms where code = new_code and status <> 'closed');
        if tries > 20 then
            raise exception 'could not allocate room code';
        end if;
    end loop;

    select name into picked_operator from operators order by random() limit 1;

    insert into rooms (code, host_id, max_players, visibility, password_hash)
    values (new_code, auth.uid(), p_max_players, p_visibility, stored_hash)
    returning * into result;

    insert into room_secrets (room_id, mystery_operator_name)
    values (result.id, picked_operator);

    insert into room_players (room_id, profile_id, username)
    select result.id, auth.uid(), username from profiles where id = auth.uid();

    return result;
end;
$$;

grant execute on function create_room(int, text, text) to authenticated;

create or replace function list_open_rooms()
returns table (
    id uuid,
    code text,
    visibility text,
    max_players int,
    player_count bigint,
    host_username text
)
language sql
security definer
set search_path = public
as $$
    select r.id, r.code, r.visibility, r.max_players,
           (select count(*) from room_players rp where rp.room_id = r.id and rp.left_at is null) as player_count,
           p.username as host_username
    from rooms r
    join profiles p on p.id = r.host_id
    where r.status = 'lobby' and r.visibility in ('public', 'private')
    order by r.created_at desc
    limit 50;
$$;

grant execute on function list_open_rooms() to authenticated;

create or replace function join_room(p_code text, p_password text default null)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    target rooms;
    player_count int;
    my_username text;
    already_member boolean;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    select * into target from rooms where code = upper(p_code) and status in ('lobby', 'playing');
    if target.id is null then
        raise exception 'room not found';
    end if;

    select exists(
        select 1 from room_players
        where room_id = target.id and profile_id = auth.uid() and left_at is null
    ) into already_member;

    if not already_member then
        if target.visibility = 'private' then
            if p_password is null or target.password_hash is null
                or crypt(p_password, target.password_hash) <> target.password_hash then
                raise exception 'incorrect password';
            end if;
        end if;

        select count(*) into player_count from room_players where room_id = target.id and left_at is null;
        if player_count >= target.max_players then
            raise exception 'room full';
        end if;
        if target.status <> 'lobby' then
            raise exception 'room already started';
        end if;
    end if;

    select username into my_username from profiles where id = auth.uid();

    insert into room_players (room_id, profile_id, username)
    values (target.id, auth.uid(), my_username)
    on conflict (room_id, profile_id) do update set left_at = null, username = excluded.username;

    update rooms set last_activity_at = now() where id = target.id;

    return target;
end;
$$;

grant execute on function join_room(text, text) to authenticated;

create or replace function leave_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    new_host uuid;
    is_current_host boolean;
    remaining_count int;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    update room_players set left_at = now()
    where room_id = p_room_id and profile_id = auth.uid();

    select (host_id = auth.uid()) into is_current_host from rooms where id = p_room_id;

    select count(*) into remaining_count from room_players
    where room_id = p_room_id and left_at is null;

    if remaining_count = 0 then
        update rooms set status = 'closed', last_activity_at = now() where id = p_room_id;
        return;
    end if;

    if is_current_host then
        select profile_id into new_host from room_players
        where room_id = p_room_id and left_at is null
        order by joined_at asc limit 1;

        update rooms set host_id = new_host, last_activity_at = now() where id = p_room_id;
    end if;
end;
$$;

grant execute on function leave_room(uuid) to authenticated;

create or replace function start_room(p_room_id uuid)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    result rooms;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if not exists (select 1 from rooms where id = p_room_id and host_id = auth.uid()) then
        raise exception 'only the host can start the game';
    end if;

    update rooms
    set status = 'playing', round_started_at = now(), last_activity_at = now()
    where id = p_room_id
    returning * into result;

    return result;
end;
$$;

grant execute on function start_room(uuid) to authenticated;

create or replace function mp_submit_guess(p_room_id uuid, p_operator_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    room rooms;
    player room_players;
    mystery operators;
    guess operators;
    result jsonb;
    field_result jsonb;
    fields jsonb := '[]'::jsonb;
    is_correct boolean;
    next_guess_number int;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    select * into room from rooms where id = p_room_id and status = 'playing';
    if room.id is null then
        raise exception 'room not in progress';
    end if;

    select * into player from room_players
    where room_id = p_room_id and profile_id = auth.uid() and left_at is null;
    if player.room_id is null then
        raise exception 'not in this room';
    end if;

    if player.finished then
        raise exception 'already finished';
    end if;

    if player.guesses_count >= 10 then
        raise exception 'no guesses remaining';
    end if;

    select * into guess from operators where name = p_operator_name;
    if guess.name is null then
        raise exception 'unknown operator';
    end if;

    select o.* into mystery
    from room_secrets rs
    join operators o on o.name = rs.mystery_operator_name
    where rs.room_id = p_room_id;

    is_correct := guess.name = mystery.name;
    next_guess_number := player.guesses_count + 1;

    fields := fields || jsonb_build_object('key', 'gender', 'state', case when guess.gender = mystery.gender then 'match' else 'mismatch' end, 'guessValue', guess.gender);
    fields := fields || jsonb_build_object('key', 'role', 'state', case when guess.role = mystery.role then 'match' else 'mismatch' end, 'guessValue', guess.role);
    fields := fields || jsonb_build_object('key', 'side', 'state', case when guess.side = mystery.side then 'match' else 'mismatch' end, 'guessValue', guess.side);
    fields := fields || jsonb_build_object('key', 'speed', 'state', case when guess.speed = mystery.speed then 'match' when mystery.speed > guess.speed then 'higher' else 'lower' end, 'guessValue', guess.speed);
    fields := fields || jsonb_build_object('key', 'armor', 'state', case when guess.armor = mystery.armor then 'match' when mystery.armor > guess.armor then 'higher' else 'lower' end, 'guessValue', guess.armor);
    fields := fields || jsonb_build_object('key', 'releaseYear', 'state', case when guess.release_year = mystery.release_year then 'match' when mystery.release_year > guess.release_year then 'higher' else 'lower' end, 'guessValue', guess.release_year);

    insert into room_guesses (room_id, profile_id, guess_operator_name, is_correct, guess_number, field_states)
    values (p_room_id, auth.uid(), guess.name, is_correct, next_guess_number, fields);

    update room_players
    set guesses_count = next_guess_number,
        solved = is_correct,
        solved_at = case when is_correct then now() else solved_at end,
        finished = is_correct or next_guess_number >= 10
    where room_id = p_room_id and profile_id = auth.uid();

    update rooms set last_activity_at = now() where id = p_room_id;

    result := jsonb_build_object(
        'isCorrect', is_correct,
        'guessNumber', next_guess_number,
        'fields', fields,
        'operatorName', guess.name,
        'mysteryOperatorName', case when is_correct or next_guess_number >= 10 then mystery.name else null end,
        'hints', jsonb_build_object(
            'secondaryGadgets', case when next_guess_number >= 4 then to_jsonb(mystery.secondary_gadgets) else null end,
            'secondaryWeapons', case when next_guess_number >= 6 then to_jsonb(mystery.secondary_weapons) else null end,
            'primaryWeapons', case when next_guess_number >= 8 then to_jsonb(mystery.primary_weapons) else null end
        )
    );

    return result;
end;
$$;

grant execute on function mp_submit_guess(uuid, text) to authenticated;

create or replace function mp_record_result(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    player room_players;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    select * into player from room_players
    where room_id = p_room_id and profile_id = auth.uid();

    if player.room_id is null or not player.finished then
        raise exception 'round not finished for this player';
    end if;

    if exists (select 1 from game_results where profile_id = auth.uid() and room_id = p_room_id) then
        return;
    end if;

    insert into game_results (profile_id, mode, won, guesses, room_id)
    values (auth.uid(), 'multiplayer', player.solved, player.guesses_count, p_room_id);

    update profile_stats
    set games_played = games_played + 1,
        games_won = games_won + case when player.solved then 1 else 0 end,
        total_guesses = total_guesses + player.guesses_count,
        current_streak = case when player.solved then current_streak + 1 else 0 end,
        best_streak = case when player.solved then greatest(best_streak, current_streak + 1) else best_streak end,
        best_score = case when player.solved and (best_score is null or player.guesses_count < best_score) then player.guesses_count else best_score end,
        updated_at = now()
    where profile_id = auth.uid();
end;
$$;

grant execute on function mp_record_result(uuid) to authenticated;

create or replace function get_room_results(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    all_finished boolean;
    reveal text;
    players jsonb;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if not exists (
        select 1 from room_players
        where room_id = p_room_id and profile_id = auth.uid()
    ) then
        raise exception 'not in this room';
    end if;

    select bool_and(finished) into all_finished
    from room_players
    where room_id = p_room_id and left_at is null;

    if all_finished then
        select mystery_operator_name into reveal from room_secrets where room_id = p_room_id;
    else
        reveal := null;
    end if;

    select coalesce(jsonb_agg(row_to_json(ranked) order by ranked.rank_order), '[]'::jsonb)
    into players
    from (
        select
            profile_id,
            username,
            solved,
            finished,
            guesses_count,
            solved_at,
            row_number() over (
                order by
                    solved desc,
                    guesses_count asc,
                    solved_at asc nulls last
            ) as rank_order
        from room_players
        where room_id = p_room_id and left_at is null
    ) ranked;

    return jsonb_build_object(
        'allFinished', coalesce(all_finished, false),
        'mysteryOperatorName', reveal,
        'players', players
    );
end;
$$;

grant execute on function get_room_results(uuid) to authenticated;

create or replace function mp_heartbeat(p_room_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
    update rooms set last_activity_at = now()
    where id = p_room_id
    and exists (
        select 1 from room_players
        where room_id = p_room_id and profile_id = auth.uid() and left_at is null
    );
$$;

grant execute on function mp_heartbeat(uuid) to authenticated;

-- Called by any client still connected to the room when it notices (via
-- Realtime Presence) that the current host's presence is gone. Re-checking
-- room membership server-side means a non-member can't hijack a room, and
-- picking "earliest remaining joined_at" server-side means a player can't
-- just declare themselves host.
create or replace function transfer_host_if_absent(p_room_id uuid, p_absent_profile_id uuid)
returns rooms
language plpgsql
security definer
set search_path = public
as $$
declare
    result rooms;
    new_host uuid;
begin
    if auth.uid() is null then
        raise exception 'not authenticated';
    end if;

    if not exists (
        select 1 from room_players
        where room_id = p_room_id and profile_id = auth.uid() and left_at is null
    ) then
        raise exception 'not in this room';
    end if;

    if not exists (select 1 from rooms where id = p_room_id and host_id = p_absent_profile_id) then
        select * into result from rooms where id = p_room_id;
        return result;
    end if;

    select profile_id into new_host from room_players
    where room_id = p_room_id and left_at is null and profile_id <> p_absent_profile_id
    order by joined_at asc limit 1;

    if new_host is null then
        select * into result from rooms where id = p_room_id;
        return result;
    end if;

    update rooms set host_id = new_host, last_activity_at = now()
    where id = p_room_id
    returning * into result;

    return result;
end;
$$;

grant execute on function transfer_host_if_absent(uuid, uuid) to authenticated;

create or replace function cleanup_stale_rooms()
returns void
language sql
security definer
set search_path = public
as $$
    update rooms set status = 'closed'
    where status <> 'closed' and last_activity_at < now() - interval '1 hour';
$$;

grant execute on function cleanup_stale_rooms() to authenticated;

-- Best-effort scheduled cleanup. pg_cron is available on all Supabase
-- plans (Database -> Extensions -> pg_cron). If it's not enabled this
-- block is skipped with a notice instead of failing the whole script, so
-- you can still run this file before turning pg_cron on and re-run this
-- part later -- see the README/setup steps for the manual alternative.
do $$
begin
    if exists (select 1 from pg_extension where extname = 'pg_cron') then
        perform cron.schedule(
            'rainbowdle-cleanup-stale-rooms',
            '*/15 * * * *',
            $cron$select public.cleanup_stale_rooms();$cron$
        );
    else
        raise notice 'pg_cron extension is not enabled; skipping automatic schedule. Enable it in Database > Extensions, then re-run just this DO block, or call cleanup_stale_rooms() from a scheduled Edge Function instead.';
    end if;
end;
$$;

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_players;
alter publication supabase_realtime add table room_guesses;

create view leaderboard as
select
    p.username,
    p.display_name,
    s.games_played,
    s.games_won,
    case when s.games_played > 0 then round(100.0 * s.games_won / s.games_played, 1) else 0 end as win_percentage,
    case when s.games_won > 0 then round(s.total_guesses::numeric / greatest(s.games_won, 1), 1) else null end as average_guesses,
    s.best_score,
    s.current_streak,
    s.best_streak
from profile_stats s
join profiles p on p.id = s.profile_id
where s.games_played > 0;

grant select on leaderboard to authenticated, anon;